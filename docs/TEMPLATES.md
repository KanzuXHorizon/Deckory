# Deckory Template Intelligence

`@deckory/templates` là lớp headless giúp người viết và coding agent chọn cấu trúc trình bày phù hợp trước khi tạo `DeckDocument`. Package không render UI, không chứa JSX tùy ý và không thay đổi renderer. Nó cung cấp ba lớp độc lập:

```text
Visual Style × Slide Recipe × Deck Blueprint → validated DeckDocument
```

- **Visual Style** định nghĩa visual world ở mức deck: theme preset, accent, typography, density và các dials về narrative, motion, visual density, evidence.
- **Slide Recipe** giải quyết một communication job cụ thể: mở bài, nêu vấn đề, biểu diễn KPI, so sánh lựa chọn, trình bày kiến trúc, giải thích code hoặc kết luận.
- **Deck Blueprint** tổ chức các recipe thành một narrative có thứ tự, bước bắt buộc, bước tùy chọn và repeat limits.

Mọi output cuối cùng đều đi qua `validateTemplateInput`, `createDeckFromTemplate` và `validateDeck`.

## Visual styles

| ID | Phù hợp | Visual direction |
|---|---|---|
| `executive-editorial` | leadership update, proposal, case study | editorial sáng, restrained, evidence-heavy |
| `modern-professional` | product, workshop, professional presentation | sans hiện đại, teal accent, composition linh hoạt |
| `technical-precision` | architecture, reliability, engineering review | technical-clean, compact, boundary và code rõ |
| `data-briefing` | QBR, KPI review, analytical briefing | density cao, chart trực tiếp, evidence rigor cao |
| `bold-keynote` | launch, startup pitch, vision | editorial-dark, amber accent, nhịp kể sân khấu |
| `academic-defense` | nghiên cứu, bảo vệ tốt nghiệp, học thuật | hierarchy học thuật, nguồn và giới hạn rõ |

Style chỉ dùng token đã được `DeckTheme` hỗ trợ. Không style nào được phép đưa CSS tùy ý vào document.

## Deck blueprints

| ID | Audience chính | Thời lượng gợi ý | Narrative |
|---|---|---:|---|
| `professional-presentation` | general, customer, team, leadership | 10–25 phút | luận điểm → vấn đề → bằng chứng → lựa chọn → kế hoạch → khuyến nghị → hành động |
| `executive-briefing` | leadership, team | 6–15 phút | quyết định trước → KPI → driver → option → risk → recommendation |
| `startup-pitch` | investor, customer | 8–18 phút | problem → stakes → solution → mechanism → market → proof → ask |
| `product-strategy` | leadership, product team | 12–30 phút | user problem → evidence → position → pillars → roadmap → measures |
| `quarterly-business-review` | leadership, customer, team | 15–35 phút | outcome → trend → driver → detail → risk → action |
| `technical-architecture-review` | engineering, leadership | 15–40 phút | goal → constraint → architecture → flow → trade-off → proof → readiness |
| `academic-defense` | academic, student, technical | 15–35 phút | motivation → question → method → findings → discussion → recommendation → conclusion |
| `training-workshop` | student, team, general | 20–60 phút | objective → concept → example → workflow → practice → recap |
| `case-study` | customer, leadership, general | 10–25 phút | context → challenge → intervention → journey → evidence → learning |
| `project-proposal` | leadership, customer, team | 10–30 phút | need → opportunity → solution → value → scope → plan → risk → approval |

Blueprint không phải danh sách slide cố định. Mỗi step tham chiếu một recipe và có thể cho phép recipe override có kiểm soát.

## Recipe catalog

Catalog hiện có 44 recipe thuộc các nhóm:

- `opening`: cover, executive opener, section transition;
- `narrative`: problem, tension, key message, quote, closing action;
- `business`: executive summary, opportunity, solution, value proposition, strategy, roadmap;
- `data`: KPI, ranking, trend, distribution, data-plus-insight, exact table;
- `comparison`: before/after, option decision, competitive position, trade-off matrix;
- `process`: workflow, customer journey, phased plan, operating model;
- `technical`: architecture, data flow, implementation proof, code walkthrough, reliability;
- `academic`: research question, methodology, findings, discussion, recommendation, conclusion;
- `product`: user problem, product mechanism, feature proof, experience flow, release readiness.

### Search recipes

```ts
import { searchSlideRecipes } from "@deckory/templates";

const architectureRecipes = searchSlideRecipes("kiến trúc hệ thống");
const dataRecipes = searchSlideRecipes("kpi dữ liệu");
const exactRecipe = searchSlideRecipes("professional-cover", 1)[0];
```

Search chuẩn hóa dấu tiếng Việt, hỗ trợ alias semantic Việt–Anh và sắp xếp deterministic theo score rồi ID.

## Authoring modes

### Named-template mode

Dùng khi người dùng đã nêu blueprint hoặc style.

```ts
import {
  getDeckBlueprint,
  getVisualStyle
} from "@deckory/templates";

const blueprint = getDeckBlueprint("academic-defense");
const style = getVisualStyle("academic-defense");

if (!blueprint || !style) {
  throw new Error("Template ID không tồn tại trong catalog.");
}
```

Giữ đúng blueprint đã yêu cầu. Chỉ thay recipe của một step khi có lý do nội dung rõ và recipe override tồn tại.

### Adaptive mode

Dùng khi người dùng nêu mục tiêu nhưng không nêu template.

```ts
import { recommendTemplate } from "@deckory/templates";

const recommendation = recommendTemplate({
  scenario: "qbr",
  audience: "leadership",
  evidenceLevel: "sourced",
  dataIntensity: "high",
  tone: "analytical",
  durationMinutes: 20
});

console.log(recommendation.blueprint.id);
console.log(recommendation.style.id);
console.log(recommendation.reasons);
```

Recommendation dùng metadata và scoring deterministic. Kết quả luôn kèm lý do để người viết review trước khi instantiate.

### Original mode

Dùng khi không recipe nào giải thích đúng quan hệ nội dung. Trước khi tạo recipe mới:

1. tìm kiếm theo communication job, data relationship và keyword Việt–Anh;
2. ghi rõ vì sao recipe gần nhất không phù hợp;
3. chỉ dùng layout và semantic component được schema hỗ trợ;
4. định nghĩa slot, limits, evidence, tags, use/avoid rules;
5. thêm catalog test, validation test, instantiation test và gallery evidence;
6. browser-review ở full-size và thumbnail scale.

Original mode không cho phép JSX tùy ý hoặc bỏ qua `validateDeck`.

## Instantiate a deck

Input dùng slot objects tương ứng trực tiếp với props của semantic component.

```ts
import {
  createDeckFromTemplate,
  type CreateDeckFromTemplateInput
} from "@deckory/templates";

const input = {
  id: "quality-briefing",
  title: "Quality briefing",
  blueprintId: "executive-briefing",
  styleId: "executive-editorial",
  slides: [
    {
      stepId: "opening",
      slots: {
        heading: {
          eyebrow: "QUALITY REVIEW",
          title: "Hai lỗi còn lại đang chặn quyết định phát hành.",
          description: "Briefing tập trung vào readiness, risk và owner."
        },
        evidence: {
          source: "Internal quality review / 2026-08-05"
        }
      },
      notes: "Nêu quyết định cần đạt được trước khi đi vào chi tiết."
    },
    {
      stepId: "summary",
      slots: {
        heading: {
          title: "Readiness tăng, nhưng hai blocker vẫn ảnh hưởng luồng chính."
        },
        metrics: [
          {
            value: "94%",
            label: "test pass",
            note: "Internal test run",
            tone: "teal"
          },
          {
            value: "2",
            label: "blocker còn mở",
            note: "Cần owner và thời hạn",
            tone: "amber"
          }
        ],
        insight: {
          label: "KẾT LUẬN",
          title: "Chưa đủ điều kiện phát hành.",
          description: "Hai blocker nằm trên journey chính và chưa có fallback an toàn.",
          tone: "amber"
        },
        evidence: {
          source: "Internal quality review / 2026-08-05"
        }
      },
      notes: "Không đọc lại toàn bộ metric; nói kết luận và blocker."
    }
  ]
} satisfies CreateDeckFromTemplateInput;

const result = createDeckFromTemplate(input);
if (!result.ok) {
  for (const diagnostic of result.diagnostics) {
    console.error(
      diagnostic.code,
      diagnostic.stepId,
      diagnostic.slideId,
      diagnostic.slotId,
      diagnostic.message,
      diagnostic.remediation
    );
  }
  throw new Error("Template input chưa hợp lệ.");
}

export const deck = result.value;
```

Ví dụ trên chỉ minh họa shape của input. Một blueprint hoàn chỉnh phải cung cấp toàn bộ required steps. Test fixtures trong `packages/templates/src/test-fixtures.ts` và gallery deck trong `decks/template-gallery/deck.ts` là ví dụ đầy đủ.

## Slot contracts

| Slot kind | Runtime shape |
|---|---|
| `heading` | `{ eyebrow?, title, description?, emphasis? }` |
| `statement` | `{ quote, byline? }` |
| `metrics` | array `{ value, label, note, tone? }` |
| `comparison` | `{ left: { eyebrow, title, points }, right: ... }` |
| `process-steps` | array `{ title, note, icon }` |
| `architecture-layers` | array `{ label, items, accent? }` |
| `chart` | `{ title, unit, variant?, showValues?, values }` |
| `table` | `{ title, columns, rows, note? }` |
| `code` | `{ title, language, code, caption?, showLineNumbers?, highlightLines? }` |
| `insight` | `{ label, title, description, metric?, tone? }` |
| `evidence` | `{ source, page? }` |

Slot validation kiểm tra required values, runtime shape, maximum items và maximum text length. Tất cả diagnostics được trả trong một pass để agent có thể sửa theo batch.

## Diagnostics

Các code công khai:

- `not-found`: blueprint, style, step hoặc recipe không tồn tại;
- `missing-step`: thiếu step bắt buộc;
- `repeat-limit`: step vượt số lần cho phép;
- `missing-slot`: thiếu semantic slot bắt buộc;
- `invalid-slot`: shape, item count hoặc text length không hợp lệ;
- `evidence-required`: thiếu source hoặc illustrative label;
- `deck-invalid`: output cuối không vượt qua Deckory schema.

Không catch rồi bỏ qua diagnostics. Expected authoring errors không throw; caller quyết định cách trình bày hoặc recovery.

## Evidence rules

- Fixture data ghi rõ `Dữ liệu fixture minh hoạ`.
- Số liệu thật ghi source, time range, population và unit khi phù hợp.
- Recipe có `evidence: "required"` không thể instantiate nếu thiếu evidence slot.
- Chart phải trả lời một câu hỏi và có accessible summary tương đương.
- Table chỉ dùng khi exact row-level comparison là nội dung chính.
- Code snippet là technical proof nhỏ, không phải repository dump.

## Contributing a recipe

Recipe mới phải vượt checklist:

- ID kebab-case duy nhất;
- purpose là communication job cụ thể;
- layout/component compatibility hợp lệ;
- component luôn tham chiếu slot tồn tại;
- required slot, maxItems và maxLength phù hợp renderer budget;
- evidence requirement đúng với claim;
- useWhen, avoidWhen và tags có ý nghĩa;
- sequence tăng dần và evidence footer không phụ thuộc reveal;
- catalog integrity test pass;
- validate/instantiate test pass;
- ít nhất một complete fixture hoặc gallery usage;
- full-size, thumbnail, reduced-motion và console đã được browser-review.

## Pre-flight

Trước khi claim một template deck đã sẵn sàng:

```bash
pnpm --filter @deckory/templates test
pnpm --filter @deckory/templates typecheck
pnpm test
pnpm typecheck
pnpm build
```

Sau đó mở Studio, Preview và Present để kiểm tra:

- heading wrap và dấu tiếng Việt;
- clipping, overflow, safe area;
- density, contrast và direct labels;
- chart, table, code ở full-size và thumbnail;
- notes không xuất hiện trong audience view;
- keyboard, focus, reveal và reduced motion;
- console và network errors.

Không thay browser evidence bằng code review tĩnh.
