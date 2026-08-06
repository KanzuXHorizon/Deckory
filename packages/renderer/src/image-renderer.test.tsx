import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageRenderer } from "./image-renderer";

describe("ImageRenderer", () => {
  it("renders crop, focal point, duotone and controlled overlay from a local asset", () => {
    const html = renderToStaticMarkup(<ImageRenderer spec={{
      id: "product-shot",
      src: "/assets/product-shot.png",
      alt: "Màn hình sản phẩm",
      width: 640,
      height: 360,
      fit: "cover",
      focalPoint: { x: 0.72, y: 0.28 },
      crop: { x: 0.08, y: 0.05, width: 0.84, height: 0.9 },
      duotone: ["#0d0f14", "#7c6cff"],
      overlay: { color: "#0d0f14", opacity: 0.16 },
      cornerRadii: [8, 24, 8, 24]
    }} />);

    expect(html).toContain("object-position:72% 28%");
    expect(html).toContain('data-image-crop="0.08,0.05,0.84,0.9"');
    expect(html).toContain('data-duotone="#0d0f14,#7c6cff"');
    expect(html).toContain("border-radius:8px 24px 8px 24px");
  });

  it("rejects remote sources and unsafe image effects", () => {
    const remote = renderToStaticMarkup(<ImageRenderer spec={{
      id: "remote",
      src: "https://example.com/image.png",
      alt: "Remote",
      width: 320,
      height: 180,
      fit: "cover"
    }} />);
    const unsafe = renderToStaticMarkup(<ImageRenderer spec={{
      id: "unsafe",
      src: "/assets/local.png",
      alt: "Local",
      width: 320,
      height: 180,
      fit: "cover",
      effects: { blur: 80, saturation: 1, contrast: 1 }
    }} />);

    expect(remote).toContain('data-image-error="remote-asset-rejected"');
    expect(unsafe).toContain('data-image-error="effect-budget-exceeded"');
  });
});
