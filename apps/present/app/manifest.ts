import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Deckory Present",
    short_name: "Deckory",
    description: "Trình chiếu có cấu trúc, hỗ trợ bàn phím, ghi chú diễn giả và chế độ ngoại tuyến đã được xác minh.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#f7f7f4",
    theme_color: "#15171a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
