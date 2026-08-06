import { z } from "zod";
import { InspectorSchemaSchema, type InspectorSchema } from "./inspector-schema";

export const MAX_WEB_BLOCK_SOURCE_BYTES = 1024 * 1024;
export const MAX_WEB_BLOCK_ASSET_BYTES = 4 * 1024 * 1024;

export const REVIEWED_WEB_BLOCK_IMPORTS = Object.freeze([
  "@deckory/web-block-runtime",
  "react",
  "react/jsx-runtime",
  "react-dom/client"
] as const);

const reviewedImports = new Set<string>(REVIEWED_WEB_BLOCK_IMPORTS);
const stableId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const semanticVersion = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
const sourcePath = z.string().trim().min(1).max(240);

export const WebBlockManifestSchema = z.object({
  id: stableId,
  version: semanticVersion,
  entry: sourcePath,
  framework: z.enum(["html", "react"]),
  accessibleSummary: z.string().trim().min(1).max(2_000),
  staticFallback: z.object({
    type: z.enum(["svg", "png"]),
    assetId: stableId
  }).strict(),
  inspector: InspectorSchemaSchema.optional(),
  allowedImports: z.array(z.string().trim().min(1)).max(32),
  payloadBytes: z.number().int().nonnegative().max(MAX_WEB_BLOCK_SOURCE_BYTES),
  localAssetBytes: z.number().int().nonnegative().max(MAX_WEB_BLOCK_ASSET_BYTES).default(0)
}).strict().superRefine((manifest, context) => {
  const seen = new Set<string>();
  manifest.allowedImports.forEach((specifier, index) => {
    if (!reviewedImports.has(specifier)) {
      context.addIssue({
        code: "custom",
        path: ["allowedImports", index],
        message: `Import ${specifier} không nằm trong allowlist Web Block đã review.`
      });
    }
    if (seen.has(specifier)) {
      context.addIssue({ code: "custom", path: ["allowedImports", index], message: `Import ${specifier} bị khai báo trùng.` });
    }
    seen.add(specifier);
  });
});

export const WebBlockSourceSchema = z.object({
  entry: sourcePath,
  files: z.record(sourcePath, z.string()).refine((files) => Object.keys(files).length > 0, "Web Block source phải có ít nhất một file")
}).strict();

export type WebBlockManifestInput = Omit<z.input<typeof WebBlockManifestSchema>, "inspector"> & {
  inspector?: InspectorSchema;
};
export type WebBlockManifest = Omit<z.infer<typeof WebBlockManifestSchema>, "inspector"> & {
  inspector?: InspectorSchema;
};
export type WebBlockSource = z.infer<typeof WebBlockSourceSchema>;

export type WebBlockDiagnosticCode =
  | "unsafe-path"
  | "unsupported-file-type"
  | "entry-not-found"
  | "entry-mismatch"
  | "source-too-large"
  | "manifest-payload-understated"
  | "remote-import-denied"
  | "import-not-allowed"
  | "local-import-not-found"
  | "local-import-escapes-root"
  | "commonjs-require-denied"
  | "dynamic-import-denied"
  | "executable-constructor-denied";

export interface WebBlockDiagnostic {
  code: WebBlockDiagnosticCode;
  message: string;
  file?: string;
  specifier?: string;
}

export type WebBlockSourceValidationResult =
  | { ok: true; source: WebBlockSource; manifest: WebBlockManifest; diagnostics: readonly [] }
  | { ok: false; diagnostics: readonly WebBlockDiagnostic[] };

function freezeDeep<T>(value: T, seen = new Set<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child, seen);
  return Object.freeze(value);
}

function isSafeSourcePath(path: string): boolean {
  if (path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
  return !path.split("/").some((segment) => segment === ".." || segment === "" || segment === ".");
}

function hasSupportedExtension(path: string): boolean {
  return /\.(?:ts|tsx|js|jsx|css|html)$/i.test(path);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function collectImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const pattern = /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (match[1]) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function isRemoteSpecifier(specifier: string): boolean {
  return /^(?:https?:|data:|blob:|file:|node:|\/\/)/i.test(specifier);
}

function isLocalSpecifier(specifier: string): boolean {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function resolveLocalImport(
  fromFile: string,
  specifier: string
): { resolved?: string; escapedRoot: boolean } {
  const segments = fromFile.split("/");
  segments.pop();
  for (const segment of specifier.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") {
      if (segments.length === 0) return { escapedRoot: true };
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return { resolved: segments.join("/"), escapedRoot: false };
}

function localImportExists(files: Record<string, string>, resolved: string): boolean {
  if (resolved in files) return true;
  return [".ts", ".tsx", ".js", ".jsx", ".css", ".html", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"]
    .some((suffix) => `${resolved}${suffix}` in files);
}

export function defineWebBlockManifest(input: WebBlockManifestInput): WebBlockManifest {
  return freezeDeep(WebBlockManifestSchema.parse(input)) as WebBlockManifest;
}

export function validateWebBlockManifest(input: WebBlockManifestInput): WebBlockManifest {
  return defineWebBlockManifest(input);
}

export function validateWebBlockSource(
  sourceInput: z.input<typeof WebBlockSourceSchema>,
  manifestInput: WebBlockManifestInput
): WebBlockSourceValidationResult {
  const source = WebBlockSourceSchema.parse(sourceInput);
  const manifest = defineWebBlockManifest(manifestInput);
  const diagnostics: WebBlockDiagnostic[] = [];

  for (const path of Object.keys(source.files)) {
    if (!isSafeSourcePath(path)) diagnostics.push({ code: "unsafe-path", file: path, message: `Đường dẫn source không an toàn: ${path}.` });
    else if (!hasSupportedExtension(path)) diagnostics.push({ code: "unsupported-file-type", file: path, message: `Loại file không được hỗ trợ: ${path}.` });
  }
  if (!isSafeSourcePath(source.entry)) diagnostics.push({ code: "unsafe-path", file: source.entry, message: `Entry path không an toàn: ${source.entry}.` });
  if (!(source.entry in source.files)) diagnostics.push({ code: "entry-not-found", file: source.entry, message: `Không tìm thấy Web Block entry: ${source.entry}.` });
  if (source.entry !== manifest.entry) diagnostics.push({ code: "entry-mismatch", file: source.entry, message: `Source entry ${source.entry} không khớp manifest entry ${manifest.entry}.` });

  const totalBytes = Object.values(source.files).reduce((total, contents) => total + byteLength(contents), 0);
  if (totalBytes > MAX_WEB_BLOCK_SOURCE_BYTES) {
    diagnostics.push({ code: "source-too-large", message: `Web Block source vượt giới hạn ${MAX_WEB_BLOCK_SOURCE_BYTES} bytes.` });
  }
  if (totalBytes > manifest.payloadBytes) {
    diagnostics.push({
      code: "manifest-payload-understated",
      message: `Manifest khai báo ${manifest.payloadBytes} bytes nhưng source thực tế là ${totalBytes} bytes.`
    });
  }

  for (const [file, contents] of Object.entries(source.files)) {
    if (/\b(?:eval\s*\(|new\s+Function\s*\(|Function\s*\()/u.test(contents)) {
      diagnostics.push({ code: "executable-constructor-denied", file, message: "eval và Function constructor không được phép trong Web Block source." });
    }
    if (/\brequire\s*\(/u.test(contents)) {
      diagnostics.push({ code: "commonjs-require-denied", file, message: "CommonJS require không được phép trong Web Block source." });
    }
    if (/\bimport\s*\(/u.test(contents)) {
      diagnostics.push({ code: "dynamic-import-denied", file, message: "Dynamic import không được phép trong Web Block source." });
    }
    for (const specifier of collectImportSpecifiers(contents)) {
      if (isRemoteSpecifier(specifier)) {
        diagnostics.push({ code: "remote-import-denied", file, specifier, message: `Remote import bị từ chối: ${specifier}.` });
        continue;
      }
      if (isLocalSpecifier(specifier)) {
        const resolution = resolveLocalImport(file, specifier);
        if (resolution.escapedRoot || !resolution.resolved) {
          diagnostics.push({
            code: "local-import-escapes-root",
            file,
            specifier,
            message: `Local import vượt khỏi virtual source root: ${specifier}.`
          });
        } else if (!isSafeSourcePath(resolution.resolved) || !localImportExists(source.files, resolution.resolved)) {
          diagnostics.push({ code: "local-import-not-found", file, specifier, message: `Không tìm thấy local import: ${specifier}.` });
        }
        continue;
      }
      if (!manifest.allowedImports.includes(specifier)) {
        diagnostics.push({ code: "import-not-allowed", file, specifier, message: `Import không nằm trong manifest allowlist: ${specifier}.` });
      }
    }
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics: freezeDeep(diagnostics) };
  return { ok: true, source: freezeDeep(source), manifest, diagnostics: [] };
}
