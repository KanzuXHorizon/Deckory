export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isMissingModule = error && typeof error === "object" && error.code === "ERR_MODULE_NOT_FOUND";
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    if (!isMissingModule || !isRelative) throw error;

    const candidates = specifier.endsWith(".js")
      ? [`${specifier.slice(0, -3)}.ts`]
      : /\.[a-z0-9]+$/i.test(specifier)
        ? []
        : [`${specifier}.ts`, `${specifier}/index.ts`];

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
