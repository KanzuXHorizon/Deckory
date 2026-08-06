import { readFile } from "node:fs/promises";
import ts from "typescript";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isMissingModule = error && typeof error === "object" && error.code === "ERR_MODULE_NOT_FOUND";
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    if (!isMissingModule || !isRelative) throw error;

    const candidates = specifier.endsWith(".js")
      ? [`${specifier.slice(0, -3)}.ts`, `${specifier.slice(0, -3)}.tsx`]
      : /\.[a-z0-9]+$/i.test(specifier)
        ? []
        : [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`, `${specifier}/index.tsx`];

    for (const candidate of candidates) {
      try {
        return await nextResolve(candidate, context);
      } catch (candidateError) {
        const candidateMissing = candidateError && typeof candidateError === "object" && candidateError.code === "ERR_MODULE_NOT_FOUND";
        if (!candidateMissing) throw candidateError;
      }
    }

    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !/\.tsx?$/i.test(new URL(url).pathname)) {
    return nextLoad(url, context);
  }
  const source = await readFile(new URL(url), "utf8");
  const result = ts.transpileModule(source, {
    fileName: new URL(url).pathname,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      verbatimModuleSyntax: true,
      isolatedModules: true,
      sourceMap: false,
      inlineSourceMap: false
    },
    reportDiagnostics: true
  });
  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) {
    const formatted = ts.formatDiagnostics(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n"
    });
    throw new Error(`TypeScript loader không thể transpile ${url}:\n${formatted}`);
  }
  return {
    format: "module",
    source: result.outputText,
    shortCircuit: true
  };
}
