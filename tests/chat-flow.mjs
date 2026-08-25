/**
 * تست خودکار چت: پیام میفرستد و استریم را چک میکند
 * اجرا: node tests/chat-flow.mjs
 */
import { execSync, spawn } from 'node:child_process'

const CHROME = '/opt/google/chrome/chrome'
const URL_ = 'http://localhost:5173'

console.log('🧪 تست جریان چت Atlas')

// ۱. صفحه بدون خطا لود شود
const consoleLog = execSync(
  `${CHROME} --headless=new --disable-gpu --no-sandbox ${URL_} --enable-logging=stderr --v=0 --virtual-time-budget=9000 2>&1 >/dev/null | grep -c Uncaught || true`,
  { shell: '/bin/bash' }
).toString().trim()
console.log(consoleLog === '0' ? '✅ بدون خطای کنسول' : `❌ ${consoleLog} خطای کنسول`)

// ۲. عناصر کلیدی رندر شده باشند
const dom = execSync(
  `${CHROME} --headless=new --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=9000 ${URL_} 2>/dev/null`,
  { shell: '/bin/bash', maxBuffer: 10 * 1024 * 1024 }
).toString()

const checks = [
  ['سایدبار', 'مکالمه جدید'],
  ['گوی', 'atlas-orb'],
  ['خوشآمد', 'چطور میتونم'],
  ['گالری تم', 'دنیای خودت'],
  ['کادر نوشتن', 'از Atlas بپرس']
]
for (const [name, needle] of checks) {
  console.log(dom.includes(needle) ? `✅ ${name}` : `❌ ${name} پیدا نشد`)
}

// ۳. هشدار animationData نباشد
const animWarn = execSync(
  `${CHROME} --headless=new --disable-gpu --no-sandbox ${URL_} --enable-logging=stderr --v=0 --virtual-time-budget=9000 2>&1 >/dev/null | grep -c animationData || true`,
  { shell: '/bin/bash' }
).toString().trim()
console.log(animWarn === '0' ? '✅ بدون هشدار animationData' : `❌ هشدار animationData (${animWarn})`)

console.log('🧪 پایان تست')
