const fs = require("fs");

// Read and fix as raw bytes to avoid all quoting issues
let buf = fs.readFileSync("outputs/dashboard.html");
let str = buf.toString("utf8");

// The problematic pattern in the file (raw bytes):
// onclick="openSupplierBid(\' + p.id + \')"
// We need: data-action="supplier-bid" data-pid="' + p.id + '"

// Find: onclick="openSupplierBid(
let findMarker = 'onclick="openSupplierBid(';
let idx = str.indexOf(findMarker);
if (idx >= 0) {
  console.log("Found at:", idx);
  // The full onclick attribute is: onclick="openSupplierBid(\' + p.id + \')"
  // Find the closing " after )
  let closeQuote = str.indexOf('")', idx + 50);
  let onclickEnd = str.indexOf('"', closeQuote + 2) + 1;
  // Actually find: ">报价</button>
  let btnEnd = str.indexOf('>报价</button>', idx);
  console.log("btnEnd:", btnEnd);
  
  // Replace the onclick part
  let before = str.substring(0, idx);
  let after = str.substring(btnEnd);
  
  let replacement = 'data-action="supplier-bid" data-pid="' + "'" + ' + p.id + ' + "'" + '"';
  str = before + replacement + after;
  console.log("Fixed openSupplierBid button");
} else {
  console.log("openSupplierBid button not found");
  
  // Maybe it was already fixed? Let's check
  idx = str.indexOf('data-action="supplier-bid"');
  console.log("data-action supplier-bid at:", idx);
}

// Also fix closeProject: onclick="closeProject('' + p.id + '')"
// This has '' which should also use data-action
let cpIdx = str.indexOf('onclick="closeProject(');
if (cpIdx >= 0) {
  console.log("closeProject onclick at:", cpIdx);
  let btnEnd = str.indexOf('>截止</button>', cpIdx);
  let before = str.substring(0, cpIdx);
  let after = str.substring(btnEnd);
  let replacement = 'data-action="close-project" data-pid="' + "'" + ' + p.id + ' + "'" + '"';
  str = before + replacement + after;
  console.log("Fixed closeProject button");
}

// Also need to add the event delegation handlers
// Check if they exist
if (!str.includes('if(a==="supplier-bid")')) {
  let delegIdx = str.indexOf('if(a==="alert"){alert(t.getAttribute("data-msg")||"");}');
  if (delegIdx >= 0) {
    let before = str.substring(0, delegIdx);
    let after = str.substring(delegIdx);
    let extra = 'if(a==="supplier-bid"){openSupplierBid(t.getAttribute("data-pid")||"");}if(a==="close-project"){closeProject(t.getAttribute("data-pid")||"");}';
    str = before + extra + after;
    console.log("Added delegation handlers");
  }
}

fs.writeFileSync("outputs/dashboard.html", str, "utf8");
console.log("Length:", str.length);

// Verify JS
let ss = str.indexOf("<script>") + 8;
let se = str.indexOf("</script>", ss);
let js = str.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
let r = require("child_process").spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERR:", r.stderr.substring(0, 500));
else console.log("JS OK!");
