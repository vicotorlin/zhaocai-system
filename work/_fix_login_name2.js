const fs = require("fs");
const path = require("path");

// Fix login.html to read name from r.data.name
const loginPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "login.html");
let content = fs.readFileSync(loginPath, "utf8");

const oldNameRead = 'var userName = r.name || ""';
const newNameRead = 'var userName = (r.data && r.data.name) || r.name || ""';
if (content.includes(oldNameRead)) {
  content = content.replace(oldNameRead, newNameRead);
  console.log("Fixed login name reading");
}

fs.writeFileSync(loginPath, content, "utf8");
console.log("login.html name reading fixed");
