const fs = require("fs");
const p = require("path");
const root = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2");

const rootPkg = JSON.stringify({
  "name": "zhaocai-system",
  "version": "1.0.0",
  "scripts": { "start": "cd server && node server.js" },
  "engines": { "node": ">=18" }
}, null, 2);
fs.writeFileSync(p.join(root, "package.json"), rootPkg, "utf8");

const gitignore = "node_modules/\n.env\noutputs/uploads/*\n!outputs/uploads/.gitkeep\n*.log\n.DS_Store\n";
fs.writeFileSync(p.join(root, ".gitignore"), gitignore, "utf8");

console.log("Done: package.json + .gitignore created");
