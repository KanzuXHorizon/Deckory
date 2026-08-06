import {
  auditDecks,
  formatAuditReport,
  formatAuditReportV2
} from "../packages/audit/src/index.ts";
import {
  deckCatalog,
  sceneFoundationAudit,
  v2DeckCatalog
} from "../apps/present/lib/deck-catalog.ts";

const argumentsSet = new Set(process.argv.slice(2));
const asJson = argumentsSet.has("--json");
const strict = argumentsSet.has("--strict");
const help = argumentsSet.has("--help") || argumentsSet.has("-h");

if (help) {
  console.log(`Deckory deck audit

Usage:
  pnpm audit:decks
  pnpm audit:decks -- --json
  pnpm audit:decks -- --strict

Options:
  --json    Xuất report JSON để CI hoặc agent xử lý.
  --strict  Trả exit code 1 khi có warning hoặc error.
  --help    Hiển thị hướng dẫn này.`);
  process.exit(0);
}

const v1Reports = auditDecks(deckCatalog.map((item) => item.deck));
const v2Reports = [sceneFoundationAudit, ...v2DeckCatalog.map((item) => item.audit)];
const reports = [...v1Reports, ...v2Reports];

if (asJson) {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    reports,
    summary: summarize(reports)
  }, null, 2));
} else {
  console.log(`${formatAuditReport(v1Reports)}\n\n${formatAuditReportV2(v2Reports)}`);
}

const summary = summarize(reports);
process.exitCode = summary.errorCount > 0 || (strict && summary.warningCount > 0) ? 1 : 0;

function summarize(reports: readonly { summary: { slideCount: number; errorCount: number; warningCount: number } }[]) {
  return reports.reduce((summary, report) => ({
    deckCount: summary.deckCount + 1,
    slideCount: summary.slideCount + report.summary.slideCount,
    errorCount: summary.errorCount + report.summary.errorCount,
    warningCount: summary.warningCount + report.summary.warningCount
  }), {
    deckCount: 0,
    slideCount: 0,
    errorCount: 0,
    warningCount: 0
  });
}
