const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// In reviewer projects, add buyerName by looking up user
// The endpoint processes allProjects.map(p => { ... })
// p.buyer is the buyer_account. We need to look up the user.
// But since this is async .map, we can't easily await inside. 
// Let me change the approach: collect buyer accounts, look them up, then map

// Actually, a simpler approach: the project record might have buyer_name from Supabase.
// But in memory, it only has buyer_account. Let me change the map to just add buyerName as buyer_account
// since we're using in-memory storage.

// The simplest fix: add buyerName: p.buyer_name || p.buyer_account to the return object

const oldReviewerReturn = "buyer: p.buyer,";
const newReviewerReturn = "buyer: p.buyer_account, buyerName: p.buyer_name || p.buyer_account,";
if (content.includes(oldReviewerReturn)) {
  content = content.replace(oldReviewerReturn, newReviewerReturn);
  console.log("Reviewer projects: add buyerName");
}

// Also update the buyer projects endpoint similarly
// It already has buyer: project.buyer_account which I already fixed
// But let me verify and also fix the reviewer view

// Update buyer projects to also include buyerName
const oldBuyerProj = "buyer: project.buyer_account || \"\"";
// This was already replaced earlier, so skip

fs.writeFileSync(serverPath, content, "utf8");
console.log("server.js updated");
