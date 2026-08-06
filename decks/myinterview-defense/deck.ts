import { DeckDocumentV2Schema, type DeckDocumentV2 } from "@deckory/schema";
import { MYINTERVIEW_ASSETS, MYINTERVIEW_SLIDES } from "./content";
import { buildMyInterviewSlide, myInterviewVisualSystem } from "./visual-system";

const slides = MYINTERVIEW_SLIDES.map(buildMyInterviewSlide);
const claimIds = slides.map((slide) => `${slide.id}-claim`);

const document: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "myinterview-defense",
  revision: 2,
  title: "MyInterview — AI Technical Interviewer",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: myInterviewVisualSystem,
  assets: [...MYINTERVIEW_ASSETS],
  dataSources: [{
    id: "myinterview-defense-source",
    label: "MyInterview graduation-defense source set",
    kind: "document",
    status: "illustrative",
    metadata: {
      scope: "Local product screenshots, architecture documents, rubric and team-provided academic information",
      releaseBoundary: "Graduation defense evidence; not public-production evidence"
    }
  }],
  visualIntelligence: {
    narrative: {
      audience: {
        role: "Hội đồng bảo vệ dự án tốt nghiệp",
        knowledgeLevel: "informed",
        needs: [
          "Hiểu bài toán người học",
          "Thấy luồng sản phẩm có chuyển biến",
          "Kiểm tra chiều sâu kỹ thuật và bằng chứng",
          "Nhận biết giới hạn trung thực của hệ thống"
        ]
      },
      decisionOrOutcome: "Chấp thuận MyInterview như một dự án tốt nghiệp có câu chuyện, kỹ thuật và ranh giới bằng chứng rõ ràng.",
      timeBudgetMinutes: 15,
      thesis: "MyInterview biến luyện phỏng vấn rời rạc thành một vòng coaching có bối cảnh, bằng chứng và hành động tiếp theo.",
      sections: [
        {
          id: "opening-team",
          role: "context",
          objective: "Giới thiệu đề tài, sản phẩm và trách nhiệm của năm thành viên.",
          slideIds: slides.slice(0, 6).map((slide) => slide.id)
        },
        {
          id: "problem-solution",
          role: "tension",
          objective: "Làm rõ khoảng trống của việc luyện tập rời rạc và vòng coaching được đề xuất.",
          slideIds: slides.slice(6, 9).map((slide) => slide.id)
        },
        {
          id: "technical-proof",
          role: "proof",
          objective: "Chứng minh kiến trúc, rubric, dữ liệu, trạng thái thực hiện và evidence discipline.",
          slideIds: slides.slice(9, 15).map((slide) => slide.id)
        },
        {
          id: "decision-demo",
          role: "decision",
          objective: "Chốt giá trị, giới hạn và dẫn vào demo có phương án dự phòng.",
          slideIds: slides.slice(15, 17).map((slide) => slide.id)
        },
        {
          id: "appendix",
          role: "proof",
          objective: "Cung cấp bằng chứng kỹ thuật khi hội đồng đặt câu hỏi sâu.",
          slideIds: slides.slice(17).map((slide) => slide.id)
        }
      ],
      unresolvedQuestions: [
        "Voice runtime cần bằng chứng nhà cung cấp trên cùng revision trước khi nâng trạng thái.",
        "Public release cần load, observability, migration và recovery evidence độc lập."
      ]
    },
    evidence: {
      sources: [{
        id: "myinterview-defense-source",
        kind: "document",
        label: "MyInterview graduation-defense source set",
        status: "illustrative",
        illustrativeLabel: "Bằng chứng phục vụ bảo vệ · chưa đại diện production release",
        notes: "Tập hợp ảnh local, product brief, architecture, rubric, privacy và release-boundary documents."
      }],
      evidence: [],
      claims: slides.map((slide, index) => ({
        id: claimIds[index]!,
        text: slide.conclusion ?? slide.name,
        slideId: slide.id,
        evidenceIds: [],
        status: "illustrative" as const
      })),
      datasets: [],
      visualBindings: slides.flatMap((slide, index) =>
        slide.elements.some((element) => element.id === "evidence-table")
          ? [{
            id: `${slide.id}-table-binding`,
            kind: "table" as const,
            slideId: slide.id,
            elementId: "evidence-table",
            claimIds: [claimIds[index]!]
          }]
          : [])
    }
  },
  slides
};

export const myInterviewDefense = DeckDocumentV2Schema.parse(document);
