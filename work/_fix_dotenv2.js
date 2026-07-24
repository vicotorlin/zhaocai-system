const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Add path require before dotenv
const oldDotenv = 'require("dotenv").config({ path: path.join(__dirname, ".env") });';
const newDotenv = 'const path = require("path");\nrequire("dotenv").config({ path: path.join(__dirname, ".env") });';

content = content.replace(oldDotenv, newDotenv);
fs.writeFileSync(serverPath, content, "utf8");
console.log("Fixed: added path require before dotenv");
