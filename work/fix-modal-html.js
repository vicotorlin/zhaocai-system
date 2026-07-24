var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");
var d = String.fromCharCode(34);
var s = String.fromCharCode(39);

// Find the broken section and replace it
// The break starts at: <div class="form-group"><label>\n    <!-- 项目技术参数
// And the deadline label is duplicated
// Fix: remove the broken wrapper

// Find the malformed label
var brokenStart = h.indexOf('<div class="form-group"><label>\n    <!-- 项目技术参数');
if (brokenStart < 0) {
  console.log("Broken section not found!");
  process.exit(1);
}

// Find where the modal ends (after </div>\n</div>\n\n after the modal-actions)
var afterModal = h.indexOf('</div>\n</div>\n\n', brokenStart + 500);
if (afterModal < 0) {
  // Try alternative
  afterModal = h.indexOf('\n<script>', brokenStart);
}

// Build the correct section
var correctSection = [
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
'    <div class="form-group"><label>截止日期</label><input id="cpDeadline" type="date"></div>',
'    <div class="modal-actions">',
'      <button class="btn btn-outline" onclick="closeModal(' + s + 'createProjectModal' + s + ')">取消</button>',
'      <button class="btn btn-primary" onclick="createProject()">发布</button>',
'    </div>',
'  </div>',
'</div>',
].join("\n");

// Replace from brokenStart to the end of modal
// Find the original modal closing before the script
var scriptIdx = h.indexOf('\n<script>', brokenStart);
h = h.substring(0, brokenStart) + correctSection + "\n\n" + h.substring(scriptIdx);

fs.writeFileSync("outputs/dashboard.html", h, "utf8");
console.log("Fixed! Length:", h.length);

// Verify the fix
var start = h.indexOf("<!-- Create Project Modal -->");
var end = h.indexOf("<script>", start);
console.log("\nFixed modal:");
console.log(h.substring(start, end));

// Check JS syntax
var ss = h.indexOf("<script>") + 8;
var se = h.indexOf("</script>", ss);
var js = h.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
var cp = require("child_process");
var r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("\nJS ERR:", r.stderr.substring(0, 400));
else console.log("\nJS OK!");
