const fs = require("fs");
const path = require("path");

let serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");
let lines = content.split(/\r?\n/);

// Find all occurrences of setEncoding
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("setEncoding")) {
    console.log("Line " + (i+1) + ": " + JSON.stringify(lines[i]));
    // Show surrounding context
    for (let j = Math.max(0, i-5); j <= Math.min(lines.length-1, i+5); j++) {
      console.log("  " + (j+1) + ": " + JSON.stringify(lines[j]));
    }
  }
}
