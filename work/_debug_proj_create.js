const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Find the project creation block
let idx = content.indexOf('app.post("/api/buyer/projects"');
let chunk = content.substring(idx, idx + 1000);
console.log(chunk.substring(0, 600));
