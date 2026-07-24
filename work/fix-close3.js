const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// The file has: onclick="closeProject(\' + p.id + \')"
// We need: onclick="closeProject('' + p.id + '')"
// \' (0x5C 0x27) should become '' (0x27 0x27)

// Find the exact text
let search = 'onclick="closeProject(' + String.fromCharCode(92) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(92) + String.fromCharCode(39) + ')"';
let replace = 'onclick="closeProject(' + String.fromCharCode(39) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(39) + String.fromCharCode(39) + ')"';

console.log("Searching for:", JSON.stringify(search));
console.log("Replace with:", JSON.stringify(replace));

if (html.includes(search)) {
  html = html.split(search).join(replace);
  console.log("✓ Fixed");
} else {
  // Try simpler search
  console.log("Not found, checking raw bytes...");

  // Get the raw bytes around position 18288
  let chunk = html.substring(18280, 18300);
  console.log("Raw chunk:", JSON.stringify(chunk));
  
  for (let i = 0; i < chunk.length; i++) {
    console.log(i, chunk.charCodeAt(i).toString(16), chunk[i]);
  }
  
  // Now do replacement based on exact match
  search = 'closeProject(' + String.fromCharCode(92) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(92) + String.fromCharCode(39) + ')';
  replace = 'closeProject(' + String.fromCharCode(39) + String.fromCharCode(39) + ' + p.id + ' + String.fromCharCode(39) + String.fromCharCode(39) + ')';
  
  if (html.includes(search)) {
    html = html.split(search).join(replace);
    console.log("✓ Fixed (method 2)");
  } else {
    console.log("Still not found!");
  }
}

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Length:", html.length);

// Verify
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) {
  console.log("JS ERROR:", r.stderr.substring(0, 300));
  // Show the problematic line
  let lines = js.split("\n");
  console.log("Line 121:", JSON.stringify(lines[120]));
} else {
  console.log("JS syntax: OK!");
}
