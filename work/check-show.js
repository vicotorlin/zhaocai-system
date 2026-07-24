var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");

// Get full showCreateProjectModal
var start = h.indexOf("function showCreateProjectModal");
var end = h.indexOf("async function uploadOneFile", start);
console.log("showCreateProjectModal:");
console.log(h.substring(start, end));

// Check if there's a JS error
var ss = h.indexOf("<script>") + 8;
var se = h.indexOf("</script>", ss);
var js = h.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
var cp = require("child_process");
var r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("\nJS SYNTAX ERROR:", r.stderr.substring(0, 500));
else console.log("\nJS syntax: OK!");
