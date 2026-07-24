const fs = require("fs");
const path = require("path");

let serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

const oldBlock = "app.use('/api/upload', (req, res, next) => {\r\n    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart')) {\r\n      req.setEncoding('utf8');\r\n    }\r\n    next();\r\n  });\r\n\r\n";
content = content.replace(oldBlock, "");
fs.writeFileSync(serverPath, content, "utf8");
console.log("server.js fixed: removed req.setEncoding middleware");

let uhPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "upload-handler.js");
let uhContent = fs.readFileSync(uhPath, "utf8");
uhContent = uhContent.replace("  defParamCharset: 'utf8',\r\n", "");
fs.writeFileSync(uhPath, uhContent, "utf8");
console.log("upload-handler.js fixed: removed defParamCharset");
