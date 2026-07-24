const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// Find the broken line and fix it
// The broken pattern:
// '+quoteBtn+'(p.status==="open"?'<button...>截止</button>':'<span...>已截止</span>')</td></tr>'
// 
// Replace with variable approach:
// First add: var closeBtn=p.status==="open"?'<button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">\u622a\u6b62</button>':'<span style="color:#999;font-size:12px">\u5df2\u622a\u6b62</span>';
// Then use: '+quoteBtn+closeBtn+'</td></tr>'

const brokenPattern = "+quoteBtn+'(p.status===\"open\"?'<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>')</td></tr>'";

if (content.includes(brokenPattern) || content.includes("+quoteBtn+'(p.status===")) {
  // Fix: add closeBtn variable before return, then use it
  const oldReturn = "return '<tr><td>'+p.id+'</td><td><strong style=\"cursor:pointer;color:#2563eb;text-decoration:underline\" data-action=\"show-quotes\" data-pid=\"'+p.id+'\" data-pname=\"'+escName+'\">'+p.projectName+'</strong></td><td>'+p.deadline+'</td><td><span class=\"status '+sc+'\">'+sts+'</span></td><td>'+qc+'</td><td>'+quoteBtn+'(p.status===\"open\"?'<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>')</td></tr>'";
  
  const closeBtnVar = "var closeBtn=p.status===\"open\"?'<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>';";
  const newReturn = "return '<tr><td>'+p.id+'</td><td><strong style=\"cursor:pointer;color:#2563eb;text-decoration:underline\" data-action=\"show-quotes\" data-pid=\"'+p.id+'\" data-pname=\"'+escName+'\">'+p.projectName+'</strong></td><td>'+p.deadline+'</td><td><span class=\"status '+sc+'\">'+sts+'</span></td><td>'+qc+'</td><td>'+quoteBtn+closeBtn+'</td></tr>'";
  
  if (content.includes(oldReturn)) {
    content = content.replace(oldReturn, closeBtnVar + newReturn);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed: replaced inline ternary with closeBtn variable");
  } else {
    console.log("oldReturn not found exactly, trying alternate...");
    // Find the line containing close-project in loadBuyerProjects
    let lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("close-project") && lines[i].includes("btn-danger") && lines[i].includes("quoteBtn")) {
        console.log("Broken line " + (i+1) + ": " + lines[i].substring(0, 100) + "...");
        // Fix this line
        const closeBtnVar2 = "var closeBtn=p.status===\"open\"?'<button class=\"btn btn-danger btn-sm\" data-action=\"close-project\" data-pid=\"'+p.id+'\">\u622a\u6b62</button>':'<span style=\"color:#999;font-size:12px\">\u5df2\u622a\u6b62</span>';";
        lines[i] = closeBtnVar2 + "return '<tr><td>'+p.id+'</td><td><strong style=\"cursor:pointer;color:#2563eb;text-decoration:underline\" data-action=\"show-quotes\" data-pid=\"'+p.id+'\" data-pname=\"'+escName+'\">'+p.projectName+'</strong></td><td>'+p.deadline+'</td><td><span class=\"status '+sc+'\">'+sts+'</span></td><td>'+qc+'</td><td>'+quoteBtn+closeBtn+'</td></tr>';";
        content = lines.join("\n");
        fs.writeFileSync(filePath, content, "utf8");
        console.log("Fixed line " + (i+1));
        break;
      }
    }
  }
} else {
  console.log("Broken pattern not found - may already be fixed?");
}

// Verify no more broken pattern
content = fs.readFileSync(filePath, "utf8");
if (content.includes("+quoteBtn+'(p.status")) {
  console.log("WARNING: broken pattern still present!");
} else if (content.includes("closeBtn")) {
  console.log("Verified: closeBtn variable approach in place");
}
