const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// Check the closeProject insertion area
let idx = content.indexOf("function closeProject");
let chunk = content.substring(idx - 50, idx + 250);
console.log("=== closeProject area ===");
console.log(chunk);

// Check the loadBuyerProjects close button
idx = content.indexOf("close-project");
let lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("close-project") && lines[i].includes("btn-danger")) {
    console.log("\n=== Button line " + (i+1) + " ===");
    console.log(lines[i]);
  }
}
