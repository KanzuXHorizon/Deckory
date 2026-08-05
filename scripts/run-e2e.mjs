import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const runId = `${Date.now().toString(36)}-${process.pid}`;
const distDir = `.next-e2e-${runId}`;
const distPath = resolve(repositoryRoot, "apps", "present", distDir);
const port = await findAvailablePort();
const environment = {
  ...process.env,
  DECKORY_NEXT_DIST_DIR: distDir,
  DECKORY_E2E_PORT: String(port),
  DECKORY_E2E_BASE_URL: `http://127.0.0.1:${port}`,
  DECKORY_E2E_RUN_ID: runId
};

console.log(`[deckory:e2e] run=${runId} port=${port} dist=${distDir}`);

let exitCode = 1;
try {
  await runPnpm(["--filter", "@deckory/present", "build"], environment);
  await runPnpm(["exec", "playwright", "test"], environment);
  exitCode = 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  try {
    rmSync(distPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  } catch (error) {
    console.warn(`[deckory:e2e] Không thể dọn ${distDir}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

process.exitCode = exitCode;

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
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(
        signal
          ? `Lệnh pnpm bị dừng bởi signal ${signal}.`
          : `Lệnh pnpm ${args.join(" ")} thất bại với exit code ${code ?? "unknown"}.`
      ));
    });
  });
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
        rejectPort(new Error("Không thể cấp port E2E cục bộ."));
        return;
      }
      const selectedPort = address.port;
      server.close((error) => error ? rejectPort(error) : resolvePort(selectedPort));
    });
  });
}
