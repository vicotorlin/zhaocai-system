const fs = require("fs");
const path = require("path");

let serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Find and remove lines containing setEncoding
let lines = content.split(/\r?\n/);
let newLines = [];
let skipBlock = false;
let blockDepth = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("app.use('/api/upload'") && lines[i].includes("setEncoding")) {
    // This is the start of the block, skip until we find the closing
    skipBlock = true;
    continue;
  }
  if (skipBlock) {
    if (lines[i].includes("req.setEncoding('utf8')")) continue;
    if (lines[i].includes("next();")) continue;
    if (lines[i].includes("});") && !lines[i].includes("app.post")) {
      skipBlock = false;
      continue;
    }
    continue;
  }
  newLines.push(lines[i]);
}

content = newLines.join("\n");
fs.writeFileSync(serverPath, content, "utf8");
console.log("server.js: removed setEncoding middleware");

// Verify
content = fs.readFileSync(serverPath, "utf8");
if (content.includes("setEncoding")) {
  console.log("WARNING: setEncoding still present!");
} else {
  console.log("Verified: setEncoding removed");
}
