/**
 * Atlas Desktop — Preload
 * پل امن بین رندرر و پروسهٔ اصلی.
 * sandbox:true (اجرای ایزوله) + contextIsolation:true → فقط API محدود الکترون در دسترس است.
 */
const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");

/** گرفتن اسکرین‌شات از صفحهٔ اصلی از طریق desktopCapturer */
async function captureScreen() {
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 1920, height: 1080 },
  });
  if (!sources.length) throw new Error("هیچ منبع صفحه‌نمایشی یافت نشد");
  const src = sources[0];
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: src.id,
      },
    },
  });
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    await new Promise((res) => {
      video.onloadedmetadata = () => res();
    });
    video.play();
    await new Promise((r) => setTimeout(r, 300));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

contextBridge.exposeInMainWorld("atlasAPI", {
  platform: process.platform,
  invokeTool: (tool, args) => ipcRenderer.invoke("atlas:tool", { tool, args }),
  captureScreen,
  openExternal: (url) => ipcRenderer.send("atlas:open-external", url),
  setConfirm: (enabled) => ipcRenderer.invoke("atlas:set-confirm", enabled),
  onActivity: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on("atlas:activity", listener);
    return () => ipcRenderer.removeListener("atlas:activity", listener);
  },
});
