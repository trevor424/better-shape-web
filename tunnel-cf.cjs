const { execSync } = require("child_process");
const path = require("path");

const npx = path.join("C:", "Program Files", "nodejs", "npx.cmd");

try {
  execSync(
    `"${npx}" --yes cloudflared tunnel --url http://localhost:5173`,
    {
      encoding: "utf8",
      stdio: "inherit",
      timeout: 600000,
      env: {
        ...process.env,
        PATH: "C:\\Program Files\\nodejs;" + (process.env.PATH || ""),
      },
    }
  );
} catch (e) {
  console.error(e.message);
}
