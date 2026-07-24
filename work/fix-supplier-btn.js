const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html","utf8");
let BS = String.fromCharCode(92);
let SQ = String.fromCharCode(39);
let find = "openSupplierBid(" + BS + SQ + " + p.id + " + SQ + BS + SQ + ")";
let repl = "openSupplierBid(" + SQ + SQ + " + p.id + " + SQ + SQ + ")";
if (html.includes(find)) { html = html.split(find).join(repl); console.log("Fixed openSupplierBid"); }
else { console.log("not found"); }
fs.writeFileSync("outputs/dashboard.html",html,"utf8");
let ss=html.indexOf("<script>")+8,se=html.indexOf("</script>",ss);
let js=html.substring(ss,se);fs.writeFileSync("work/_tmp_check.js",js,"utf8");
let r=require("child_process").spawnSync("node",["--check","work/_tmp_check.js"],{encoding:"utf8"});
if(r.stderr) console.log("ERR:",r.stderr.substring(0,300)); else console.log("OK");
