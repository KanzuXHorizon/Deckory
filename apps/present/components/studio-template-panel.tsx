"use client";

import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  LayoutTemplate,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { DeckTheme } from "@deckory/schema";
import type { SlideRecipe, SlideRecipeCategory, VisualStylePreset } from "@deckory/templates";
import { filterStudioRecipes } from "../lib/studio-template-intelligence";
import { layoutOptions } from "../lib/studio-option-catalog";

type TemplatePanelTab = "recipes" | "styles";

type StudioTemplatePanelProps = {
  open: boolean;
  recipes: readonly SlideRecipe[];
  styles: readonly VisualStylePreset[];
  currentThemeId: string;
  currentTheme: DeckTheme;
  onClose: () => void;
  onInsertRecipe: (recipe: SlideRecipe) => void;
  onApplyStyle: (style: VisualStylePreset) => void;
  onCustomizeTheme: (theme: DeckTheme) => void;
};

const CATEGORIES: readonly { value: SlideRecipeCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "opening", label: "Mở đầu" },
  { value: "narrative", label: "Mạch kể" },
  { value: "business", label: "Kinh doanh" },
  { value: "data", label: "Dữ liệu" },
  { value: "comparison", label: "So sánh" },
  { value: "process", label: "Quy trình" },
  { value: "technical", label: "Kỹ thuật" },
  { value: "academic", label: "Học thuật" },
  { value: "product", label: "Sản phẩm" }
];

const THEME_PRESETS: readonly { value: DeckTheme["preset"]; label: string; note: string }[] = [
  { value: "editorial-light", label: "Sáng biên tập", note: "Ưu tiên nội dung và bằng chứng" },
  { value: "editorial-dark", label: "Tối sân khấu", note: "Tương phản mạnh cho keynote" },
  { value: "technical-clean", label: "Kỹ thuật sạch", note: "Rõ ràng cho dữ liệu và code" }
];

const ACCENTS: readonly { value: DeckTheme["accent"]; label: string; note: string }[] = [
  { value: "cobalt", label: "Cobalt", note: "Quyết định và luận điểm chính" },
  { value: "teal", label: "Teal", note: "Tiến triển và trạng thái tốt" },
  { value: "amber", label: "Amber", note: "Chú ý và khoảnh khắc sân khấu" }
];

const TYPOGRAPHY: readonly { value: DeckTheme["typography"]; label: string; note: string }[] = [
  { value: "editorial", label: "Biên tập", note: "Serif–sans cho câu chuyện" },
  { value: "modern", label: "Hiện đại", note: "Sans rõ ràng cho sản phẩm" },
  { value: "technical", label: "Kỹ thuật", note: "Nhịp chữ cô đọng cho hệ thống" }
];

const DENSITIES: readonly { value: DeckTheme["density"]; label: string; note: string }[] = [
  { value: "comfortable", label: "Thoáng", note: "Khoảng trắng rộng, nhịp chậm" },
  { value: "compact", label: "Cô đọng", note: "Tăng lượng bằng chứng có kiểm soát" }
];

export function StudioTemplatePanel({
  open,
  recipes,
  styles,
  currentThemeId,
  currentTheme,
  onClose,
  onInsertRecipe,
  onApplyStyle,
  onCustomizeTheme
}: StudioTemplatePanelProps) {
  const [activeTab, setActiveTab] = useState<TemplatePanelTab>("recipes");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SlideRecipeCategory | "all">("all");
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  const filteredRecipes = useMemo(
    () => filterStudioRecipes(recipes, query, category),
    [category, query, recipes]
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (activeTab === "recipes") searchRef.current?.focus();
      else closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="studio-template-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="studio-template-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => trapFocus(event, dialogRef.current)}
      >
        <header className="studio-template-header">
          <div className="studio-template-heading-icon"><Sparkles size={18} aria-hidden="true" /></div>
          <div>
            <span>HỆ THỐNG MẪU</span>
            <h2 id={headingId}>Chọn cấu trúc trước khi trang trí.</h2>
            <p id={descriptionId}>Thêm slide từ công thức semantic hoặc đổi phong cách bằng token có kiểm soát.</p>
          </div>
          <button ref={closeRef} type="button" aria-label="Đóng thư viện mẫu" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="studio-template-tabs" role="tablist" aria-label="Loại mẫu">
          <button
            id="studio-template-tab-recipes"
            type="button"
            role="tab"
            aria-selected={activeTab === "recipes"}
            aria-controls="studio-template-panel-recipes"
            className={activeTab === "recipes" ? "is-active" : ""}
            onClick={() => setActiveTab("recipes")}
          >
            <LayoutTemplate size={16} aria-hidden="true" />
            <span>Công thức slide</span>
            <small>{recipes.length}</small>
          </button>
          <button
            id="studio-template-tab-styles"
            type="button"
            role="tab"
            aria-selected={activeTab === "styles"}
            aria-controls="studio-template-panel-styles"
            className={activeTab === "styles" ? "is-active" : ""}
            onClick={() => setActiveTab("styles")}
          >
            <Palette size={16} aria-hidden="true" />
            <span>Phong cách trực quan</span>
            <small>{styles.length}</small>
          </button>
        </div>

        <section
          id="studio-template-panel-recipes"
          className="studio-template-content studio-template-content--recipes"
          role="tabpanel"
          aria-labelledby="studio-template-tab-recipes"
          hidden={activeTab !== "recipes"}
        >
          <div className="studio-template-toolbar">
            <label className="studio-template-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Tìm công thức slide</span>
              <input
                ref={searchRef}
                autoFocus={activeTab === "recipes"}
                value={query}
                aria-label="Tìm công thức slide"
                placeholder="Tìm theo mục tiêu: xu hướng, kiến trúc…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="studio-template-result-count" aria-live="polite">
              <strong>{filteredRecipes.length}</strong>
              <span>công thức phù hợp</span>
            </div>
          </div>

          <div className="studio-template-categories" role="group" aria-label="Lọc công thức theo nhóm">
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={category === item.value}
                className={category === item.value ? "is-active" : ""}
                onClick={() => setCategory(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredRecipes.length > 0 ? (
            <div className="studio-recipe-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onInsert={() => onInsertRecipe(recipe)} />
              ))}
            </div>
          ) : (
            <div className="studio-template-empty">
              <Search size={24} aria-hidden="true" />
              <strong>Không có công thức phù hợp</strong>
              <span>Thử từ khóa ngắn hơn hoặc chọn nhóm “Tất cả”.</span>
              <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Xóa bộ lọc</button>
            </div>
          )}
        </section>

        <section
          id="studio-template-panel-styles"
          className="studio-template-content studio-template-content--styles"
          role="tabpanel"
          aria-labelledby="studio-template-tab-styles"
          hidden={activeTab !== "styles"}
        >
          <div className="studio-style-intro">
            <div>
              <span>VISUAL WORLD</span>
              <h3>Phong cách là một hệ quyết định, không chỉ là bảng màu.</h3>
            </div>
            <p>Mỗi preset gồm theme, nhịp motion, mật độ, độ nghiêm bằng chứng và hướng dẫn composition cho agent.</p>
          </div>

          <div className="studio-style-grid">
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                active={currentThemeId === style.id}
                onApply={() => onApplyStyle(style)}
              />
            ))}
          </div>

          <section className="studio-theme-customizer" aria-label="Tùy chỉnh token an toàn">
            <header>
              <div><ShieldCheck size={18} aria-hidden="true" /><span>TOKEN CÓ KIỂM SOÁT</span></div>
              <h3>Tùy chỉnh token an toàn</h3>
              <p>Chỉ thay đổi preset, màu nhấn, kiểu chữ và mật độ; renderer, validation và export vẫn giữ nguyên.</p>
            </header>
            <div className="studio-theme-token-grid">
              <ThemeTokenChoice
                label="Nền giao diện"
                value={currentTheme.preset}
                options={THEME_PRESETS}
                onChange={(preset) => onCustomizeTheme({ ...currentTheme, preset })}
              />
              <ThemeTokenChoice
                label="Màu nhấn"
                value={currentTheme.accent}
                options={ACCENTS}
                onChange={(accent) => onCustomizeTheme({ ...currentTheme, accent })}
              />
              <ThemeTokenChoice
                label="Kiểu chữ"
                value={currentTheme.typography}
                options={TYPOGRAPHY}
                onChange={(typography) => onCustomizeTheme({ ...currentTheme, typography })}
              />
              <ThemeTokenChoice
                label="Mật độ"
                value={currentTheme.density}
                options={DENSITIES}
                onChange={(density) => onCustomizeTheme({ ...currentTheme, density })}
              />
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onInsert }: { recipe: SlideRecipe; onInsert: () => void }) {
  const evidence = evidenceCopy(recipe.evidence);
  const layout = layoutOptions.find((option) => option.value === recipe.layout)?.label ?? recipe.layout;

  return (
    <article className="studio-recipe-card" data-category={recipe.category}>
      <div className="studio-recipe-preview" data-layout={recipe.layout} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{layout}</span>
      </div>
      <div className="studio-recipe-card-body">
        <div className="studio-recipe-card-meta">
          <span>{categoryCopy(recipe.category)}</span>
          <small data-level={recipe.evidence}>{evidence.label}</small>
        </div>
        <h3>{recipe.name}</h3>
        <p>{recipe.purpose}</p>
        <dl className="studio-recipe-facts">
          <div><dt>Bố cục</dt><dd>{layout}</dd></div>
          <div><dt>Thành phần</dt><dd>{recipe.components.length}</dd></div>
          <div><dt>Nguồn</dt><dd>{evidence.short}</dd></div>
        </dl>
        <div className="studio-recipe-guidance">
          <div><BookOpen size={14} aria-hidden="true" /><span><strong>Dùng khi</strong>{recipe.useWhen[0]}</span></div>
          <div><AlertTriangle size={14} aria-hidden="true" /><span><strong>Tránh khi</strong>{recipe.avoidWhen[0]}</span></div>
        </div>
        <ul className="studio-recipe-tags" aria-label="Từ khóa công thức">
          {recipe.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      </div>
      <button type="button" className="studio-recipe-insert" onClick={onInsert}>
        <Plus size={15} aria-hidden="true" />
        <span>Thêm sau slide hiện tại</span>
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </article>
  );
}

function StyleCard({ style, active, onApply }: { style: VisualStylePreset; active: boolean; onApply: () => void }) {
  return (
    <article className="studio-style-card" data-active={active ? "true" : "false"} data-preset={style.theme.preset} data-accent={style.theme.accent}>
      <div className="studio-style-swatch" aria-hidden="true"><span /><span /><span /><i /></div>
      <div className="studio-style-card-copy">
        <div><span>{style.tones[0]}</span>{active && <small><Check size={12} aria-hidden="true" /> Đang dùng</small>}</div>
        <h3>{style.name}</h3>
        <p>{style.description}</p>
      </div>
      <div className="studio-style-dials" aria-label={`Thông số ${style.name}`}>
        <StyleDial label="Độ biến thiên mạch kể" value={style.dials.narrativeVariance} />
        <StyleDial label="Cường độ chuyển động" value={style.dials.motionIntensity} />
        <StyleDial label="Mật độ trực quan" value={style.dials.visualDensity} />
        <StyleDial label="Độ chặt bằng chứng" value={style.dials.evidenceRigor} />
      </div>
      <ul className="studio-style-guidance">
        {style.compositionGuidance.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
      <button type="button" onClick={onApply} disabled={active}>
        {active ? <Check size={15} aria-hidden="true" /> : <Palette size={15} aria-hidden="true" />}
        <span>{active ? "Phong cách đang dùng" : "Áp dụng phong cách"}</span>
      </button>
    </article>
  );
}

function StyleDial({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><div aria-hidden="true"><i style={{ width: `${value * 10}%` }} /></div><strong>{value}/10</strong></div>;
}

function ThemeTokenChoice<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; note: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="studio-theme-token-choice">
      <legend>{label}</legend>
      <div role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            data-active={value === option.value ? "true" : "false"}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span><small>{option.note}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>, root: HTMLDivElement | null) {
  if (event.key !== "Tab" || !root) return;
  const focusable = Array.from(root.querySelectorAll<HTMLElement>(
    'input:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.closest("[hidden]"));
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function evidenceCopy(level: SlideRecipe["evidence"]): { label: string; short: string } {
  if (level === "required") return { label: "Nguồn bắt buộc", short: "Bắt buộc" };
  if (level === "recommended") return { label: "Khuyến nghị nguồn", short: "Khuyến nghị" };
  return { label: "Không bắt buộc nguồn", short: "Không bắt buộc" };
}

function categoryCopy(category: SlideRecipeCategory): string {
  return CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
