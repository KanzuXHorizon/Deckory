# Deckory V2 — Professional Presentation Platform Program Design

## Status

Approved by the user on 2026-08-06. This specification supersedes the architectural scope in `2026-08-06-deckory-10-of-10-platform-design.md` where the older document limits authoring to semantic components without a complete editable scene model.

Written against repository HEAD `0485fbe`. The working tree is already heavily modified by other batches; this document does not authorize resetting, overwriting, staging, committing or publishing unrelated changes.

## Design read

Reading this as: an offline-first, code-native professional presentation platform for agents and human creators, delivering fully editable 16:9 stories with the compositional freedom of a web design tool, the evidence discipline of a technical review system and the reliability of a typed production renderer.

- Narrative variance: 9/10
- Motion intensity: adaptive 2–8/10
- Visual density: adaptive 2–9/10
- Evidence rigor: 10/10
- Authoring freedom: 9/10
- Runtime determinism: 10/10

## 1. Product outcome

Deckory V2 must let an agent or human transform raw, repetitive or text-heavy material into a deliberate visual story without being trapped in a small set of repeated layouts.

The product must support four connected workflows:

1. **Structured authoring:** fast creation through semantic layouts, recipes, masters and visual recommendations.
2. **Direct visual editing:** drag, resize, rotate, align, group, layer and style elements directly on a 16:9 canvas.
3. **Code authoring:** agents can write Scene JSX, registered React components or sandboxed HTML/React web blocks.
4. **Reliable delivery:** Hub, Studio, Preview, Presenter and Export consume the same validated document and preserve the same meaning.

Deckory V2 is not a PowerPoint clone, generic whiteboard or prompt-to-image slide generator. Its advantage is the combination of:

- typed presentation source of truth;
- editable scene graph;
- code and visual round-trip for supported elements;
- high-variety visual grammar;
- deterministic validation and quality audit;
- evidence-aware storytelling;
- offline presentation readiness.

## 2. Research synthesis and decisions

### 2.1 GitHub Spec Kit

GitHub Spec Kit separates specification, technical planning, task decomposition and implementation. Its “spec of specs” pattern explicitly recommends decomposing a large program into independently executable sub-features when one implementation cycle would exceed reliable context limits.

Deckory V2 adopts this structure:

- one program specification;
- one execution roadmap;
- six independently testable implementation plans;
- implementation checkpoints and cross-artifact consistency review before release.

Reference:

- https://github.com/github/spec-kit
- https://github.github.com/spec-kit/concepts/spec-of-specs.html

### 2.2 PPT Master

PPT Master demonstrates three relevant principles:

1. Pixel-space absolute coordinates are easier for agents and humans to reason about than presentation-specific units.
2. SVG is a useful interchange format because it shares the same 2D vector concepts as DrawingML.
3. Editability depends on preserving object depth, not merely producing an image that looks correct.

Deckory adopts the principles but not the pipeline as its canonical architecture:

- Deckory Scene Document remains the source of truth.
- SVG is an import/export and vector interchange boundary.
- Native object export is capability-based.
- Browser DOM/SVG rendering remains the primary runtime.

Reference:

- https://github.com/hugohe3/ppt-master
- https://github.com/hugohe3/ppt-master/blob/main/docs/technical-design.md

### 2.3 Canvas manipulation

Moveable exposes drag, resize, scale, rotate, group, snap, clip and SVG manipulation capabilities. Selecto supplies marquee and multi-selection behavior. They fit Deckory’s DOM/SVG renderer better than replacing the renderer with a bitmap canvas engine.

Decision:

- retain DOM/SVG as the rendered artifact;
- use `react-moveable` and `react-selecto` behind Deckory-owned adapters;
- persist only Deckory scene data, never library-specific event payloads;
- keep transformation math and command history in `@deckory/scene`.

Reference:

- https://daybrush.com/moveable/release/latest/doc/

### 2.4 Advanced charts

Apache ECharts 6 provides broad chart coverage, SVG rendering, server-side SVG output and optional ARIA descriptions. It is suitable as a rendering engine only when wrapped by a Deckory-owned typed chart specification.

Decision:

- use `echarts@6` modules on demand;
- use SVG renderer for browser, thumbnails and export consistency;
- never expose raw ECharts options as the deck contract;
- generate a Deckory accessible summary independently of ECharts ARIA;
- use custom Deckory renderers for simple editorial charts when they produce better slide quality.

Reference:

- https://echarts.apache.org/en/feature.html
- https://echarts.apache.org/handbook/en/best-practices/aria/
- https://echarts.apache.org/handbook/en/how-to/cross-platform/server/

### 2.5 Diagram auto-layout

ELK.js provides automatic graph layout only, including layered layouts and orthogonal, polyline or spline edge routing. This separation is desirable because Deckory must retain full control over rendering and styling.

Decision:

- use `elkjs` for hierarchy, architecture, flow and dependency layouts;
- use deterministic Deckory algorithms for timeline, radial, quadrant, matrix, cycle and roadmap visuals;
- run expensive layout work in a worker;
- persist user overrides separately from generated layout.

Reference:

- https://github.com/kieler/elkjs
- https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html

### 2.6 Custom code isolation

An `iframe srcdoc` can execute arbitrary markup and scripts, but unsandboxed content can access the parent document and becomes an injection boundary. MDN recommends sandboxing without `allow-same-origin`, CSP restrictions and Trusted Types for untrusted content.

Decision:

- repository-registered React components execute in the trusted Deckory bundle;
- runtime custom HTML/React executes in an isolated iframe;
- network access is denied by default;
- parent communication uses a versioned `postMessage` protocol;
- unsupported custom blocks export through a declared snapshot fallback.

Reference:

- https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/srcdoc
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox
- https://esbuild.github.io/api/

## 3. Governing principles

### 3.1 One canonical document

Studio, Hub, Preview, Presenter, thumbnails, audit and export must consume the same `DeckDocumentV2`. Derived formats may be cached but never become authoring sources.

### 3.2 Semantic-first, freeform-capable

The preferred creation path is:

1. infer communication intent;
2. choose semantic component or recipe;
3. generate a valid scene composition;
4. allow direct visual refinement;
5. use custom code only when existing capabilities cannot express the intended relationship.

Freeform editing is supported, but it does not remove semantic metadata, evidence status or accessibility requirements.

### 3.3 Full custom does not mean untyped chaos

Deckory supports three code levels:

- Scene JSX compiled to scene nodes;
- trusted registered React components with typed props and an inspector contract;
- sandboxed Web Blocks for arbitrary HTML/React.

Only Web Blocks may contain arbitrary DOM. They are isolated and explicitly less editable than native scene elements.

### 3.4 Visuals explain relationships

A component is accepted only when it clearly communicates at least one relationship:

- magnitude;
- rank;
- change;
- distribution;
- composition;
- chronology;
- sequence;
- hierarchy;
- causality;
- dependency;
- comparison;
- evidence;
- ownership;
- decision;
- action.

Decorative visuals cannot outnumber explanatory visuals.

### 3.5 Evidence and accessibility are structural

Source, unit, period, sample, illustrative status, accessible summary and reduced-motion behavior are document fields, not optional authoring reminders.

### 3.6 Offline and deterministic by default

All fonts, assets, component code and rendering dependencies required by a deck must be locally available. A presentation must not depend on a remote CDN or runtime network call.

## 4. Scope

### 4.1 In scope

- versioned Scene Document V2;
- V1 migration and compatibility rendering;
- freeform, constrained and auto-layout groups;
- direct manipulation canvas;
- layers, grouping, locking and selection;
- rich background and visual styling;
- Scene JSX authoring;
- registered custom React component SDK;
- sandboxed HTML/React Web Blocks;
- broad semantic component catalog;
- chart and diagram engines;
- text-to-visual intent recommendation;
- motion timeline and semantic motion presets;
- accessibility, audit and runtime evidence;
- HTML, PNG and PDF export;
- capability-based SVG/PPTX adapter groundwork;
- MyInterview and Visual Lab as production proofs.

### 4.2 Explicit non-goals for the V2 program

- real-time multi-user collaboration;
- cloud accounts, billing or remote persistence;
- arbitrary third-party npm installation from Studio;
- executing untrusted server-side code;
- claiming perfect editable PPTX round-trip for every Web Block;
- importing every PowerPoint feature;
- turning Studio into an infinite whiteboard;
- AI-generated factual claims without evidence.

## 5. Architecture overview

```text
Authoring sources
  ├─ Template / Recipe / Master
  ├─ Studio direct manipulation
  ├─ Scene JSX
  ├─ Registered React component
  └─ Sandboxed Web Block
             │
             ▼
      DeckDocumentV2
             │
    ┌────────┼─────────┐
    ▼        ▼         ▼
Validation  Audit   Migration/Commands
    │        │         │
    └────────┼─────────┘
             ▼
       Scene Renderer
    ┌────────┼──────────────┐
    ▼        ▼              ▼
 Studio   Preview/Present  Export
```

### 5.1 Package boundaries

- `@deckory/schema`: public V1 and V2 document schemas and diagnostics.
- `@deckory/scene`: scene operations, geometry, commands, constraints, migration and serialization.
- `@deckory/renderer`: shared scene-to-DOM/SVG renderer independent of Studio.
- `@deckory/visuals`: charts, diagrams, visual intent metadata and layout adapters.
- `@deckory/sdk`: Scene JSX runtime, component registration and generated inspector contracts.
- `@deckory/audit`: structural and runtime-evidence quality checks.
- `@deckory/templates`: styles, masters, recipes and blueprints targeting V2 scenes.
- `@deckory/present`: Hub, Studio, Preview, Presenter and Export product surfaces.

The renderer must move out of the large application-level `slide-frame.tsx` boundary. Studio overlays may wrap the renderer but cannot fork it.

## 6. DeckDocumentV2

### 6.1 Root contract

```ts
export type DeckDocumentV2 = {
  schemaVersion: 2;
  id: StableId;
  revision: number;
  title: string;
  locale: "vi-VN" | "en-US";
  canvas: CanvasSpec;
  theme: DeckThemeV2;
  assets: DeckAssetV2[];
  dataSources?: DeckDataSource[];
  masters?: SlideMasterV2[];
  componentPackages?: ComponentPackageReference[];
  slides: SceneSlide[];
};
```

### 6.2 Coordinate system

The canonical slide canvas is `1280 × 720` logical pixels for 16:9.

- coordinates are finite numbers;
- default precision is 0.25 logical pixels;
- the renderer scales the whole canvas, not individual coordinates;
- safe areas are theme/master metadata;
- export converts logical pixels only at the boundary;
- negative positions are valid during editing but fail readiness audit when visible content lies outside the slide.

### 6.3 Slide contract

```ts
export type SceneSlide = {
  id: StableId;
  name: string;
  purpose?: SlidePurpose;
  conclusion?: string;
  masterId?: StableId;
  background: BackgroundStack;
  guides?: Guide[];
  transition?: SlideTransitionV2;
  notes?: string;
  evidence?: SlideEvidence;
  elements: SceneElement[];
};
```

### 6.4 Element contract

Every element has explicit geometry and editability metadata.

```ts
export type SceneElement = {
  id: StableId;
  name: string;
  kind: SceneElementKind;
  parentId?: StableId;
  frame: Frame;
  transform?: Transform2D;
  constraints?: ElementConstraints;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  style?: ElementStyle;
  content: ElementContent;
  motion?: ElementMotionTrack[];
  interaction?: ElementInteraction;
  accessibility: ElementAccessibility;
  exportPolicy?: ElementExportPolicy;
  semantic?: ElementSemanticMetadata;
};
```

### 6.5 Native element kinds

- `group`
- `stack`
- `grid`
- `text`
- `rich-text`
- `image`
- `icon`
- `shape`
- `line`
- `connector`
- `svg`
- `chart`
- `table`
- `diagram`
- `media`
- `component-instance`
- `web-block`
- `evidence-footer`

### 6.6 Layout modes

#### Freeform

Child frames are explicit. Users may drag, resize and rotate any unlocked child.

#### Constraint

Children retain explicit frames plus horizontal and vertical constraints:

- left;
- right;
- center;
- stretch;
- scale;
- top;
- bottom.

#### Auto layout

A `stack` or `grid` owns spacing, padding, alignment and sizing. Children may be fixed, hug-content or fill.

Switching modes must be reversible and cannot silently delete a frame.

### 6.7 Background stack

Supported layers:

- solid;
- linear gradient;
- radial gradient;
- conic gradient;
- mesh gradient;
- image;
- SVG;
- pattern;
- grid;
- noise/grain;
- glow;
- vignette;
- color overlay;
- blur backdrop;
- edge mask.

Each layer includes opacity, blend mode and clip/mask behavior. Backgrounds remain local and deterministic.

### 6.8 Rich text

Rich text stores semantic runs, not arbitrary HTML.

Required support:

- paragraph and inline styles;
- Vietnamese-aware line wrapping;
- bold, italic, underline and strike;
- inline emphasis color;
- link metadata;
- list and numbering;
- text alignment and vertical alignment;
- line height, tracking and paragraph spacing;
- maximum lines and overflow policy;
- auto-fit within declared bounds;
- accessibility reading order.

## 7. Authoring modes

### 7.1 Semantic authoring

Templates, recipes and visual recommendations generate native scene elements with explicit geometry. This remains the fastest and safest path.

### 7.2 Scene JSX

Scene JSX provides HTML-like authoring without producing arbitrary DOM.

```tsx
export default defineSceneSlide({
  id: "evidence-loop",
  purpose: "explain-causality"
}, () => (
  <Slide background={backgrounds.paperTeal}>
    <Text
      id="title"
      frame={{ x: 72, y: 58, width: 650, height: 148 }}
      textStyle={type.displayL}
    >
      Phản hồi chỉ có giá trị khi dẫn đến hành động.
    </Text>
    <EvidenceLoop
      id="loop"
      frame={{ x: 74, y: 242, width: 1132, height: 396 }}
      data={feedbackLoop}
    />
  </Slide>
));
```

The JSX runtime produces `DeckDocumentV2` nodes. It must reject HTML tags and inline executable handlers.

### 7.3 Registered React components

A trusted component package must declare:

```ts
export type DeckComponentDefinition<Props> = {
  id: StableId;
  version: string;
  propsSchema: z.ZodType<Props>;
  defaultFrame: FrameSize;
  inspector: InspectorSchema;
  renderer: ComponentType<DeckComponentRenderProps<Props>>;
  accessibleSummary: (props: Props) => string;
  exportCapabilities: ExportCapability[];
  migrateProps?: ComponentPropsMigrator<Props>;
};
```

A registered component is selectable, resizable and editable through generated Inspector fields. It may render complex React internally but cannot directly mutate the Deckory document.

### 7.4 Sandboxed Web Blocks

Web Blocks support arbitrary HTML/CSS/JavaScript or React for cases outside the native system.

Required isolation:

- sandboxed iframe;
- no `allow-same-origin`;
- scripts only from the locally built payload;
- `connect-src 'none'` by default;
- no parent DOM access;
- no cookies, local storage or navigation;
- Trusted Types or equivalent sanitization at the `srcdoc` boundary;
- versioned `postMessage` protocol;
- render timeout;
- memory and payload budgets;
- explicit static export fallback;
- visible capability warning in Studio.

A Web Block is editable as a frame unless it provides its own inspector schema.

## 8. Studio Canvas 2.0

### 8.1 Workspace structure

- left slide rail;
- component and asset library;
- central canvas;
- layers panel;
- contextual inspector;
- optional bottom motion timeline;
- top-level save, history, preview, present and export controls.

Panels are resizable and collapsible. The canvas remains the dominant region.

### 8.2 Selection

- click selection;
- shift-add/remove selection;
- marquee selection;
- select parent, child and sibling;
- deep select through groups;
- multi-select;
- visible bounding box and handles;
- locked element indication;
- selection preserved across inspector changes;
- keyboard reading order.

### 8.3 Manipulation

- drag;
- resize on eight handles;
- rotate;
- duplicate while dragging;
- keyboard nudge by 1 logical pixel;
- accelerated nudge by 10 logical pixels;
- preserve ratio modifier;
- resize from center modifier;
- group/ungroup;
- align left, center, right, top, middle, bottom;
- distribute horizontally and vertically;
- bring forward/backward and front/back;
- lock, hide and rename;
- copy/paste element and style;
- replace component while preserving compatible content and frame.

Every gesture commits one document-history command, not one command per pointer event.

### 8.4 Snapping and guides

- canvas edges and centers;
- safe area;
- custom guides and rulers;
- sibling edges and centers;
- equal-spacing indicators;
- baseline guides for text;
- auto-layout padding and gaps;
- temporary measurement labels;
- snap tolerance scaled by zoom.

### 8.5 Direct editing

- double-click text to edit;
- Enter opens text editing for selected text element;
- Escape returns to selection mode;
- crop mode for images;
- point editing for connectors and simple vector paths;
- chart data table editor;
- diagram node and edge editor;
- Web Block source editor only in Advanced mode.

### 8.6 Layers

- hierarchical tree;
- drag reorder;
- nest into group;
- rename;
- lock/hide;
- type and warning badges;
- search/filter;
- keyboard navigation;
- select from layer tree;
- reveal selected element in tree.

### 8.7 Inspector

Tabs:

1. Content
2. Layout
3. Style
4. Data
5. Motion
6. Interaction
7. Accessibility
8. Export
9. Quality

Only tabs relevant to the selected element are shown. Advanced fields use progressive disclosure.

### 8.8 History and persistence

- immutable command transactions;
- undo/redo at action boundaries;
- local autosave;
- named checkpoints;
- V1 and V2 draft separation;
- crash-safe validation before persistence;
- no silent discard of invalid drafts;
- migration snapshot before first V2 save.

## 9. Visual intelligence

### 9.1 Text-to-visual pipeline

Deckory must not turn every paragraph into cards. It analyzes the communication job first.

```text
Raw content
  → claims and evidence extraction
  → relationship classification
  → audience and density constraints
  → visual candidates
  → layout and master candidates
  → evidence/accessibility requirements
  → scene composition
  → audit and preview
```

### 9.2 Relationship taxonomy

- single claim;
- contrast;
- before/after;
- choice/trade-off;
- ranking;
- magnitude;
- trend;
- distribution;
- part-to-whole;
- chronology;
- process;
- journey;
- lifecycle;
- hierarchy;
- architecture;
- dependency;
- network;
- causality;
- feedback loop;
- geographic distribution;
- ownership/team;
- evidence chain;
- risk;
- prioritization;
- roadmap;
- implementation proof;
- action/decision.

### 9.3 Recommendation contract

```ts
export type VisualRecommendation = {
  intent: VisualIntent;
  componentId: StableId;
  recipeId?: StableId;
  masterId?: StableId;
  confidence: number;
  reasons: string[];
  requiredInputs: VisualInputRequirement[];
  evidenceRequirements: EvidenceRequirement[];
  alternatives: VisualAlternative[];
  warnings: string[];
};
```

Recommendations must explain why a visual fits and when not to use it. They may never fabricate missing numeric values.

## 10. Required component catalog

The V2 release cannot claim broad visual coverage without complete examples, Inspector support, accessible summaries and thumbnail QA for every shipped component.

### 10.1 Narrative and editorial

- professional cover;
- cinematic cover;
- section divider;
- thesis statement;
- key message;
- problem framing;
- tension/escalation;
- solution framing;
- quote and attribution;
- definition;
- misconception/correction;
- before/after;
- reveal statement;
- closing synthesis;
- call to action;
- agenda and progress map;
- editorial text-image spread;
- pull quote with evidence;
- annotated paragraph;
- key phrase composition.

### 10.2 Metrics and business

- metric strip;
- metric spotlight;
- KPI scorecard;
- target versus actual;
- benchmark card;
- OKR tree;
- strategy pillars;
- balanced scorecard;
- opportunity sizing;
- value proposition;
- business model map;
- prioritization matrix;
- impact/effort matrix;
- risk register visual;
- risk heatmap;
- decision matrix;
- trade-off matrix;
- roadmap;
- milestone plan;
- release readiness;
- operating model;
- capability map.

### 10.3 Charts

- horizontal bar;
- vertical bar;
- grouped bar;
- stacked bar;
- 100% stacked bar;
- diverging bar;
- lollipop;
- dot plot;
- bullet chart;
- line;
- multi-line;
- area;
- stacked area;
- slope chart;
- bump chart;
- waterfall;
- combo bar-line;
- scatter;
- bubble;
- histogram;
- box plot;
- range plot;
- heatmap;
- calendar heatmap;
- donut;
- pie only under strict limits;
- waffle;
- treemap;
- sunburst;
- funnel;
- sankey;
- radar under strict limits;
- gauge only for real threshold semantics;
- Gantt;
- timeline chart;
- small multiples;
- geographic choropleth;
- proportional symbol map.

### 10.4 Diagrams and relationships

- linear process;
- branching process;
- flowchart;
- swimlane;
- customer journey;
- service blueprint;
- cycle;
- feedback loop;
- lifecycle;
- timeline;
- roadmap path;
- hierarchy tree;
- org chart;
- mind map;
- concept map;
- dependency graph;
- network graph;
- ecosystem map;
- causal graph;
- architecture layers;
- system context;
- container diagram;
- component architecture;
- sequence diagram;
- data flow;
- API pipeline;
- event flow;
- state machine;
- entity relationship diagram;
- quadrant;
- matrix;
- pyramid;
- funnel diagram;
- Venn diagram;
- concentric layers;
- orbit;
- constellation;
- evidence chain.

### 10.5 Product and technical proof

- browser frame;
- device mockup;
- multi-screen product tour;
- screenshot annotation;
- zoomed detail;
- feature callout;
- workflow demonstration;
- code snippet;
- code walkthrough;
- code diff;
- terminal transcript;
- request/response example;
- schema example;
- architecture plus code proof;
- reliability status;
- test evidence;
- release evidence;
- incident timeline.

### 10.6 Academic and evidence

- research question;
- hypothesis;
- methodology;
- sample and scope;
- literature synthesis;
- findings;
- discussion;
- limitations;
- recommendation;
- evidence table;
- source comparison;
- claim-to-evidence map;
- citation wall with hierarchy;
- appendix index.

### 10.7 People and organizations

- team grid;
- team editorial spread;
- member spotlight;
- responsibility matrix;
- RACI;
- persona;
- stakeholder map;
- organization chart;
- contribution map;
- panel/committee view.

### 10.8 Media and decorative systems

- single hero image;
- editorial crop;
- image duo;
- triptych;
- collage;
- gallery strip;
- before/after image;
- annotated image;
- local video frame;
- icon composition;
- abstract geometry;
- controlled texture;
- brand pattern;
- decorative illustration frame.

Decorative components may support the visual world but cannot replace an explanatory visual when the content contains a relationship.

## 11. Chart architecture

### 11.1 Deckory chart spec

The public document stores `ChartSpec`, not ECharts options.

Required fields:

- question;
- title;
- accessible summary;
- variant;
- data;
- encoding;
- unit;
- number format;
- direct labels;
- highlights;
- annotations;
- reference lines;
- source/evidence;
- missing-value policy;
- animation policy.

### 11.2 Rendering tiers

- Tier A: Deckory editorial renderer for common bar, line, area, dot and waterfall charts.
- Tier B: ECharts SVG adapter for advanced statistical, hierarchical, relational and geographic charts.
- Tier C: registered custom chart component when neither tier expresses the relationship truthfully.

### 11.3 Chart quality rules

- one visible question;
- direct labels before legends;
- no 3D chart effects;
- no rainbow categorical palette without semantic need;
- maximum one primary highlight;
- explicit unit and source;
- text-equivalent conclusion;
- final values visible with reduced motion;
- zero-to-value animation only when zero is a truthful baseline;
- long label collision detection;
- thumbnail legibility.

## 12. Diagram architecture

### 12.1 Diagram spec

- nodes with measured minimum sizes;
- typed ports;
- typed edges;
- labels and descriptions;
- hierarchy or relationship semantics;
- selected layout strategy;
- generated layout result;
- optional manual overrides;
- accessible traversal order;
- edge routing mode.

### 12.2 Layout strategies

- `elk-layered`;
- `elk-force` only for exploratory networks;
- deterministic tree;
- deterministic radial;
- deterministic timeline;
- deterministic matrix;
- deterministic cycle;
- manual.

### 12.3 Layout safety

- measure text before layout;
- reserve title and evidence safe areas;
- detect node collisions;
- route edges around nodes;
- scale only within readable minimums;
- emit an actionable overflow diagnostic rather than clipping;
- allow “re-layout” without deleting manual overrides unless explicitly confirmed.

## 13. Typography and styling

### 13.1 Type system

- Vietnamese-first font coverage;
- local variable fonts where licensed;
- deck-level families and fallback stack;
- display, title, subtitle, body, caption, data and mono roles;
- per-element overrides;
- auto-fit with minimum font thresholds;
- optical line-length checks;
- punctuation and diacritic safety;
- no arbitrary serif insertion as decoration.

### 13.2 Element styling

- fills and gradients;
- strokes and dash patterns;
- independent corner radii;
- shadows;
- glow under strict limits;
- blur;
- masks;
- clip paths;
- blend modes;
- opacity;
- image fit, crop and focal point;
- duotone and color overlay;
- shape paths and connectors.

### 13.3 Visual worlds

Initial professional worlds:

- Deckory Editorial Control Room;
- Swiss Precision;
- Scientific Illustration;
- Technical Blueprint;
- Data Journalism;
- Minimal Luxury;
- Cinematic Dark;
- Academic Defense;
- Product Showcase;
- Geometric Modernism;
- Organic Systems;
- Risograph Editorial.

Each world defines typography, palette, chart semantics, shape language, imagery, texture, motion and density. Worlds are not per-slide theme changes.

## 14. Motion system

### 14.1 Timeline model

- slide transition track;
- element entrance;
- emphasis;
- exit;
- motion path;
- stagger group;
- shared-element morph;
- chart draw/count;
- connector draw;
- camera pan/zoom;
- triggers: on-enter, on-click, after-previous, with-previous.

### 14.2 Motion constraints

- one authored motion idea per slide by default;
- all meaning visible in final static state;
- reduced motion removes travel, blur and counting while preserving state;
- thumbnails and export use final state;
- continuous loops require an explicit explanatory reason;
- motion timeline is hidden until a user enables advanced motion editing.

## 15. Accessibility

Required for native elements and registered components:

- keyboard selection and manipulation;
- visible focus;
- accessible name and summary;
- reading order independent of z-index;
- chart and diagram text equivalents;
- color-independent state encoding;
- contrast checks;
- 200% zoom usability for Studio controls;
- reduced motion;
- presenter keyboard and touch operation;
- private speaker notes;
- Web Block fallback description.

## 16. Security and offline behavior

- assets must resolve from the typed local manifest;
- Web Blocks deny network by default;
- Web Blocks cannot access parent storage or DOM;
- component packages are repository-controlled and versioned;
- no runtime evaluation in Presenter outside isolated Web Blocks;
- payload and execution budgets are enforced;
- export never follows remote URLs;
- error messages reveal actionable context but not private source content;
- local autosave remains browser-scoped unless a later persistence feature is explicitly designed.

## 17. Export and interoperability

### 17.1 Required V2 exports

- browser presentation;
- standalone HTML package;
- PNG per slide;
- PDF deck;
- SVG per slide for supported native scene content.

### 17.2 PPTX strategy

PPTX export is capability-based:

- native text → editable text box;
- native shapes/connectors → DrawingML shapes;
- supported charts/tables → native chart/table where an adapter exists;
- SVG scene → editable vector conversion where supported;
- unsupported registered component → SVG or raster fallback;
- Web Block → snapshot fallback unless it declares a native adapter.

The UI must disclose the export capability of each element before export.

## 18. Migration

### 18.1 V1 compatibility

- V1 decks continue to validate and render;
- `migrateDeckV1ToV2` produces explicit scene frames based on current layout recipes;
- migration is deterministic;
- original V1 source is not modified;
- Studio saves a migration checkpoint;
- migrated decks receive diagnostics for content that cannot be fully represented.

### 18.2 Reference deck migration

Migration order:

1. Visual Lab;
2. Template Gallery;
3. Deckory Story;
4. MyInterview Defense;
5. remaining registered decks.

MyInterview is the final proof because it contains Vietnamese copy, product screenshots, evidence, team content, diagrams, charts, interaction and defense-specific density.

## 19. Quality system

The 15 existing quality dimensions remain mandatory:

1. Storytelling
2. UI
3. UX
4. Visual Design
5. Motion Design
6. Typography
7. Layout
8. Charts
9. Copywriting
10. Accessibility
11. Interaction
12. Branding
13. Evidence
14. Demo Readiness
15. Production Quality

V2 adds five explicit dimensions:

16. Customizability
17. Visual Variety
18. Editability
19. Export Fidelity
20. Performance

Every score includes:

- checks run;
- evidence type: structural, runtime or manual review;
- deductions;
- remediation;
- confidence;
- responsible surface.

No category is reported as 10/10 solely from structural analysis when browser or human visual review is required.

## 20. Performance budgets

Targets for a standard 20-slide deck with up to 80 native elements per slide:

- drag feedback: target 60 FPS, minimum acceptable 45 FPS on the project test machine;
- selection response: under 50 ms;
- undo/redo command application: under 30 ms for a single-slide action;
- slide switch: under 150 ms after assets are loaded;
- thumbnail generation: progressive and non-blocking;
- ELK layout: worker-based with a 2-second warning threshold;
- Web Block initial render: 1.5-second timeout before fallback state;
- autosave: debounced and non-blocking;
- Presenter: no editor libraries in the audience bundle.

## 21. Failure handling

- invalid V2 document → actionable diagnostics, never a blank canvas;
- renderer failure → element-level fallback preserving accessible text;
- chart adapter failure → accessible table or textual summary;
- diagram layout failure → manual/simple fallback with diagnostic;
- Web Block timeout → isolated error frame and static fallback;
- asset missing → visible placeholder in Studio, readiness error in audit;
- text overflow → warning during edit, release blocker when critical content clips;
- export unsupported → disclosed capability result, never silent rasterization;
- migration loss → stop and report exact unsupported fields.

## 22. Program decomposition

Deckory V2 is too large for one reliable implementation cycle. It is decomposed into six sub-programs:

1. **Scene Foundation:** V2 schema, migration, geometry, commands and shared renderer.
2. **Studio Canvas:** selection, manipulation, guides, layers, direct editing and inspector.
3. **Component SDK:** Scene JSX, registered React components and sandboxed Web Blocks.
4. **Visual Intelligence:** recommendation taxonomy, component catalog, charts and diagrams.
5. **Design and Motion:** backgrounds, typography, advanced styling and motion timeline.
6. **Export and Release:** export capabilities, audit, reference migration, performance and production QA.

Each sub-program must produce working software that can ship behind a feature flag without depending on unfinished later phases.

## 23. Release gates

Deckory V2 cannot be declared production-ready until all are true:

- V1 decks still open and present;
- V2 scene renderer powers Studio, Preview, Presenter, thumbnails and export;
- at least one deck uses freeform, constraints and auto layout;
- direct manipulation supports keyboard and pointer workflows;
- every shipped component has a complete fixture, Inspector support and accessible summary;
- all chart types shown in the public catalog are actually implemented;
- all diagram layouts avoid clipping in full-size and thumbnail QA;
- Web Blocks are sandboxed and cannot access the parent document or network by default;
- reduced motion preserves complete meaning;
- PNG, PDF and standalone HTML exports match Preview;
- export capabilities are disclosed per element;
- strict audit passes every registered production deck;
- MyInterview is visible in Hub and passes the defense demo flow;
- screenshots have been inspected at 320, 375, 768, 1024 and 1440 CSS pixels plus 200% zoom;
- no unresolved console errors, overflow, safe-area collisions or missing assets remain;
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm audit:decks -- --strict`, `pnpm assets:check`, `pnpm build` and relevant E2E suites pass on the final revision.

## 24. Acceptance scenarios

### Scenario A — Transform boring text

Given a paragraph describing a four-step operational process, Deckory recommends process, swimlane and journey alternatives, explains the trade-offs, creates a native editable diagram and preserves the original text as notes or accessible detail.

### Scenario B — Fully custom agent slide

An agent writes Scene JSX with custom geometry and a registered component. Studio opens the result, allows frame manipulation and edits registered props without exposing raw JSON.

### Scenario C — Arbitrary web visual

An agent creates a custom React visualization unsupported by native components. It runs in a sandboxed Web Block, uses local assets, cannot access the parent or network and exports through its declared static fallback.

### Scenario D — Professional visual editing

A user selects multiple elements, aligns them, distributes spacing, groups them, changes the group to auto layout, edits text directly, replays motion, undoes the complete gesture and saves a checkpoint.

### Scenario E — Visualizer safety

A dependency graph with long Vietnamese labels is measured, auto-laid out, routed without collisions and scaled only above minimum readable size. If it cannot fit, Studio reports a specific overflow diagnostic and recommends splitting the slide.

### Scenario F — Evidence-aware chart

A chart cannot be marked ready until it includes unit, source, accessible conclusion and evidence status. Illustrative fixture values are visibly labelled.

## 25. Self-review

- Completeness scan: no deferred marker, incomplete section or undefined success criterion remains.
- Internal consistency: arbitrary React is allowed only through trusted registration or isolated Web Blocks; canonical authoring remains `DeckDocumentV2`.
- Scope check: the program is decomposed into six independently executable plans.
- Ambiguity check: JSON/TypeScript remains canonical; XML/SVG/OOXML are interoperability boundaries.
- Evidence check: research-backed technology choices are isolated behind Deckory-owned interfaces and can be replaced without changing the document contract.
