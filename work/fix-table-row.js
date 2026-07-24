const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let idx = html.indexOf("p.budget");
console.log("Budget context:", html.substring(idx - 20, idx + 80));

// Fix the budget column in the table row
// Find the exact text to replace
let start = html.indexOf("return '<tr><td>' + p.id + '</td><td><strong>'");
let end = html.indexOf("截止</button></td></tr>'", start);
if (start >= 0 && end >= 0) {
  let oldRow = html.substring(start, end + "截止</button></td></tr>'".length);
  console.log("\nOld row (first 200):", oldRow.substring(0, 200));
  
  let newRow = "return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>' + p.deadline + '</td><td><span class=\"status ' + sc + '\">' + st + '</span></td><td>' + new Date(p.createdAt).toLocaleDateString() + '</td><td><button class=\"btn btn-danger btn-sm\" onclick=\"closeProject(\\' + p.id + '\\')\">截止</button></td></tr>'";
  
  html = html.substring(0, start) + newRow + html.substring(end + "截止</button></td></tr>'".length);
  console.log("✓ Updated table row");
} else {
  console.log("✗ Could not find row boundaries");
}

fs.writeFileSync("outputs/dashboard.html", html, "utf8");

// Verify JS
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERROR:", r.stderr.substring(0, 300));
else console.log("JS syntax: OK!");
