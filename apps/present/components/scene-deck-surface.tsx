import Link from "next/link";
import { SceneRenderer } from "@deckory/renderer";
import type { DeckDocumentV2 } from "@deckory/schema";

export function SceneDeckSurface({
  deck,
  surface,
  editingEnabled = false
}: {
  deck: DeckDocumentV2;
  surface: "preview" | "presenter" | "studio";
  editingEnabled?: boolean;
}) {
  const slide = deck.slides[0]!;
  const label = surface === "studio"
    ? editingEnabled ? "V2 Studio foundation" : "V2 Studio chưa bật"
    : surface === "presenter" ? "V2 Presenter" : "V2 Preview";

  return (
    <main
      data-scene-v2-surface={surface}
      data-scene-v2-editing={surface === "studio" ? String(editingEnabled) : undefined}
      style={{ minHeight: "100dvh", padding: 24, background: "#111318", color: "#f7f7f4", overflow: "auto" }}
    >
      <header style={{ maxWidth: 1280, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: "#aaa6ff" }}>{label}</span>
          <h1 style={{ margin: "5px 0 0", fontSize: 20 }}>{deck.title}</h1>
        </div>
        <nav style={{ display: "flex", gap: 8 }} aria-label="Điều hướng Deckory V2">
          <Link href="/" style={{ color: "inherit" }}>Hub</Link>
          {surface !== "studio" && <Link href={`/studio?deck=${deck.id}`} style={{ color: "inherit" }}>Studio</Link>}
          {surface !== "presenter" && <Link href={`/present?deck=${deck.id}`} style={{ color: "inherit" }}>Present</Link>}
          <Link href={`/export?deck=${deck.id}`} style={{ color: "inherit" }}>Export</Link>
        </nav>
      </header>
      {surface === "studio" && !editingEnabled && (
        <p role="status" style={{ maxWidth: 1280, margin: "0 auto 16px", color: "#c3c6cc" }}>
          Đặt <code>DECKORY_SCENE_V2=1</code> để mở entry V2. Direct manipulation được triển khai trong Plan 02.
        </p>
      )}
      <section style={{ width: 1280, height: 720, margin: "0 auto", boxShadow: "0 28px 80px rgba(0,0,0,.35)" }} aria-label={`Slide 1: ${slide.name}`}>
        <SceneRenderer slide={slide} assets={deck.assets} mode={surface === "studio" ? "studio" : "final"} />
      </section>
    </main>
  );
}
