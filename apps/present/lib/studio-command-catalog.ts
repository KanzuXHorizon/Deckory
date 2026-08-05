import type { Slide } from "@deckory/schema";

export type StudioCommandId =
  | "save"
  | "undo"
  | "redo"
  | "preview"
  | "present"
  | "export"
  | "add-slide"
  | "add-component"
  | "open-templates"
  | "motion-replay"
  | "open-templates"
  | "reset-draft";

export type StudioCommand = {
  id: StudioCommandId;
  label: string;
  description: string;
  keywords: string[];
  disabled?: boolean;
  disabledReason?: string;
};

export function normalizeStudioSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim()
    .replace(/\s+/g, " ");
}

export function filterStudioCommands(
  commands: readonly StudioCommand[],
  query: string
): StudioCommand[] {
  const needle = normalizeStudioSearch(query);
  if (!needle) return [...commands];

  return commands
    .map((command, index) => ({
      command,
      index,
      score: getSearchScore(
        [command.label, command.description, ...command.keywords].map(normalizeStudioSearch),
        needle
      )
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map((entry) => entry.command);
}

export function filterStudioSlides(slides: readonly Slide[], query: string): Slide[] {
  const needle = normalizeStudioSearch(query);
  if (!needle) return [...slides];

  return slides
    .map((slide, index) => ({
      slide,
      index,
      score: getSearchScore(
        [slide.id, slide.layout, getSlideSearchTitle(slide)].map(normalizeStudioSearch),
        needle
      )
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map((entry) => entry.slide);
}

function getSearchScore(fields: readonly string[], needle: string): number {
  let best = Number.POSITIVE_INFINITY;

  for (const field of fields) {
    if (!field) continue;
    if (field === needle) best = Math.min(best, 0);
    else if (field.startsWith(needle)) best = Math.min(best, 1);
    else if (field.split(" ").some((word) => word.startsWith(needle))) best = Math.min(best, 2);
    else if (field.includes(needle)) best = Math.min(best, 3);
  }

  return best;
}

function getSlideSearchTitle(slide: Slide): string {
  const heading = slide.components.find((component) => component.type === "heading");
  return heading?.type === "heading" ? heading.props.title : slide.id;
}
