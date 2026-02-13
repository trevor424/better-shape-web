const { execSync } = require("child_process");
const path = require("path");

const dir = "C:\\Users\\pc\\better-shape-web";
const npx = path.join("C:", "Program Files", "nodejs", "npx.cmd");

try {
  const result = execSync(`"${npx}" vite build`, {
    cwd: dir,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
    env: {
      ...process.env,
      PATH: "C:\\Program Files\\nodejs;" + (process.env.PATH || ""),
    },
  });
  console.log(result);
} catch (e) {
  console.error("STDOUT:", e.stdout);
  console.error("STDERR:", e.stderr);
  process.exit(1);
}
