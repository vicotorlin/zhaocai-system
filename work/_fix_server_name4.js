const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Find and fix project creation - add buyer_name lookup
const oldBlock = `  const project = {
    id,
    buyer_account: buyerAccount,
    project_name: projectName,
    buyer: buyer || buyerAccount,`;

const newBlock = `  const buyerUser = await db.getUser(buyerAccount).catch(() => null);
  const buyerName = buyerUser ? (buyerUser.name || buyerAccount) : buyerAccount;
  const project = {
    id,
    buyer_account: buyerAccount,
    buyer_name: buyerName,
    project_name: projectName,
    buyer: buyer || buyerAccount,`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  console.log("Project creation: add buyer_name lookup");
} else {
  console.log("Pattern not found");
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("Done");
