const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// Find the buggy line in loadSupplierProjects
// Current: var actionBtn=hasBid?'<button ...>修改报价</button>':(p.status==="open"?'<button ...>立即报价</button>':'<span ...>已截止</span>');
// Problem: when hasBid is true, doesn't check p.status==="open"
// Fix: Check p.status first, then hasBid

const buggyLine = "var actionBtn=hasBid?'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\" data-bid=\"'+myBidIds[p.id]+'\">\u4fee\u6539\u62a5\u4ef7</button>':(p.status===\"open\"?'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\">\u7acb\u5373\u62a5\u4ef7</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>');";

const fixedLine = "var actionBtn=p.status===\"open\"?(hasBid?'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\" data-bid=\"'+myBidIds[p.id]+'\">\u4fee\u6539\u62a5\u4ef7</button>':'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\">\u7acb\u5373\u62a5\u4ef7</button>'):'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>';";

if (content.includes(buggyLine)) {
  content = content.replace(buggyLine, fixedLine);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Fixed: supplier action button now checks project status first");
} else {
  console.log("Buggy line not found with exact match, trying alternate...");
  
  // Just search for the beginning of the actionBtn line
  let lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("actionBtn=hasBid") && lines[i].includes("修改报价")) {
      console.log("Found at line " + (i+1));
      console.log("Old: " + lines[i].substring(0, 100) + "...");
      
      // More aggressive fix: just check if hasBid block also needs open check
      lines[i] = "var actionBtn=p.status===\"open\"?(hasBid?'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\" data-bid=\"'+myBidIds[p.id]+'\">\u4fee\u6539\u62a5\u4ef7</button>':'<button class=\"btn btn-primary btn-sm\" data-action=\"open-bid\" data-pid=\"'+p.id+'\">\u7acb\u5373\u62a5\u4ef7</button>'):'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>';";
      content = lines.join("\n");
      fs.writeFileSync(filePath, content, "utf8");
      console.log("Fixed line " + (i+1));
      break;
    }
  }
}

// Verify
content = fs.readFileSync(filePath, "utf8");
if (content.includes('p.status==="open"?(hasBid?')) {
  console.log("Verified: status check before hasBid");
} else {
  console.log("WARNING: fix not applied properly");
}

// Syntax check
const vm = require("vm");
let scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log("JavaScript syntax: VALID");
  } catch(e) {
    console.log("JavaScript syntax ERROR: " + e.message);
  }
}
