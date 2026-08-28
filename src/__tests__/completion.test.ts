import { describe, it, expect, beforeEach } from "vitest"
import { cosine, LOCAL_EMBED_DIM } from "@/lib/embed"
import { chunkText, ragAddDocument, ragQuery, ragList, ragClear } from "@/lib/rag"
import { mergeSnapshots, collectSnapshot, applySnapshot } from "@/lib/sync"
import { matchesPhrase } from "@/lib/wakeWord"

describe("embed", () => {
  it("بردار محلی هم‌اندازه و نرمال‌شده برمی‌گرداند", () => {
    const a = cosine(Array(LOCAL_EMBED_DIM).fill(1), Array(LOCAL_EMBED_DIM).fill(1))
    expect(a).toBeCloseTo(1, 5)
  })
  it("کسینوس دو بردار متضاد نزدیک صفر است", () => {
    const v = [1, 2, 3]
    expect(cosine(v, v)).toBeCloseTo(1, 5)
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })
})

describe("rag chunking", () => {
  it("متن را به تکه‌های معقول میشکند", () => {
    const text = Array.from({ length: 50 }, (_, i) => `خط ${i}`).join("\n")
    const chunks = chunkText(text, 200, 40)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((c) => c.length > 0)).toBe(true)
  })
})

describe("rag store", () => {
  beforeEach(() => ragClear())
  it("سند اضافه و جستجو می‌کند", async () => {
    await ragAddDocument("تست", "Atlas یک دستیار هوشمند محلی است که روی دستگاه اجرا میشود.")
    const list = ragList()
    expect(list.length).toBe(1)
    const hits = await ragQuery("دستیار محلی", 3)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].score).toBeGreaterThan(0)
  })
})

describe("sync merge", () => {
  it("آخرین نوشته برنده میشود", () => {
    const local = { version: 2, updatedAt: 200, data: { settings: { a: 1 } } }
    const remote = { version: 2, updatedAt: 100, data: { settings: { a: 99 }, extra: 1 } }
    const merged = mergeSnapshots(local as never, remote as never)
    expect((merged.data.settings as { a: number }).a).toBe(1)
    expect(merged.data.extra).toBe(1)
  })
  it("applySnapshot تنظیمات را مینویسد", () => {
    const snap = collectSnapshot()
    snap.data.settings = { theme: "ocean" }
    const res = applySnapshot(snap)
    expect(res.ok).toBe(true)
  })
})

describe("wakeWord", () => {
  it("عبارت بیدار را در متن تشخیص می‌دهد", () => {
    expect(matchesPhrase("atlas گوش کن", "atlas")).toBe(true)
    expect(matchesPhrase("لطفاً برای من بنویس", "atlas")).toBe(false)
  })
  it("تطبیق کلمهٔ اول عبارت", () => {
    expect(matchesPhrase("atlas حساب کن", "atlas گوش کن")).toBe(true)
  })
})
