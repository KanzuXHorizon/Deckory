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
    const protocolRelative = renderToStaticMarkup(<ImageRenderer spec={{
      id: "protocol-relative",
      src: "//example.com/image.png",
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
    expect(protocolRelative).toContain('data-image-error="remote-asset-rejected"');
    expect(unsafe).toContain('data-image-error="effect-budget-exceeded"');
  });

  it("uses the declared duotone colors in the generated SVG filter", () => {
    const html = renderToStaticMarkup(<ImageRenderer spec={{
      id: "duotone-proof",
      src: "/assets/local.png",
      alt: "Local",
      width: 320,
      height: 180,
      fit: "cover",
      duotone: ["#000000", "#ffffff"]
    }} />);

    expect(html).toContain('data-duotone-shadow="#000000"');
    expect(html).toContain('data-duotone-highlight="#ffffff"');
    expect(html).toContain('<feColorMatrix type="matrix"');
    expect(html).toContain("0.2126 0.7152 0.0722 0 0");
  });

  it("rejects focal points outside the normalized image bounds", () => {
    const html = renderToStaticMarkup(<ImageRenderer spec={{
      id: "invalid-focal",
      src: "/assets/local.png",
      alt: "Local",
      width: 320,
      height: 180,
      fit: "cover",
      focalPoint: { x: 1.2, y: 0.5 }
    }} />);

    expect(html).toContain('data-image-error="focal-point-invalid"');
  });

  it("rejects invalid opacity and corner-radius values", () => {
    const html = renderToStaticMarkup(<ImageRenderer spec={{
      id: "invalid-style",
      src: "/assets/local.png",
      alt: "Local",
      width: 320,
      height: 180,
      fit: "cover",
      opacity: 1.2,
      cornerRadii: [8, -4, 8, 8]
    }} />);

    expect(html).toContain('data-image-error="style-invalid"');
  });

  it("rejects remote CSS URLs in overlays and masks", () => {
    const html = renderToStaticMarkup(<ImageRenderer spec={{
      id: "unsafe-css",
      src: "/assets/local.png",
      alt: "Local",
      width: 320,
      height: 180,
      fit: "cover",
      overlay: { color: "url(https://example.com/overlay.svg)", opacity: 0.2 },
      mask: { type: "radial", value: "black), url(https://example.com/mask.svg)" }
    }} />);

    expect(html).toContain('data-image-error="style-invalid"');
    expect(html).not.toContain("https://example.com");
  });
});
