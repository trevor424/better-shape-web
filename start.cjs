const { execSync } = require("child_process");
const path = require("path");

const dir = "C:\\Users\\pc\\better-shape-web";
const npx = path.join("C:", "Program Files", "nodejs", "npx.cmd");

try {
  execSync(`"${npx}" vite --host`, {
    cwd: dir,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: "C:\\Program Files\\nodejs;" + (process.env.PATH || ""),
    },
  });
} catch (e) {
  console.error(e.message);
}
