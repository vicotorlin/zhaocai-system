const fs = require("fs");
const path = require("path");

let serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Remove the exact block
const block = `app.use('/api/upload', (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart')) {
    req.setEncoding('utf8');
  }
  next();
});

`;
content = content.replace(block, "");
fs.writeFileSync(serverPath, content, "utf8");

// Verify
if (content.includes("setEncoding")) {
  console.log("WARNING: setEncoding still present!");
} else {
  console.log("Verified: setEncoding removed from server.js");
}

// Fix upload-handler.js
let uhPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "upload-handler.js");
let uhContent = fs.readFileSync(uhPath, "utf8");
uhContent = uhContent.replace("  defParamCharset: 'utf8',\n", "");
fs.writeFileSync(uhPath, uhContent, "utf8");

if (uhContent.includes("defParamCharset")) {
  console.log("WARNING: defParamCharset still present!");
} else {
  console.log("Verified: defParamCharset removed from upload-handler.js");
}
