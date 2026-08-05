import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { slideRecipes, visualStyles } from "@deckory/templates";
import { StudioTemplatePanel } from "./studio-template-panel";

describe("StudioTemplatePanel", () => {
  it("renders recipe intelligence, style evidence, and guarded theme controls", () => {
    const html = renderToStaticMarkup(
      <StudioTemplatePanel
        open
        recipes={slideRecipes.slice(0, 3)}
        styles={visualStyles.slice(0, 2)}
        currentThemeId="deckory-editorial"
        currentTheme={{
          preset: "editorial-light",
          accent: "cobalt",
          typography: "editorial",
          density: "comfortable"
        }}
        onClose={() => undefined}
        onInsertRecipe={() => undefined}
        onApplyStyle={() => undefined}
        onCustomizeTheme={() => undefined}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Công thức slide");
    expect(html).toContain("Phong cách trực quan");
    expect(html).toContain("Professional Cover");
    expect(html).toContain("Dùng khi");
    expect(html).toContain("Tránh khi");
    expect(html).toContain("Thêm sau slide hiện tại");
    expect(html).toContain("Executive Editorial");
    expect(html).toContain("Độ biến thiên mạch kể");
    expect(html).toContain("Độ chặt bằng chứng");
    expect(html).toContain("Áp dụng phong cách");
    expect(html).toContain("Tùy chỉnh token an toàn");
    expect(html).toContain("Nền giao diện");
    expect(html).toContain("Màu nhấn");
    expect(html).toContain("Kiểu chữ");
    expect(html).toContain("Mật độ");
    expect(html).not.toContain("CSS tùy ý");
  });

  it("renders nothing while closed", () => {
    const html = renderToStaticMarkup(
      <StudioTemplatePanel
        open={false}
        recipes={slideRecipes}
        styles={visualStyles}
        currentThemeId="deckory-editorial"
        currentTheme={{ preset: "editorial-light", accent: "cobalt", typography: "editorial", density: "comfortable" }}
        onClose={() => undefined}
        onInsertRecipe={() => undefined}
        onApplyStyle={() => undefined}
        onCustomizeTheme={() => undefined}
      />
    );

    expect(html).toBe("");
  });
});
