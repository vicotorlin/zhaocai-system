const fs = require("fs"), cp = require("child_process");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
try {
  let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
  if (r.stderr) console.log("SYNTAX ERROR:", r.stderr.substring(0, 500));
  else console.log("Syntax: OK! Output:", r.stdout);
} catch(e) { console.log("Exception:", e.message); }
