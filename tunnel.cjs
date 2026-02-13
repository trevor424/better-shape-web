const { execSync } = require("child_process");
const path = require("path");

const npx = path.join("C:", "Program Files", "nodejs", "npx.cmd");

try {
  const result = execSync(
    `"${npx}" --yes localtunnel --port 5173`,
    {
      encoding: "utf8",
      stdio: "inherit",
      timeout: 300000,
      env: {
        ...process.env,
        PATH: "C:\\Program Files\\nodejs;" + (process.env.PATH || ""),
      },
    }
  );
} catch (e) {
  console.error(e.message);
}
