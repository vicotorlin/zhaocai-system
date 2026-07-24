var fs = require("fs");
var base = JSON.parse(fs.readFileSync("work/js_lines.json", "utf8"));
var sidebar = JSON.parse(fs.readFileSync("work/js_sidebar.json", "utf8"));
var supplier = JSON.parse(fs.readFileSync("work/js_supplier.json", "utf8"));
var missing = JSON.parse(fs.readFileSync("work/js_missing.json", "utf8"));
var rest = JSON.parse(fs.readFileSync("work/js_all.json", "utf8"));

// Find the "rest" part (from loadBuyerProjects onwards)
// js_all.json = base + sidebar + supplier + rest
var totalBeforeRest = base.length + sidebar.length + supplier.length;
var restOnly = rest.slice(totalBeforeRest);

// Combine: base + sidebar + missing + supplier + restOnly
var all = base.concat(missing, sidebar, supplier, restOnly);

var html = fs.readFileSync("outputs/dashboard.html", "utf8");
var bodyEnd = html.indexOf("<script>");
var cleanHtml = html.substring(0, bodyEnd);
cleanHtml += "\n<script>\n" + all.join("\n") + "\n</script>\n</body>\n</html>";
fs.writeFileSync("outputs/dashboard.html", cleanHtml, "utf8");
console.log("Dashboard:", cleanHtml.length, "bytes");

// Verify syntax
var ss = cleanHtml.indexOf("<script>") + 8;
var se = cleanHtml.indexOf("</script>", ss);
var js = cleanHtml.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
var cp = require("child_process");
var r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERR:", r.stderr.substring(0, 400));
else console.log("JS syntax: OK!");

// Check for switchView
console.log("Has switchView:", js.includes("function switchView"));
