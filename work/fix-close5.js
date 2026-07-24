const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// The file has two problematic patterns for closeProject:
// 1. onclick="closeProject(\' + p.id + '\')"  (backslash-singlequote ... singlequote-backslash-singlequote)
// Need to replace the \' patterns (and the broken '\') with ''
// 
// The raw bytes show:
// POS 13: \ (0x5C), POS 14: ' (0x27)  → \'  → need to become ''
// POS 25: ' (0x27), POS 26: \ (0x5C), POS 27: ' (0x27) → '\' → need to become ''

// Strategy: replace the entire onclick attribute content for closeProject
// Find: onclick="closeProject(\' + p.id + '\')"
// Replace with: onclick="closeProject('' + p.id + '')"

let BS = String.fromCharCode(92);  // backslash
let SQ = String.fromCharCode(39);  // single quote

// Pattern 1: \'  (correctly oriented escape)
let pat1 = "closeProject(" + BS + SQ + " + p.id + " + SQ + BS + SQ + ")";
// Pattern 2: ''  (empty string concat)
let rep1 = "closeProject(" + SQ + SQ + " + p.id + " + SQ + SQ + ")";

console.log("Searching for:", JSON.stringify(pat1));

if (html.includes(pat1)) {
  html = html.split(pat1).join(rep1);
  console.log("✓ Replaced pat1");
} else {
  console.log("✗ pat1 not found");
  // Try without the function name
  let pat1b = BS + SQ + " + p.id + " + SQ + BS + SQ + ")";
  let rep1b = SQ + SQ + " + p.id + " + SQ + SQ + ")";
  if (html.includes(pat1b)) {
    html = html.split(pat1b).join(rep1b);
    console.log("✓ Replaced pat1b");
  } else {
    console.log("✗ pat1b not found either");
    // Show what's actually at the problematic position
    let idx = html.indexOf("closeProject(");
    console.log("Actual hex at closeProject position:");
    let chunk = html.substring(idx + 13, idx + 40);
    for (let i = 0; i < chunk.length; i++) {
      console.log("  ", i, chunk.charCodeAt(i).toString(16).padStart(2,'0'), chunk[i] === BS ? '\\' : chunk[i] === SQ ? "'" : chunk[i]);
    }
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
if (r.stderr) console.log("JS ERROR:", r.stderr.substring(0, 300));
else console.log("JS syntax: OK!");
