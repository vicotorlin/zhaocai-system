const fs=require('fs');let h=fs.readFileSync('outputs/dashboard.html','utf8');let idx=h.indexOf('uploadFileList');console.log(h.substring(idx-30,idx+200));
