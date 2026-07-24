var fs=require("fs");var js=JSON.parse(fs.readFileSync("work/js_all.json","utf8"));js.forEach(function(l,i){if(l.includes("function "))console.log(i+":",l.substring(0,80));});
