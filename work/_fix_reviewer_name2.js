const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Find the reviewer return block
let idx = content.indexOf("buyer: p.buyer,");
console.log("Found at " + idx);
if (idx >= 0) {
  // Check surrounding context
  console.log(content.substring(idx - 80, idx + 80));
}

// Fix it
if (idx >= 0) {
  content = content.substring(0, idx) + "buyer: p.buyer_account, buyerName: (userMap[p.buyer_account] && userMap[p.buyer_account].name) || p.buyer_account," + content.substring(idx + "buyer: p.buyer,".length);
  console.log("Fixed reviewer return");
}

fs.writeFileSync(serverPath, content, "utf8");
