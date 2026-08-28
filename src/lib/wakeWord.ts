/**
 * wakeWord — تشخیص کلمهٔ بیدار (wake word) واقعی.
 * روش اصلی: تشخیص گفتار پیوسته (Web Speech API) و تطبیق عبارت (مثل «atlas»).
 * روش جایگزین (بدون پشتیبانی مرورگر): تشخیص انرژی صوتی — وقتی سطح صدا از
 * آستانه بالاتر رود و سپس پایین بیاید، به‌عنوان «گفته» تلقی میشود.
 */
export interface WakeWordOptions {
  phrase?: string
  lang?: string
  onWake: (transcript?: string) => void
  onPartial?: (transcript: string) => void
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** تطبیق عبارت بیدار در متن (انعطاف‌پذیر: حذف علائم، تطبیق جزئی) */
export function matchesPhrase(transcript: string, phrase: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
  const t = norm(transcript)
  const p = norm(phrase)
  if (!p) return false
  if (t.includes(p)) return true
  // تطبیق کلمهٔ اول عبارت (مثلاً «atlas» در «atlas گوش کن»)
  const first = p.split(" ")[0]
  return first.length >= 3 && t.split(" ").some((w) => w === first || (w.startsWith(first) && w.length - first.length <= 2))
}

export class WakeWordDetector {
  private opts: WakeWordOptions
  private rec: SpeechRecognitionLike | null = null
  private running = false
  private audioCtx: AudioContext | null = null
  private stream: MediaStream | null = null
  private raf: number | null = null
  private energyMode = false

  constructor(opts: WakeWordOptions) {
    this.opts = opts
  }

  get isRunning(): boolean {
    return this.running
  }

  start = async (): Promise<void> => {
    if (this.running) return
    this.running = true
    const ctor = getCtor()
    if (ctor) {
      try {
        this.startSpeech(ctor)
        return
      } catch (e) {
        console.warn("wakeWord: روش گفتار شکست، انرژی استفاده میشود", e)
      }
    }
    await this.startEnergy()
  }

  private startSpeech(ctor: SpeechRecognitionCtor): void {
    const rec = new ctor()
    rec.lang = this.opts.lang ?? "fa-IR"
    rec.interimResults = true
    rec.continuous = true
    const phrase = this.opts.phrase ?? "atlas"
    rec.onresult = (e: unknown) => {
      const results = (e as { results: Array<{ isFinal: boolean; [i: number]: { transcript: string } }> }).results
      let t = ""
      let finalText = ""
      for (let i = 0; i < results.length; i++) {
        t += results[i][0].transcript
        if (results[i].isFinal) finalText += results[i][0].transcript
      }
      this.opts.onPartial?.(t)
      if (finalText && matchesPhrase(finalText, phrase)) {
        this.opts.onWake(finalText)
      }
    }
    rec.onerror = () => {
      /* خطای معمول مثل no-speech را نادیده میگیریم */
    }
    rec.onend = () => {
      if (this.running && this.rec === rec) {
        try {
          rec.start()
        } catch {
          /* ignore */
        }
      }
    }
    rec.start()
    this.rec = rec
  }

  private async startEnergy(): Promise<void> {
    this.energyMode = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ac = new Ctx()
      const src = ac.createMediaStreamSource(stream)
      const an = ac.createAnalyser()
      an.fftSize = 256
      src.connect(an)
      const buf = new Uint8Array(an.frequencyBinCount)
      let above = false
      const loop = (): void => {
        if (!this.running) return
        an.getByteTimeDomainData(buf)
        let s = 0
        for (const v of buf) {
          const x = (v - 128) / 128
          s += x * x
        }
        const rms = Math.sqrt(s / buf.length)
        if (rms > 0.12) above = true
        else if (above) {
          above = false
          this.opts.onWake()
        }
        this.raf = requestAnimationFrame(loop)
      }
      loop()
      this.stream = stream
      this.audioCtx = ac
    } catch {
      /* میکروفون در دسترس نیست */
    }
  }

  stop = (): void => {
    this.running = false
    if (this.rec) {
      try {
        this.rec.onend = null
        this.rec.stop()
      } catch {
        /* ignore */
      }
      this.rec = null
    }
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = null
    if (this.energyMode) {
      this.stream?.getTracks().forEach((t) => t.stop())
      this.audioCtx?.close().catch(() => {})
      this.stream = null
      this.audioCtx = null
      this.energyMode = false
    }
  }
}
