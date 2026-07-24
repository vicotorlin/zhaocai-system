const fs=require('fs');let h=fs.readFileSync('outputs/dashboard.html','utf8');let idx=h.indexOf('id=\x22cpPlan\x22');console.log(h.substring(Math.max(0,idx-300),idx+700));
