const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html","utf8");

let BS = String.fromCharCode(92);
let SQ = String.fromCharCode(39);

// Find the exact openSupplierBid button line
let idx = html.indexOf("openSupplierBid");
let chunk = html.substring(idx - 5, idx + 80);
console.log("Chunk:", JSON.stringify(chunk));

// Find the onclick attribute pattern
let onclickStart = idx - 5 + chunk.indexOf("onclick=");
console.log("onclickStart:", onclickStart);

// Find where the onclick ends (closing ")
let searchStart = onclickStart;
let onclickEndQuote = html.indexOf(SQ, html.indexOf(SQ, searchStart + 40) + 1);

// Actually, let me just find the button text
// '<button class="btn btn-primary btn-sm" onclick="openSupplierBid(\' + p.id + \')">报价</button>'
let pat = "'<button class=\"btn btn-primary btn-sm\" onclick=\"openSupplierBid(" + BS + SQ + " + p.id + " + SQ + BS + SQ + ")\">报价</button>'";
let rep = "'<button class=\"btn btn-primary btn-sm\" data-action=\"supplier-bid\" data-pid=\"" + SQ + " + p.id + " + SQ + "\">报价</button>'";

console.log("Pattern:", pat);
console.log("Replace:", rep);

if (html.includes(pat)) {
  html = html.replace(pat, rep);
  console.log("REPLACED!");
} else {
  console.log("Pattern NOT found");
  // Try finding with hex approach
  let findStr = "openSupplierBid(";
  let fidx = html.indexOf(findStr);
  console.log("Found 'openSupplierBid(' at:", fidx);
  console.log("Around:", JSON.stringify(html.substring(fidx - 10, fidx + 40)));
}

fs.writeFileSync("outputs/dashboard.html", html, "utf8");

let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
let r = require("child_process").spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("ERR:", r.stderr.substring(0, 400));
else console.log("JS OK!");
