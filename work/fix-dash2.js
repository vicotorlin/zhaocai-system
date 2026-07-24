const fs = require('fs');
const cp = require('child_process');

let html = fs.readFileSync('outputs/dashboard.html', 'utf8');
let count = 0;

// Fix openSupplierBid: onclick="openSupplierBid('' + p.id + '')" 
//   -> onclick="openSupplierBid(\' + p.id + \')"
let pat1 = "onclick=" + String.fromCharCode(34) + "openSupplierBid(" + String.fromCharCode(39) + String.fromCharCode(39) + " + p.id + " + String.fromCharCode(39) + String.fromCharCode(39) + ")" + String.fromCharCode(34);
let rep1 = "onclick=" + String.fromCharCode(34) + "openSupplierBid(" + String.fromCharCode(92) + String.fromCharCode(39) + " + p.id + " + String.fromCharCode(92) + String.fromCharCode(39) + ")" + String.fromCharCode(34);

if (html.includes(pat1)) {
  html = html.split(pat1).join(rep1);
  count++;
  console.log('Fixed openSupplierBid');
}

// Fix closeProject: onclick="closeProject('' + p.id + '')"
let pat2 = "onclick=" + String.fromCharCode(34) + "closeProject(" + String.fromCharCode(39) + String.fromCharCode(39) + " + p.id + " + String.fromCharCode(39) + String.fromCharCode(39) + ")" + String.fromCharCode(34);
let rep2 = "onclick=" + String.fromCharCode(34) + "closeProject(" + String.fromCharCode(92) + String.fromCharCode(39) + " + p.id + " + String.fromCharCode(92) + String.fromCharCode(39) + ")" + String.fromCharCode(34);

if (html.includes(pat2)) {
  html = html.split(pat2).join(rep2);
  count++;
  console.log('Fixed closeProject');
}

fs.writeFileSync('outputs/dashboard.html', html, 'utf8');
console.log('Fixed', count, 'occurrences. Length:', html.length);

// Verify syntax
let ss = html.indexOf('<script>') + 8;
let se = html.indexOf('</script>', ss);
let js = html.substring(ss, se);
fs.writeFileSync('work/_tmp_check.js', js, 'utf8');

let r = cp.spawnSync('node', ['--check', 'work/_tmp_check.js'], { encoding: 'utf8' });
if (r.stderr) {
  console.log('SYNTAX ERROR:', r.stderr.substring(0, 300));
} else {
  console.log('Syntax: OK!');
}
