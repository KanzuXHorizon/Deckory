import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { Studio } from "./studio";

const deck: DeckDocument = {
  id: "responsive-studio",
  version: 1,
  title: "Responsive Studio",
  locale: "vi-VN",
  themeId: "responsive-studio",
  slides: [{
    id: "cover",
    layout: "cover",
    components: [{ id: "heading", type: "heading", props: { title: "Canvas responsive" } }]
  }]
};

describe("Studio responsive inspector", () => {
  it("exposes an accessible drawer trigger and close control without removing the inspector", () => {
    const html = renderToStaticMarkup(<Studio sourceDeck={deck} />);

    expect(html).toContain('class="icon-action studio-inspector-toggle"');
    expect(html).toContain('aria-controls="studio-inspector"');
    expect(html).toContain('id="studio-inspector"');
    expect(html).toContain('class="icon-action inspector-close"');
    expect(html).toContain('aria-label="Đóng Inspector"');
  });
});
