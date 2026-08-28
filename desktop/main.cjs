/**
 * Atlas Desktop — پروسهٔ اصلی الکترون
 * بدون منوی پیشفرض، لینکهای خارجی در مرورگر سیستم، زمینهٔ ایزوله
 */
const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')
const { registerBackend } = require('./backend.cjs')

app.setName('Atlas')

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 920,
    minHeight: 600,
    title: 'Atlas',
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    show: false,
      webPreferences: {
        contextIsolation: true,
        // sandbox:true → پریلود در محیط ایزوله اجرا میشود (فقط API محدود الکترون در دسترس است)
        sandbox: true,
        spellcheck: false,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.cjs')
      }
  })

  // حذف منوی پیشفرض (الزام امنیتی مستند)
  Menu.setApplicationMenu(null)

  win.once('ready-to-show', () => win.show())
  // dist در ریشهٔ پروژه ساخته میشود (vite build)
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  // لینکهای خارجی فقط در مرورگر پیشفرض سیستم
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (!win.webContents.getURL().startsWith('file://')) e.preventDefault()
    if (/^https?:\/\//i.test(url)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(() => {
  registerBackend()
  createWindow()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
