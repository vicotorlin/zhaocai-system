const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// The issue: closeProject onclick has escaped quotes that prevent JS concatenation
// Fix: change onclick="closeProject(\' + p.id + \')" 
// to:   onclick="closeProject('' + p.id + '')"

// Find and fix the closeProject onclick pattern
let oldPat = 'onclick="closeProject(' + String.fromCharCode(92) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(92) + String.fromCharCode(39) + ')"';
let newPat = 'onclick="closeProject(' + String.fromCharCode(39) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(39) + String.fromCharCode(39) + ')"';

if (html.includes(oldPat)) {
  html = html.split(oldPat).join(newPat);
  console.log("Fixed closeProject onclick");
} else {
  console.log("Pattern not found, searching...");
  let idx = html.indexOf("closeProject(");
  while (idx >= 0) {
    console.log("At", idx, ":", html.substring(idx - 5, idx + 50));
    idx = html.indexOf("closeProject(", idx + 1);
  }
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
