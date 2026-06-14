import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { basename, extname, join } from "path";
import { platform } from "os";

const envFile = join(process.cwd(), ".env");

if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, "utf8");

  for (const line of envContent.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

const currentPlatform = platform();
const devVaultRoot =
  process.env.DEV_VAULT_ROOT ||
  (currentPlatform === "darwin" ? process.env.DEV_VAULT_ROOT_MAC : undefined) ||
  (currentPlatform === "win32" ? process.env.DEV_VAULT_ROOT_WINDOWS : undefined);

if (!devVaultRoot) {
  console.error(
    "Missing dev vault path. Set DEV_VAULT_ROOT, or set DEV_VAULT_ROOT_MAC / DEV_VAULT_ROOT_WINDOWS in .env."
  );
  process.exit(1);
}

const input = process.argv?.[2] ?? "src/index.scss";
const output = basename(input).replace(extname(input), ".css");
const targetFile = `${devVaultRoot}/.obsidian/snippets/${output}`;

const command =
  currentPlatform === "win32"
    ? "cmd.exe"
    : join(process.cwd(), "node_modules", ".bin", "sass");

const args = [
  ...(currentPlatform === "win32"
    ? ["/c", join(process.cwd(), "node_modules", ".bin", "sass.CMD")]
    : []),
  `${input}:${targetFile}`,
  "--watch",
  "--no-source-map",
  "--update",
];

console.log("devVaultRoot:", devVaultRoot);
console.log("Input file:", input);
console.log("Output file:", output);
console.log("Target file:", targetFile);

const childProcess = spawn(command, args, { env: process.env });

childProcess.stdout.on("data", (data) => {
  console.log(data.toString());
});

childProcess.stderr.on("data", (data) => {
  console.error(data.toString());
});

childProcess.on("error", (error) => {
  console.error("Error:", error);
});
