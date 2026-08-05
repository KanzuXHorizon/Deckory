import { describe, expect, it } from "vitest";
import { validateDeck, type Slide, type SlideComponent } from "@deckory/schema";
import * as templates from "./index.js";

type TeamMember = Extract<SlideComponent, { type: "team-showcase" }>["props"]["members"][number];
type TeamSlideFactory = (input: {
  idPrefix?: string;
  title?: string;
  subtitle?: string;
  project?: string;
  mode?: "roster" | "profiles" | "roster-and-profiles";
  rosterVariant?: "editorial" | "cards" | "constellation" | "spotlight";
  members: readonly TeamMember[];
  source?: string;
}) => Slide[];

const members: TeamMember[] = [
  {
    id: "product-lead",
    name: "Nguyễn Thái Vân",
    role: "Product Lead",
    summary: "Định hướng sản phẩm và chất lượng trình bày.",
    image: { src: "/team/product.svg", alt: "Chân dung trưởng nhóm sản phẩm", position: "top" },
    featured: true
  },
  {
    id: "visual-designer",
    name: "Thành viên 02",
    role: "Visual Designer",
    skills: ["Visual", "Motion"]
  }
];

describe("team showcase slide factory", () => {
  it("creates one roster slide followed by one profile slide per member", () => {
    const createTeamShowcaseSlides = (templates as unknown as { createTeamShowcaseSlides?: TeamSlideFactory }).createTeamShowcaseSlides;

    expect(createTeamShowcaseSlides).toBeTypeOf("function");
    const slides = createTeamShowcaseSlides?.({
      idPrefix: "graduation-team",
      title: "Đội ngũ thực hiện",
      subtitle: "Mỗi thành viên có một phạm vi rõ ràng.",
      project: "Deckory",
      mode: "roster-and-profiles",
      rosterVariant: "editorial",
      members,
      source: "Hồ sơ dự án"
    }) ?? [];

    expect(slides).toHaveLength(3);
    expect(slides.map((slide) => slide.id)).toEqual([
      "graduation-team-roster",
      "graduation-team-product-lead",
      "graduation-team-visual-designer"
    ]);
    expect(slides[0]).toMatchObject({
      layout: "data",
      components: expect.arrayContaining([
        expect.objectContaining({ type: "team-showcase", props: expect.objectContaining({ variant: "editorial", members }) })
      ])
    });
    for (const [index, slide] of slides.slice(1).entries()) {
      expect(slide).toMatchObject({
        layout: "data",
        components: expect.arrayContaining([
          expect.objectContaining({
            type: "team-showcase",
            props: expect.objectContaining({ variant: "profile", members: [members[index]] })
          })
        ])
      });
    }

    const result = validateDeck({
      id: "team-factory-proof",
      version: 1,
      title: "Team factory proof",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("supports roster-only and profile-only output without empty filler slides", () => {
    const createTeamShowcaseSlides = (templates as unknown as { createTeamShowcaseSlides?: TeamSlideFactory }).createTeamShowcaseSlides;
    const roster = createTeamShowcaseSlides?.({ members, mode: "roster" }) ?? [];
    const profiles = createTeamShowcaseSlides?.({ members, mode: "profiles" }) ?? [];

    expect(roster).toHaveLength(1);
    expect(profiles).toHaveLength(2);
    expect(profiles.every((slide) => slide.components.some((component) => component.type === "team-showcase" && component.props.variant === "profile"))).toBe(true);
  });
});
