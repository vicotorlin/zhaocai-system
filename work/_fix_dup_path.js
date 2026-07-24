const fs = require("fs");
const p = require("path");

const serverPath = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Remove the second duplicate path require, keep the first
const lines = content.split("\n");
let foundFirst = false;
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'const path = require("path");') {
    if (!foundFirst) {
      foundFirst = true;
      newLines.push(lines[i]);
    }
    // Skip duplicate
  } else {
    newLines.push(lines[i]);
  }
}
content = newLines.join("\n");
fs.writeFileSync(serverPath, content, "utf8");
console.log("Removed duplicate path require");

// Verify
const verify = fs.readFileSync(serverPath, "utf8");
const pathCount = (verify.match(/const path = require\("path"\)/g) || []).length;
console.log("path require count:", pathCount);
