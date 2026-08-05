import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, extname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const repositoryRoot = resolve(import.meta.dirname, "..");
const options = parseArguments(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const runId = `${Date.now().toString(36)}-${process.pid}`;
const distDir = `.next-export-${runId}`;
const distPath = resolve(repositoryRoot, "apps", "present", distDir);
const requestedOutputPath = resolve(repositoryRoot, options.output);
const explicitPdfPath = options.format === "pdf" && extname(options.output).toLowerCase() === ".pdf"
  ? requestedOutputPath
  : undefined;
const outputRoot = explicitPdfPath ? dirname(explicitPdfPath) : requestedOutputPath;
const port = await findAvailablePort();
const environment = {
  ...process.env,
  DECKORY_NEXT_DIST_DIR: distDir
};

mkdirSync(outputRoot, { recursive: true });
console.log(`[deckory:export] deck=${options.deck} format=${options.format} port=${port} dist=${distDir}`);

let server;
let browser;
try {
  await runPnpm(["--filter", "@deckory/present", "build"], environment);
  server = startServer(port, environment);
  await waitForServer(`http://127.0.0.1:${port}`);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const failedResponses = [];
  const pageErrors = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });

  const response = await page.goto(`http://127.0.0.1:${port}/export?deck=${encodeURIComponent(options.deck)}`, {
    waitUntil: "networkidle"
  });
  if (!response || response.status() >= 400) {
    throw new Error(`Deck “${options.deck}” không tồn tại hoặc route export trả ${response?.status() ?? "không có response"}.`);
  }

  await page.evaluate(() => document.fonts.ready);
  const shell = page.locator('[data-export-ready="true"]');
  await shell.waitFor({ state: "visible" });
  const renderedDeckId = await shell.getAttribute("data-export-deck-id");
  if (renderedDeckId !== options.deck) {
    throw new Error(`Route export trả deck “${renderedDeckId ?? "unknown"}” thay vì “${options.deck}”.`);
  }

  const slides = page.locator(".export-page");
  const slideCount = await slides.count();
  if (slideCount === 0) throw new Error("Deck không có slide để xuất.");

  const files = [];
  if (options.format === "png" || options.format === "both") {
    const pngDirectory = join(outputRoot, `${safeFileName(options.deck)}-png`);
    mkdirSync(pngDirectory, { recursive: true });

    for (let index = 0; index < slideCount; index += 1) {
      const slide = slides.nth(index);
      const slideId = await slide.getAttribute("data-export-slide-id") ?? `slide-${index + 1}`;
      const filename = `${String(index + 1).padStart(2, "0")}-${safeFileName(slideId)}.png`;
      const filepath = join(pngDirectory, filename);
      await slide.screenshot({ path: filepath, animations: "disabled", type: "png" });
      files.push(relativeOutputPath(filepath));
    }
  }

  if (options.format === "pdf" || options.format === "both") {
    const pdfPath = explicitPdfPath ?? join(outputRoot, `${safeFileName(options.deck)}.pdf`);
    mkdirSync(dirname(pdfPath), { recursive: true });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true
    });
    files.push(relativeOutputPath(pdfPath));
  }

  if (failedResponses.length > 0 || pageErrors.length > 0) {
    throw new Error([
      ...failedResponses.map((item) => `HTTP: ${item}`),
      ...pageErrors.map((item) => `Browser: ${item}`)
    ].join("\n"));
  }

  const manifest = {
    version: 1,
    deckId: options.deck,
    format: options.format,
    slideCount,
    generatedAt: new Date().toISOString(),
    renderer: "Deckory browser export / Chromium",
    canvas: { width: 1280, height: 720, aspectRatio: "16:9" },
    files
  };
  const manifestPath = join(outputRoot, `${safeFileName(options.deck)}-export.json`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`[deckory:export] ${slideCount} slide đã xuất.`);
  files.forEach((file) => console.log(`- ${file}`));
  console.log(`- ${relativeOutputPath(manifestPath)}`);
} finally {
  await browser?.close().catch(() => undefined);
  await stopServer(server);
  rmSync(distPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
}

function parseArguments(args) {
  const values = args.filter((argument) => argument !== "--");
  const option = (name) => {
    const inline = values.find((argument) => argument.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = values.indexOf(`--${name}`);
    return index >= 0 ? values[index + 1] : undefined;
  };

  const format = option("format") ?? "pdf";
  if (!["pdf", "png", "both"].includes(format)) {
    throw new Error(`Format “${format}” không hợp lệ. Chọn pdf, png hoặc both.`);
  }
  const output = option("output") ?? "output/exports";
  if (format !== "pdf" && extname(output).toLowerCase() === ".pdf") {
    throw new Error("Đường dẫn --output kết thúc bằng .pdf chỉ dùng được với --format=pdf.");
  }

  return {
    deck: option("deck") ?? "deckory-story",
    format,
    output,
    help: values.includes("--help") || values.includes("-h")
  };
}

function printHelp() {
  console.log(`Deckory deck export

Usage:
  pnpm export:deck -- --deck=deckory-story --format=pdf
  pnpm export:deck -- --deck=template-gallery --format=png --output=output/exports
  pnpm export:deck -- --deck=visual-lab --format=both

Options:
  --deck      ID của deck đã đăng ký trong Deckory catalog.
  --format    pdf, png hoặc both. Mặc định: pdf.
  --output    Thư mục output hoặc đường dẫn .pdf khi format=pdf.
  --help      Hiển thị hướng dẫn.`);
}

function safeFileName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "deck";
}

function relativeOutputPath(filepath) {
  return filepath.startsWith(repositoryRoot)
    ? filepath.slice(repositoryRoot.length + 1).replaceAll("\\", "/")
    : filepath;
}

function runPnpm(args, env) {
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, commandArgs, {
      cwd: repositoryRoot,
      env,
      stdio: "inherit",
      windowsHide: true
    });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(signal
        ? `Lệnh pnpm bị dừng bởi signal ${signal}.`
        : `Lệnh pnpm ${args.join(" ")} thất bại với exit code ${code ?? "unknown"}.`));
    });
  });
}

function startServer(port, env) {
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const args = npmExecPath
    ? [npmExecPath, "--filter", "@deckory/present", "exec", "next", "start", "-p", String(port)]
    : ["--filter", "@deckory/present", "exec", "next", "start", "-p", String(port)];
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32"
  });
  child.stdout?.on("data", (chunk) => process.stdout.write(`[export-server] ${chunk}`));
  child.stderr?.on("data", (chunk) => process.stderr.write(`[export-server] ${chunk}`));
  return child;
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolveStop) => {
      const killer = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { windowsHide: true });
      killer.once("exit", () => resolveStop());
      killer.once("error", () => resolveStop());
    });
  } else {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}

async function waitForServer(baseURL, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = new Error(`Server trả ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Server export không sẵn sàng sau ${timeoutMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function findAvailablePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.once("error", rejectPort);
    server.listen({ host: "127.0.0.1", port: 0 }, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        rejectPort(new Error("Không thể cấp port export cục bộ."));
        return;
      }
      server.close((error) => error ? rejectPort(error) : resolvePort(address.port));
    });
  });
}
