const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// Extract the JS section
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);

// Replace all occurrences of onclick with escaped quotes
// The pattern in the file is: onclick="...(\' + p.id + \')"
// But in raw bytes, the backslash is a single byte.

// Let me find the exact line 121 and fix it directly
let lines = js.split("\n");
let line121 = lines[120];
console.log("Current line 121:");
console.log(line121);

// Fix: replace \' + p.id + \'  with  '' + p.id + ''
// In the source, \' is backslash (0x5C) + single quote (0x27)
let fixed = line121.replace(/\\' \+ p\.id \+ \\'/g, "'' + p.id + ''");

console.log("\nFixed line 121:");
console.log(fixed);

lines[120] = fixed;
js = lines.join("\n");

// Reconstruct HTML
html = html.substring(0, ss) + js + html.substring(se);

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Length:", html.length);

// Verify
let newSs = html.indexOf("<script>") + 8;
let newSe = html.indexOf("</script>", newSs);
let newJs = html.substring(newSs, newSe);
fs.writeFileSync("work/_tmp_check.js", newJs, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) {
  console.log("JS ERROR:", r.stderr.substring(0, 300));
} else {
  console.log("JS syntax: OK!");
}
