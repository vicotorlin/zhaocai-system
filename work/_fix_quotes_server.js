const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Fix: Add project info to quotes response
const oldResponse = 'res.json({ success: true, total: quotes.length, data: quotes, collusionWarnings })';
const newResponse = `res.json({ success: true, total: quotes.length, data: quotes, collusionWarnings, project: {
    id: project.id,
    projectName: project.project_name || "",
    buyer: project.buyer_account || "",
    budget: project.budget || 0,
    deadline: project.deadline || "",
    status: project.status || "open"
  } })`;

if (content.includes(oldResponse)) {
  content = content.replace(oldResponse, newResponse);
  fs.writeFileSync(serverPath, content, "utf8");
  console.log("Server: Added project info to quotes response");
} else {
  console.log("Pattern not found. Searching for quotes response...");
  // Find the res.json line
  let idx = content.indexOf("total: quotes.length");
  if (idx >= 0) {
    console.log("Found at " + idx);
    console.log(content.substring(idx - 30, idx + 80));
  }
}
