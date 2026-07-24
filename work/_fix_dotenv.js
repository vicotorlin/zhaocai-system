const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Fix dotenv path to point to server/.env
const oldDotenv = 'require("dotenv").config();';
const newDotenv = 'require("dotenv").config({ path: path.join(__dirname, ".env") });';

if (content.includes(oldDotenv)) {
  content = content.replace(oldDotenv, newDotenv);
  console.log("Fixed dotenv path");
} else {
  console.log("Pattern not found");
}

// Also check if 'path' is already required
if (!content.includes('const path = require("path");') || content.indexOf('const path = require("path");') > content.indexOf('require("dotenv")')) {
  // Add path require before dotenv if not there
  const pathRequire = 'const path = require("path");\n';
  if (!content.includes('const path = require("path");')) {
    // Find the first require and add before it
    content = content.replace('require("dotenv")', pathRequire + 'require("dotenv")');
    console.log("Added path require");
  }
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("Done");
