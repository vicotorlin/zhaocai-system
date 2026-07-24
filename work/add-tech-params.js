var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");
var d = String.fromCharCode(34);
var s = String.fromCharCode(39);

// Find the modal section - between "Create Project Modal" and "<script>"
var modalStart = h.indexOf("<!-- Create Project Modal -->");
var scriptStart = h.indexOf("<script>", modalStart);

// Find where to insert the new field - after 渠道报量明细 section, before 截止日期
// The 渠道报量明细 section ends with: </div>\n</div>\n\n<div class="form-group"><label>截止日期
var insertAfter = '截止日期</label>';
var insertIdx = h.indexOf(insertAfter, modalStart);

var newField = [
'',
'    <!-- 项目技术参数 + 附件上传 -->',
'    <div class="form-group"><label>项目技术参数</label></div>',
'    <div style="display:flex;gap:12px;margin-bottom:14px">',
'      <textarea id="cpTechParams" placeholder="请填写项目技术参数要求、规格型号等" style="flex:1;min-height:80px"></textarea>',
'      <div class="mini-upload" style="width:170px;flex-shrink:0;padding:10px" onclick="document.getElementById(' + s + 'fileTech' + s + ').click()">',
'        <div style="font-size:22px;margin-bottom:2px">&#x1F4C1;</div>',
'        <div style="font-size:11px;color:#888">技术附件</div>',
'        <div style="font-size:10px;color:#bbb">PDF/ZIP/CAD</div>',
'        <input type="file" id="fileTech" accept=".pdf,.zip,.rar,.7z,.dwg,.dxf" multiple onchange="handleTechFiles(this.files)" style="display:none">',
'        <div id="techFileList" style="margin-top:4px;max-height:60px;overflow-y:auto"></div>',
'      </div>',
'    </div>',
'',
'    <div class="form-group"><label>截止日期</label>',
].join("\n");

if (insertIdx > 0) {
  // Remove the old "截止日期" line and insert new content before it
  var beforeDeadline = h.substring(0, insertIdx);
  var afterDeadline = h.substring(insertIdx + insertAfter.length);
  // But we already included "截止日期" in newField, so just replace
  h = beforeDeadline + newField + afterDeadline.substring(afterDeadline.indexOf('>') + 1);
  console.log("✓ Added tech params field to modal");
} else {
  console.log("✗ Could not find deadline label");
}

// Now update the JS:
// 1. Add techFiles array
// 2. Update showCreateProjectModal to clear tech fields
// 3. Add handleTechFiles function
// 4. Update createProject to include techParams

// Find and update declarations
h = h.replace(
  "var planFiles=[];\nvar channelFiles=[];",
  "var planFiles=[];\nvar channelFiles=[];\nvar techFiles=[];"
);

// Update showCreateProjectModal
h = h.replace(
  'document.getElementById("channelFileList").innerHTML="";',
  'document.getElementById("channelFileList").innerHTML="";\ndocument.getElementById("techFileList").innerHTML="";'
);
h = h.replace(
  "planFiles=[];channelFiles=[];",
  "planFiles=[];channelFiles=[];techFiles=[];"
);

// Add handleTechFiles after handleChannelFiles
var handleChannelEnd = h.indexOf("async function handleChannelFiles");
var handleChannelEnd2 = h.indexOf("function formatSize", handleChannelEnd);
var techHandler = [
'async function handleTechFiles(files){for(var i=0;i<files.length;i++){await uploadOneFile(files[i],document.getElementById("techFileList"),techFiles);}document.getElementById("fileTech").value="";}',
'',
].join("\n");

h = h.substring(0, handleChannelEnd2) + techHandler + h.substring(handleChannelEnd2);
console.log("✓ Added handleTechFiles");

// Update createProject to include techParams
h = h.replace(
  'channelVolume:document.getElementById("cpChannelVolume").value.trim()',
  'channelVolume:document.getElementById("cpChannelVolume").value.trim(),techParams:document.getElementById("cpTechParams").value.trim()'
);

h = h.replace(
  "if(channelFiles.length>0)body.channelFiles=channelFiles.map(function(f){return f.id;});",
  "if(channelFiles.length>0)body.channelFiles=channelFiles.map(function(f){return f.id;});if(techFiles.length>0)body.techFiles=techFiles.map(function(f){return f.id;});"
);

console.log("✓ Updated createProject");

fs.writeFileSync("outputs/dashboard.html", h, "utf8");

// Verify JS syntax
var ss = h.indexOf("<script>") + 8;
var se = h.indexOf("</script>", ss);
var js = h.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
var cp = require("child_process");
var r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERR:", r.stderr.substring(0, 400));
else console.log("JS OK! Length:", h.length);

// Check has tech stuff
console.log("Has cpTechParams:", h.includes('id="cpTechParams"'));
console.log("Has techFiles:", h.includes("techFiles"));
console.log("Has handleTechFiles:", h.includes("handleTechFiles"));
