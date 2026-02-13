const { execSync } = require("child_process");
const path = require("path");

const dir = "C:\\Users\\pc\\better-shape-web";
const npx = path.join("C:", "Program Files", "nodejs", "npx.cmd");

function run(cmd) {
  console.log("> " + cmd);
  const r = execSync(cmd, {
    cwd: dir,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
    env: {
      ...process.env,
      PATH: "C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;" + (process.env.PATH || ""),
    },
  });
  console.log(r);
  return r;
}

// Deploy dist folder to gh-pages branch
run(`"${npx}" --yes gh-pages -d dist`);
console.log("Deployed to GitHub Pages!");
