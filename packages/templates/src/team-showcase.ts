import type { Slide, SlideComponent } from "@deckory/schema";

type TeamShowcaseComponent = Extract<SlideComponent, { type: "team-showcase" }>;
export type TeamShowcaseMember = TeamShowcaseComponent["props"]["members"][number];
export type TeamShowcaseRosterVariant = Exclude<NonNullable<TeamShowcaseComponent["props"]["variant"]>, "profile">;
export type TeamShowcaseSlideMode = "roster" | "profiles" | "roster-and-profiles";

export type CreateTeamShowcaseSlidesInput = {
  idPrefix?: string;
  title?: string;
  subtitle?: string;
  project?: string;
  mode?: TeamShowcaseSlideMode;
  rosterVariant?: TeamShowcaseRosterVariant;
  members: readonly TeamShowcaseMember[];
  source?: string;
};

function slug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "team";
}

function evidence(source: string | undefined): SlideComponent[] {
  return source
    ? [{ id: "source", type: "evidence-footer", props: { source } }]
    : [];
}

function rosterSlide(input: CreateTeamShowcaseSlidesInput, prefix: string): Slide {
  const title = input.title?.trim() || "Đội ngũ thực hiện";
  const subtitle = input.subtitle?.trim();
  const project = input.project?.trim();
  const members = input.members.map((member) => ({ ...member }));

  return {
    id: `${prefix}-roster`,
    layout: "data",
    transition: { type: "wipe", duration: 0.46, easing: "emphasized" },
    components: [
      {
        id: "heading",
        type: "heading",
        props: {
          ...(project ? { eyebrow: project } : { eyebrow: "ĐỘI NGŨ" }),
          title,
          ...(subtitle ? { description: subtitle } : {})
        }
      },
      {
        id: "team",
        type: "team-showcase",
        sequence: 1,
        effect: { type: "rise", duration: 0.4 },
        props: {
          ...(project ? { project } : {}),
          ...(subtitle ? { subtitle } : {}),
          variant: input.rosterVariant ?? "editorial",
          members
        }
      },
      ...evidence(input.source?.trim())
    ]
  };
}

function profileSlide(input: CreateTeamShowcaseSlidesInput, prefix: string, member: TeamShowcaseMember): Slide {
  const project = input.project?.trim();
  const source = input.source?.trim();

  return {
    id: `${prefix}-${slug(member.id || member.name)}`,
    layout: "data",
    transition: { type: "morph", duration: 0.5, easing: "emphasized" },
    components: [
      {
        id: "heading",
        type: "heading",
        morphId: `${prefix}-member-heading`,
        props: {
          eyebrow: project || "THÀNH VIÊN",
          title: member.name,
          description: member.role ?? "Thành viên dự án"
        }
      },
      {
        id: "profile",
        type: "team-showcase",
        sequence: 1,
        effect: { type: "wipe", duration: 0.42 },
        props: {
          ...(project ? { project } : {}),
          variant: "profile",
          members: [{ ...member }]
        }
      },
      ...evidence(source)
    ]
  };
}

export function createTeamShowcaseSlides(input: CreateTeamShowcaseSlidesInput): Slide[] {
  if (input.members.length === 0) return [];

  const mode = input.mode ?? "roster-and-profiles";
  const prefix = slug(input.idPrefix?.trim() || input.project?.trim() || "team");
  const slides: Slide[] = [];

  if (mode === "roster" || mode === "roster-and-profiles") {
    slides.push(rosterSlide(input, prefix));
  }
  if (mode === "profiles" || mode === "roster-and-profiles") {
    slides.push(...input.members.map((member) => profileSlide(input, prefix, member)));
  }

  return slides;
}
