#!/usr/bin/env python3
"""Atlas chime — نوتیفیکیشن دلنشین ۵ ثانیهای با پایتون (بدون وابستگی خارجی)
پنج نُت طلایی که مثل زنگ معلق آرام محو میشوند."""
import math
import os
import struct
import subprocess
import sys
import wave

SR = 44100
DURATION = 5.0

# گام پنتاتونیک مینور — آرامششرقی/دلنشین (فرکانس هرتز)
NOTES = [392.0, 466.16, 523.25, 587.33, 698.46]  # G4, Bb4, C5, D5, F5


def bell_sample(t: float, freq: float, dur: float) -> float:
    """نُت به سبک زنگ: پایه + هارمونیکها با افت نمایی"""
    if t >= dur:
        return 0.0
    env = math.exp(-2.2 * t / dur)          # محو نمایی
    attack = min(1.0, t / 0.01)             # حملهٔ کوتاه
    tone = (
        math.sin(2 * math.pi * freq * t) * 1.00 +
        math.sin(2 * math.pi * freq * 2.0 * t) * 0.35 +
        math.sin(2 * math.pi * freq * 2.76 * t) * 0.18 +   # هارمونیک زنگی
        math.sin(2 * math.pi * freq * 5.40 * t) * 0.06
    )
    return env * attack * tone


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/atlas-chime.wav'
    total = int(SR * DURATION)
    buf = [0.0] * total

    # هر نُت با تاخیر ۰.۵۵ ثانیه — آخری بلندتر و کشیدهتر
    for i, freq in enumerate(NOTES):
        start = int(i * 0.55 * SR)
        dur = 3.4 if i == len(NOTES) - 1 else 2.2
        gain = 0.34 if i == len(NOTES) - 1 else 0.24
        for n in range(int(dur * SR)):
            idx = start + n
            if idx >= total:
                break
            buf[idx] += gain * bell_sample(n / SR, freq, dur)

    # نرمسازی کلیپ و fade-out انتهایی
    fade_n = int(0.8 * SR)
    peak = max(abs(x) for x in buf) or 1.0
    for i in range(total):
        v = buf[i] / peak
        if i > total - fade_n:
            v *= (total - i) / fade_n
        buf[i] = v

    with wave.open(out_path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(
            struct.pack('<h', int(max(-1.0, min(1.0, s)) * 32000)) for s in buf))

    size = os.path.getsize(out_path)
    print(f'✅ ساخته شد: {out_path} ({size // 1024}KB)')
    try:
        subprocess.run(['paplay', out_path], check=True)
        print('🔊 پخش شد')
    except Exception as e:  # noqa: BLE001
        print(f'⚠️ پخش خودکار ناموفق ({e}) — دستی اجرا کن: paplay {out_path}')


if __name__ == '__main__':
    main()
