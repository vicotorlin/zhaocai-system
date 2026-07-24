const fs = require("fs");
const path = require("path");
const vm = require("vm");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// Extract JavaScript between <script> tags
let scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log("JavaScript syntax: VALID");
  } catch(e) {
    console.log("JavaScript syntax ERROR: " + e.message);
    // Show context around error
    let lines = scriptMatch[1].split("\n");
    let errLine = e.stack.match(/<anonymous>:(\d+)/);
    if (errLine) {
      let ln = parseInt(errLine[1]) - 1;
      console.log("Error near line " + (ln+1) + ":");
      for (let i = Math.max(0, ln-2); i <= Math.min(lines.length-1, ln+2); i++) {
        console.log("  " + (i+1) + ": " + lines[i].substring(0, 120));
      }
    }
  }
}

// Show the fixed line
let lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("closeBtn") && lines[i].includes("btn-danger")) {
    console.log("\nFixed line " + (i+1) + ":");
    console.log(lines[i].substring(0, 200));
  }
}
