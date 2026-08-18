import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Vitest 4 on Windows fails when the process cwd uses a lowercase drive
 * letter (`c:\...`) while Vite internally compares `C:\...` URLs.
 */
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const normalizedRoot =
  process.platform === "win32"
    ? projectRoot.replace(/^([a-zA-Z]):/, (_, letter) => `${letter.toUpperCase()}:`)
    : projectRoot;

process.chdir(normalizedRoot);

const result = spawnSync(
  process.execPath,
  ["./node_modules/vitest/vitest.mjs", "run", ...process.argv.slice(2)],
  {
    cwd: normalizedRoot,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
