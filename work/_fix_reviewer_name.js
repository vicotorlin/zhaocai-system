const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Fix the reviewer projects endpoint (line 823-845)
// Add user lookup before the map
const oldRevLine = `  const enriched = allProjects.map(p => {
    const quotes = allBids.filter(q => q.project_id === p.id);`;

const newRevLine = `  const allUsers = await db.getAllUsers().catch(() => []);
  const userMap = {};
  allUsers.forEach(u => { userMap[u.account] = u; });
  const enriched = allProjects.map(p => {
    const quotes = allBids.filter(q => q.project_id === p.id);`;

// Only replace the second occurrence (reviewer endpoint)
const firstIdx = content.indexOf(oldRevLine);
const secondIdx = content.indexOf(oldRevLine, firstIdx + 1);
if (secondIdx >= 0) {
  content = content.substring(0, secondIdx) + newRevLine + content.substring(secondIdx + oldRevLine.length);
  console.log("Reviewer projects: added user lookup");
}

// Fix the return object in reviewer endpoint - add buyerName
const oldRevReturn = `return {
      id: p.id,
      buyerAccount: p.buyer_account,
      projectName: p.project_name,
      buyer: p.buyer,`;

const newRevReturn = `return {
      id: p.id,
      buyerAccount: p.buyer_account,
      projectName: p.project_name,
      buyer: p.buyer_account,
      buyerName: (userMap[p.buyer_account] && userMap[p.buyer_account].name) || p.buyer_account,`;

// Only replace the second occurrence
const firstRetIdx = content.indexOf(oldRevReturn);
const secondRetIdx = content.indexOf(oldRevReturn, firstRetIdx + 1);
if (secondRetIdx >= 0) {
  content = content.substring(0, secondRetIdx) + newRevReturn + content.substring(secondRetIdx + oldRevReturn.length);
  console.log("Reviewer projects: added buyerName");
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("Done");
