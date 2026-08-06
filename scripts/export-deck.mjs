import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { assertPngDimensions, createSlideImageClip } from "./export-image-contract.mjs";
import { writeImageDeckPptx } from "./pptx-image-deck.mjs";

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
const explicitOutputFile = ["pdf", "pptx", "html", "svg"].includes(options.format) && extname(options.output).toLowerCase() === `.${options.format}`
  ? requestedOutputPath
  : undefined;
const outputRoot = explicitOutputFile ? dirname(explicitOutputFile) : requestedOutputPath;

mkdirSync(outputRoot, { recursive: true });
if (options.format === "html" || options.format === "svg") {
  await exportStaticV2();
  process.exit(0);
}

const port = await findAvailablePort();
const environment = {
  ...process.env,
  DECKORY_NEXT_DIST_DIR: distDir
};

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
  const keepPng = ["png", "all"].includes(options.format);
  const wantsJpeg = ["jpg", "jpeg", "all"].includes(options.format);
  const wantsPdf = ["pdf", "all"].includes(options.format);
  const wantsPptx = ["pptx", "all"].includes(options.format);
  const needsPng = keepPng || wantsPptx;
  const pptxImages = [];

  if (needsPng) {
    const pngDirectory = keepPng
      ? join(outputRoot, `${safeFileName(options.deck)}-png`)
      : join(distPath, "pptx-images");
    mkdirSync(pngDirectory, { recursive: true });

    for (let index = 0; index < slideCount; index += 1) {
      const slide = slides.nth(index);
      const slideId = await slide.getAttribute("data-export-slide-id") ?? `slide-${index + 1}`;
      const filename = `${String(index + 1).padStart(2, "0")}-${safeFileName(slideId)}.png`;
      const filepath = join(pngDirectory, filename);
      await captureSlideImage(page, slide, { path: filepath, type: "png" });
      assertPngDimensions(filepath);
      pptxImages.push(filepath);
      if (keepPng) files.push(relativeOutputPath(filepath));
    }
  }

  if (wantsJpeg) {
    const jpegDirectory = join(outputRoot, `${safeFileName(options.deck)}-jpg`);
    mkdirSync(jpegDirectory, { recursive: true });
    for (let index = 0; index < slideCount; index += 1) {
      const slide = slides.nth(index);
      const slideId = await slide.getAttribute("data-export-slide-id") ?? `slide-${index + 1}`;
      const filepath = join(jpegDirectory, `${String(index + 1).padStart(2, "0")}-${safeFileName(slideId)}.jpg`);
      await captureSlideImage(page, slide, { path: filepath, type: "jpeg", quality: 92 });
      files.push(relativeOutputPath(filepath));
    }
  }

  if (wantsPdf) {
    const pdfPath = options.format === "pdf" && explicitOutputFile ? explicitOutputFile : join(outputRoot, `${safeFileName(options.deck)}.pdf`);
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

  if (wantsPptx) {
    const pptxPath = options.format === "pptx" && explicitOutputFile ? explicitOutputFile : join(outputRoot, `${safeFileName(options.deck)}.pptx`);
    mkdirSync(dirname(pptxPath), { recursive: true });
    writeImageDeckPptx({ outputPath: pptxPath, title: await page.title(), imagePaths: pptxImages });
    files.push(relativeOutputPath(pptxPath));
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

async function exportStaticV2() {
  await import("./register-typescript-loader.mjs");
  const [{ resolveAnyDeck }, { isDeckDocumentV2 }, renderer, staticExport] = await Promise.all([
    import("../apps/present/lib/deck-catalog.ts"),
    import("../apps/present/lib/deck-version.ts"),
    import("../packages/renderer/src/index.ts"),
    import("../packages/renderer/src/export/index.ts")
  ]);
  const deck = resolveAnyDeck(options.deck);
  if (!isDeckDocumentV2(deck)) {
    throw new Error(`Format ${options.format} yêu cầu DeckDocument V2; deck “${options.deck}” vẫn là V1.`);
  }

  const registry = { resolveComponent: () => undefined };
  const readLocalAsset = (asset) => readRepositoryAsset(asset);
  const capabilityReport = renderer.resolveDeckExportReport(deck, registry);
  const files = [];

  if (options.format === "html") {
    const html = await staticExport.exportDeckToStandaloneHtml(deck, { registry, readLocalAsset });
    const htmlPath = explicitOutputFile ?? join(outputRoot, `${safeFileName(deck.id)}.html`);
    mkdirSync(dirname(htmlPath), { recursive: true });
    writeFileSync(htmlPath, html, "utf8");
    files.push(relativeOutputPath(htmlPath));
  } else {
    if (explicitOutputFile && deck.slides.length !== 1) {
      throw new Error(`--output=.svg chỉ hợp lệ khi deck có đúng một slide; ${deck.id} có ${deck.slides.length} slide.`);
    }
    const svgDirectory = explicitOutputFile
      ? dirname(explicitOutputFile)
      : join(outputRoot, `${safeFileName(deck.id)}-svg`);
    mkdirSync(svgDirectory, { recursive: true });
    for (let index = 0; index < deck.slides.length; index += 1) {
      const slide = deck.slides[index];
      const svg = await staticExport.exportSlideToSvg(slide, {
        assets: deck.assets,
        registry,
        deckTitle: deck.title,
        readLocalAsset
      });
      const svgPath = explicitOutputFile ?? join(
        svgDirectory,
        `${String(index + 1).padStart(2, "0")}-${safeFileName(slide.id)}.svg`
      );
      writeFileSync(svgPath, svg, "utf8");
      files.push(relativeOutputPath(svgPath));
    }
  }

  const manifest = {
    version: 2,
    deckId: deck.id,
    documentRevision: deck.revision,
    format: options.format,
    slideCount: deck.slides.length,
    generatedAt: new Date().toISOString(),
    renderer: "Deckory V2 deterministic static export",
    canvas: { width: 1280, height: 720, aspectRatio: "16:9" },
    files,
    capabilityReport
  };
  const manifestPath = join(outputRoot, `${safeFileName(deck.id)}-${options.format}-export.json`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`[deckory:export] deck=${deck.id} format=${options.format} slides=${deck.slides.length}`);
  files.forEach((file) => console.log(`- ${file}`));
  console.log(`- ${relativeOutputPath(manifestPath)}`);
}

async function readRepositoryAsset(asset) {
  const source = asset.src.trim();
  let filepath;
  if (source.startsWith("/")) {
    filepath = resolve(repositoryRoot, "apps", "present", "public", `.${source}`);
  } else if (/^file:/i.test(source)) {
    filepath = fileURLToPath(source);
  } else {
    filepath = resolve(repositoryRoot, source);
  }
  const relativePath = relative(repositoryRoot, filepath);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Asset ${asset.id} vượt khỏi repository root: ${source}.`);
  }
  return readFile(filepath);
}

async function captureSlideImage(page, slide, screenshotOptions) {
  await slide.scrollIntoViewIfNeeded();
  const clip = createSlideImageClip(await slide.boundingBox());
  await page.screenshot({
    ...screenshotOptions,
    animations: "disabled",
    clip
  });
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
  if (!["pdf", "png", "jpg", "jpeg", "pptx", "html", "svg", "all"].includes(format)) {
    throw new Error(`Format “${format}” không hợp lệ. Chọn html, svg, pdf, png, jpg, pptx hoặc all.`);
  }
  const output = option("output") ?? "output/exports";
  const outputExtension = extname(output).toLowerCase();
  if (outputExtension && ![".pdf", ".pptx", ".html", ".svg"].includes(outputExtension)) {
    throw new Error("--output phải là thư mục, hoặc tệp .html/.svg/.pdf/.pptx phù hợp với format.");
  }
  if (outputExtension && outputExtension !== `.${format}`) {
    throw new Error(`Đường dẫn ${outputExtension} chỉ dùng được với --format=${outputExtension.slice(1)}.`);
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
  pnpm export:deck -- --deck=scene-foundation --format=html
  pnpm export:deck -- --deck=scene-foundation --format=svg --output=output/exports
  pnpm export:deck -- --deck=deckory-story --format=pdf
  pnpm export:deck -- --deck=template-gallery --format=png --output=output/exports
  pnpm export:deck -- --deck=visual-lab --format=jpg
  pnpm export:deck -- --deck=visual-lab --format=pptx
  pnpm export:deck -- --deck=visual-lab --format=all

Options:
  --deck      ID của deck đã đăng ký trong Deckory catalog.
  --format    html, svg, pdf, png, jpg, pptx hoặc all. Mặc định: pdf.
  --output    Thư mục output hoặc đường dẫn .html/.svg/.pdf/.pptx phù hợp format.
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
