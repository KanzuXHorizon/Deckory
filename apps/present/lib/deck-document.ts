import type { DeckDocument, Slide } from "@deckory/schema";

export function cloneDeckDocument(deck: DeckDocument): DeckDocument {
  return JSON.parse(JSON.stringify(deck)) as DeckDocument;
}

export function getSlideTitle(slide: Slide): string {
  const heading = slide.components.find((component) => component.type === "heading");
  if (heading?.type === "heading") return heading.props.title;

  const statement = slide.components.find((component) => component.type === "statement");
  if (statement?.type === "statement") return statement.props.quote;

  return slide.id;
}
