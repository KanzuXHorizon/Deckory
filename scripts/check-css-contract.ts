import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export type CssContractIssueCode =
  | "duplicate-global-css-import"
  | "orphan-global-css"
  | "forbidden-deck-selector"
  | "missing-css-import";

export type CssContractIssue = {
  code: CssContractIssueCode;
  path: string;
  detail: string;
};

export type CssContractReport = {
  passed: boolean;
  reachableGlobalCss: string[];
  issues: CssContractIssue[];
};

const APP_DIR = join("apps", "present", "app");
const LAYOUT_ENTRY = join(APP_DIR, "layout.tsx");
const FORBIDDEN_DECK_PATTERN = /data-deck-id\s*=\s*["'][^"']+["']/;
const DECK_STYLESHEET_NAME_PATTERN = /(?:myinterview|defense).*\.css$/i;

function toPosix(value: string): string {
  return value.split(sep).join("/");
}

function walkFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

function cssImports(file: string, source: string): string[] {
  const pattern = file.endsWith(".css")
    ? /@import\s+(?:url\()?\s*["']([^"']+\.css)["']\s*\)?\s*;/g
    : /(?:import\s+(?:[^"']+?\s+from\s+)?|import\s*\()["']([^"']+\.css)["']/g;
  return [...source.matchAll(pattern)].flatMap((match) => match[1] ? [match[1]] : []);
}

function resolveCssImport(fromFile: string, specifier: string): string {
  return resolve(dirname(fromFile), specifier);
}

export function checkCssContract(rootDir: string): CssContractReport {
  const root = resolve(rootDir);
  const entry = join(root, LAYOUT_ENTRY);
  const appDirectory = join(root, APP_DIR);
  const issues: CssContractIssue[] = [];
  const importCount = new Map<string, number>();
  const reachable = new Set<string>();
  const visited = new Set<string>();

  const visit = (file: string) => {
    if (!existsSync(file)) {
      issues.push({
        code: "missing-css-import",
        path: toPosix(relative(root, file)),
        detail: `Import target does not exist: ${toPosix(relative(root, file))}`
      });
      return;
    }
    if (visited.has(file)) return;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    for (const specifier of cssImports(file, source)) {
      if (!specifier.startsWith(".")) continue;
      const imported = resolveCssImport(file, specifier);
      const count = (importCount.get(imported) ?? 0) + 1;
      importCount.set(imported, count);
      if (count > 1) {
        issues.push({
          code: "duplicate-global-css-import",
          path: toPosix(relative(root, imported)),
          detail: `Global stylesheet is reachable through more than one import path: ${toPosix(relative(root, imported))}`
        });
      }
      if (!imported.endsWith(".module.css")) {
        reachable.add(imported);
        visit(imported);
      }
    }
  };

  visit(entry);

  const globalCss = walkFiles(appDirectory).filter((file) => extname(file) === ".css" && !file.endsWith(".module.css"));
  for (const file of globalCss) {
    const source = readFileSync(file, "utf8");
    const path = toPosix(relative(root, file));
    if (!reachable.has(file)) {
      issues.push({
        code: "orphan-global-css",
        path,
        detail: `App-level global stylesheet is not reachable from ${toPosix(LAYOUT_ENTRY)}.`
      });
    }
    if (FORBIDDEN_DECK_PATTERN.test(source) || DECK_STYLESHEET_NAME_PATTERN.test(path)) {
      issues.push({
        code: "forbidden-deck-selector",
        path,
        detail: "Deck-specific visual behavior must live in typed document/theme data, not deck-ID global CSS selectors or deck-named stylesheets."
      });
    }
  }

  const deduped = [...new Map(issues.map((issue) => [`${issue.code}:${issue.path}:${issue.detail}`, issue])).values()]
    .sort((left, right) => `${left.code}:${left.path}`.localeCompare(`${right.code}:${right.path}`));

  return {
    passed: deduped.length === 0,
    reachableGlobalCss: [...reachable].map((file) => toPosix(relative(root, file))).sort(),
    issues: deduped
  };
}

function runCli(): void {
  const report = checkCssContract(process.cwd());
  console.log("Deckory CSS contract");
  console.log(`${report.reachableGlobalCss.length} reachable global stylesheet · ${report.issues.length} issue`);
  for (const issue of report.issues) {
    console.error(`- ${issue.code} · ${issue.path}: ${issue.detail}`);
  }
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
