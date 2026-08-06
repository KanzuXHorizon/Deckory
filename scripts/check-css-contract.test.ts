import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkCssContract } from "./check-css-contract.ts";

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "deckory-css-contract-"));
  for (const [path, content] of Object.entries(files)) {
    const absolute = join(root, path);
    mkdirSync(join(absolute, ".."), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
  return root;
}

test("accepts one root-reachable import for each app global stylesheet", () => {
  const root = fixture({
    "apps/present/app/layout.tsx": 'import "./globals.css";\nexport default function Layout() {}',
    "apps/present/app/globals.css": '@import "./slide-components.css";\n:root { --ink: #111; }',
    "apps/present/app/slide-components.css": ".slide { display: grid; }",
    "apps/present/components/panel.module.css": ".panel { display: block; }"
  });

  const report = checkCssContract(root);
  assert.deepEqual(report.issues, []);
  assert.deepEqual(report.reachableGlobalCss.sort(), [
    "apps/present/app/globals.css",
    "apps/present/app/slide-components.css"
  ]);
});

test("reports duplicate global imports", () => {
  const root = fixture({
    "apps/present/app/layout.tsx": 'import "./globals.css";\nimport "./slide-components.css";',
    "apps/present/app/globals.css": '@import "./slide-components.css";',
    "apps/present/app/slide-components.css": ".slide { display: grid; }"
  });

  const report = checkCssContract(root);
  assert.ok(report.issues.some((issue) => issue.code === "duplicate-global-css-import" && issue.path.endsWith("slide-components.css")));
});

test("reports orphan app-level CSS and forbidden deck-specific selectors", () => {
  const root = fixture({
    "apps/present/app/layout.tsx": 'import "./globals.css";',
    "apps/present/app/globals.css": ':root { --ink: #111; }',
    "apps/present/app/legacy.css": ".legacy { color: red; }",
    "apps/present/app/myinterview.css": '.slide[data-deck-id="myinterview-defense"] { padding: 20px; }'
  });

  const report = checkCssContract(root);
  assert.ok(report.issues.some((issue) => issue.code === "orphan-global-css" && issue.path.endsWith("legacy.css")));
  assert.ok(report.issues.some((issue) => issue.code === "forbidden-deck-selector" && issue.path.endsWith("myinterview.css")));
});
