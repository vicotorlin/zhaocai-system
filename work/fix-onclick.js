const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// The issue: in the generated file, the onclick handlers have '' (two single quotes)
// instead of \' (escaped single quote). Fix them.

// Fix openSupplierBid
html = html.replace(
  /onclick="openSupplierBid\('' \+ p\.id \+ ''\)/g,
  'onclick="openSupplierBid(\x27' + ' + 'p.id' + ' + '\x27)"'
);

// Wait, this won't work in JS replacement. Let me do it differently.
// Find the exact pattern and fix it.

// Pattern: onclick="openSupplierBid('' + p.id + '')"
// Need: onclick="openSupplierBid(\' + p.id + \')"

// But I'm in a Node.js string right now, so I need to be careful.
// The source file has '' (two single quotes).
// I need to replace '' with \' in the onclick attribute.

// Let me just do a simple string replacement
let old1 = "onclick=\"openSupplierBid('' + p.id + '')\"";
let new1 = "onclick=\"openSupplierBid(\\' + p.id + \\')\"";
html = html.split(old1).join(new1);

let old2 = "onclick=\"closeProject('' + p.id + '')\"";
let new2 = "onclick=\"closeProject(\\' + p.id + \\')\"";
html = html.split(old2).join(new2);

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Fixed! Length:", html.length);

// Verify
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");

const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("STILL HAS ERROR:", r.stderr.substring(0, 300));
else console.log("Syntax: OK!");
