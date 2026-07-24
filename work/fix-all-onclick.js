const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

let BS = String.fromCharCode(92);  // backslash
let SQ = String.fromCharCode(39);  // single quote

// Fix ALL occurrences of the pattern: onclick="xxx(\' + p.id + \')"
// These escaped quotes keep p.id inside the string instead of concatenating it
// Replace: onclick="xxx(\' + p.id + \')" with onclick="xxx('' + p.id + '')"

// Pattern to find: (\' + p.id + \')
// Replace with: ('' + p.id + '')

let find1 = "(" + BS + SQ + " + p.id + " + SQ + BS + SQ + ")";
let repl1 = "(" + SQ + SQ + " + p.id + " + SQ + SQ + ")";

console.log("Find:", JSON.stringify(find1));
console.log("Replace:", JSON.stringify(repl1));

let count = 0;
while (html.includes(find1)) {
  html = html.replace(find1, repl1);
  count++;
}

console.log("Replaced", count, "occurrences");

fs.writeFileSync("outputs/dashboard.html", html, "utf8");

// Verify
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) {
  console.log("JS ERROR:", r.stderr.substring(0, 400));
  // Show lines around the error
  let lines = js.split("\n");
  for (let i = 115; i < 125; i++) {
    console.log("Line", i+1, ":", lines[i] ? lines[i].substring(0, 120) : "");
  }
} else {
  console.log("JS syntax: OK!");
}
