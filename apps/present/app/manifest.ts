import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Deckory Present", short_name: "Deckory", start_url: "/", display: "standalone", background_color: "#f7f7f4", theme_color: "#15171a" }; }
