const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let buf = fs.readFileSync(filePath);
let content = buf.toString("utf8");

// Search for the exact button string using UTF-8 pattern
const oldPattern = "<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>";
const newPattern = "(p.status===\"open\"?'<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>')";

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Button conditional applied: open-only");
} else {
  console.log("Pattern not found. Searching...");
  // Debug: find what's there
  let idx = content.indexOf("close-project");
  if (idx >= 0) {
    console.log("Found at position " + idx);
    console.log("Context: " + JSON.stringify(content.substring(idx-50, idx+200)));
  }
}
