import { z } from "zod";

export const NarrativeSectionRoleSchema = z.enum([
  "opening",
  "context",
  "tension",
  "evidence",
  "solution",
  "proof",
  "decision",
  "closing",
  "appendix"
]);

export type NarrativeSectionRole = z.infer<typeof NarrativeSectionRoleSchema>;

export const AudienceProfileSchema = z.object({
  role: z.string().trim().min(1, "Audience role is required."),
  knowledgeLevel: z.enum(["novice", "informed", "expert"]).optional(),
  needs: z.array(z.string().trim().min(1)).default([])
}).strict();

export type AudienceProfile = z.infer<typeof AudienceProfileSchema>;

export const NarrativeSectionSchema = z.object({
  id: z.string().trim().min(1),
  role: NarrativeSectionRoleSchema,
  objective: z.string().trim().min(1),
  slideIds: z.array(z.string().trim().min(1))
}).strict();

export type NarrativeSection = z.infer<typeof NarrativeSectionSchema>;

export const DeckNarrativeSchema = z
  .object({
    audience: AudienceProfileSchema,
    decisionOrOutcome: z.string().trim().min(1, "A primary outcome is required."),
    timeBudgetMinutes: z.number().positive().finite().optional(),
    thesis: z.string().trim().min(1, "A thesis is required."),
    sections: z.array(NarrativeSectionSchema),
    unresolvedQuestions: z.array(z.string().trim().min(1)).default([])
  })
  .strict()
  .superRefine((value, context) => {
    const sectionIds = new Set<string>();
    const slideAssignments = new Map<string, string>();

    value.sections.forEach((section, sectionIndex) => {
      if (sectionIds.has(section.id)) {
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "id"],
          message: `Duplicate narrative section ID: ${section.id}.`
        });
      }
      sectionIds.add(section.id);

      section.slideIds.forEach((slideId, slideIndex) => {
        const assignedSection = slideAssignments.get(slideId);
        if (assignedSection) {
          context.addIssue({
            code: "custom",
            path: ["sections", sectionIndex, "slideIds", slideIndex],
            message: `Slide ${slideId} is assigned to duplicate sections: ${assignedSection} and ${section.id}.`
          });
        } else {
          slideAssignments.set(slideId, section.id);
        }
      });
    });
  });

export type DeckNarrative = z.infer<typeof DeckNarrativeSchema>;

export type NarrativeEvidenceStatus =
  | "supported"
  | "partially-supported"
  | "unsupported"
  | "illustrative";

export type NarrativeSlide = {
  id: string;
  heading: string;
  purpose: string;
  conclusion: string;
  evidenceStatus: NarrativeEvidenceStatus;
  sectionId: string;
  interpretation?: string;
  questionAnswered?: string;
  transitionFromPrevious?: string;
  speakerIntent?: string;
  semanticSignature?: string;
};

export type NarrativeIndex = {
  orderedSlideIds: string[];
  mainSlideIds: string[];
  appendixSlideIds: string[];
  unassignedSlideIds: string[];
  missingSlideIds: string[];
  sectionBySlideId: Readonly<Record<string, NarrativeSectionRole>>;
};

export function buildNarrativeIndex(
  narrative: DeckNarrative,
  slides: readonly NarrativeSlide[]
): NarrativeIndex {
  const slideIds = new Set(slides.map((slide) => slide.id));
  const assignedIds = new Set<string>();
  const orderedSlideIds: string[] = [];
  const mainSlideIds: string[] = [];
  const appendixSlideIds: string[] = [];
  const missingSlideIds: string[] = [];
  const sectionBySlideId: Record<string, NarrativeSectionRole> = {};

  for (const section of narrative.sections) {
    for (const slideId of section.slideIds) {
      assignedIds.add(slideId);
      sectionBySlideId[slideId] = section.role;
      if (!slideIds.has(slideId)) {
        missingSlideIds.push(slideId);
        continue;
      }
      orderedSlideIds.push(slideId);
      if (section.role === "appendix") {
        appendixSlideIds.push(slideId);
      } else {
        mainSlideIds.push(slideId);
      }
    }
  }

  return {
    orderedSlideIds,
    mainSlideIds,
    appendixSlideIds,
    unassignedSlideIds: slides
      .map((slide) => slide.id)
      .filter((slideId) => !assignedIds.has(slideId)),
    missingSlideIds,
    sectionBySlideId
  };
}
