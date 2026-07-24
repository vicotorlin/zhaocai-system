const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Fix project creation: look up buyer name
const oldProjCreate = "const project = {\n      id,\n      buyer_account: buyerAccount,\n      project_name: projectName,\n      buyer: buyer || buyerAccount,";
const newProjCreate = `const buyerUser = await db.getUser(buyerAccount).catch(() => null);
    const buyerName = buyerUser ? (buyerUser.name || buyerAccount) : buyerAccount;
    const project = {
      id,
      buyer_account: buyerAccount,
      buyer_name: buyerName,
      project_name: projectName,
      buyer: buyer || buyerAccount,`;

if (content.includes(oldProjCreate)) {
  content = content.replace(oldProjCreate, newProjCreate);
  console.log("Project creation: look up buyer name");
} else {
  console.log("Project creation pattern not found");
}

// Fix: reviewer projects endpoint - look up buyer names
// Current pattern: allProjects.map(p => { ... buyer: p.buyer_account, buyerName: p.buyer_name || p.buyer_account, ... }
// The issue: p.buyer_name is undefined. Need to look up user.
// But map is sync. Let me restructure this.

const oldReviewerMap = "const enriched = allProjects.map(p => {";
const newReviewerMap = `const allUsers = await db.getAllUsers().catch(() => []);
    const userMap = {};
    allUsers.forEach(u => { userMap[u.account] = u; });
    const enriched = allProjects.map(p => {`;

if (content.includes(oldReviewerMap)) {
  content = content.replace(oldReviewerMap, newReviewerMap);
  console.log("Reviewer projects: add user lookup before map");
}

// Fix the buyer field to use user name
const oldRevBuyer = "buyer: p.buyer_account, buyerName: p.buyer_name || p.buyer_account,";
const newRevBuyer = `buyer: p.buyer_account, buyerName: (userMap[p.buyer_account] && userMap[p.buyer_account].name) || p.buyer_account,`;
if (content.includes(oldRevBuyer)) {
  content = content.replace(oldRevBuyer, newRevBuyer);
  console.log("Reviewer projects: use user name for buyerName");
}

// Fix: quotes endpoint - add buyer_name to project
const oldQuoteProj = "buyer: project.buyer_account || \"\", buyerName: project.buyer_name || project.buyer_account || \"\",";
const newQuoteProj = `buyer: project.buyer_account || "", buyerName: project.buyer_name || project.buyer_account || "",`;
// Same pattern, check if buyer_name exists in project
// The project in Supabase might not have buyer_name, but the memory store now will after project creation fix
// Let me just verify and make it look up user if buyer_name is missing

// Actually the quotes endpoint already uses project.buyer_account. Let me make it look up user
// Find the quotes endpoint project block
const oldQBlock = `res.json({ success: true, total: quotes.length, data: quotes, collusionWarnings, project: {
    id: project.id,
    projectName: project.project_name || "",
    buyer: project.buyer_account || "", buyerName: project.buyer_name || project.buyer_account || "",`;
if (content.includes(oldQBlock)) {
  const newQBlock = `const buyerUser2 = await db.getUser(project.buyer_account).catch(() => null);
  res.json({ success: true, total: quotes.length, data: quotes, collusionWarnings, project: {
    id: project.id,
    projectName: project.project_name || "",
    buyer: project.buyer_account || "", buyerName: (buyerUser2 && buyerUser2.name) || project.buyer_account || "",`;
  content = content.replace(oldQBlock, newQBlock);
  console.log("Quotes endpoint: look up buyer name");
} else {
  console.log("Quotes project block not found");
}

// Fix: buyer projects endpoint - look up user for name  
// Already has: buyer: project.buyer_account || "", buyerName: project.buyer_name || project.buyer_account || "","
// Just need to look up user
const oldBProjMap = "const enriched = allProjects";
// Let me find the map function for buyer projects
const bIdx = content.indexOf('app.get("/api/buyer/projects"');
const bChunk = content.substring(bIdx, bIdx + 800);
// Find the map call
if (bChunk.includes("allProjects.filter")) {
  console.log("Buyer projects uses filter, not map with enrichment");
  // This endpoint filters by buyer account, not map
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("server.js updated");
