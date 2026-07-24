const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
const SQ = "'";
const DQ = '"';

// Find the modal section and replace it
let modalStart = html.indexOf("<!-- Create Project Modal -->");
let modalEnd = html.indexOf("<script>", modalStart);

const newModal = [
'<!-- Create Project Modal -->',
'<div class="modal-overlay" id="createProjectModal">',
'  <div class="modal" style="width:680px">',
'    <h3>发布新项目</h3>',
'    <div class="form-group"><label>项目名称</label><input id="cpName" placeholder="请输入项目名称"></div>',
'    ',
'    <!-- 项目企划 + 附件上传 -->',
'    <div class="form-group"><label>项目企划</label></div>',
'    <div style="display:flex;gap:12px;margin-bottom:14px">',
'      <textarea id="cpPlan" placeholder="请描述项目企划内容、采购需求等" style="flex:1;min-height:80px"></textarea>',
'      <div class="upload-zone" style="width:180px;flex-shrink:0;padding:12px;text-align:center;cursor:pointer;border:2px dashed #ddd;border-radius:8px;background:#fafafa" onclick="document.getElementById('+SQ+'filePlan'+SQ+').click()">',
'        <div style="font-size:24px;margin-bottom:4px">&#x1F4C1;</div>',
'        <div style="font-size:11px;color:#888">企划附件</div>',
'        <div style="font-size:10px;color:#bbb">PDF/ZIP/CAD</div>',
'        <input type="file" id="filePlan" accept=".pdf,.zip,.rar,.7z,.dwg,.dxf" multiple onchange="handlePlanFiles(this.files)" style="display:none">',
'        <div class="file-list" id="planFileList" style="margin-top:4px;max-height:60px;overflow-y:auto"></div>',
'      </div>',
'    </div>',
'    ',
'    <!-- 渠道报量明细 + 附件上传 -->',
'    <div class="form-group"><label>渠道报量明细</label></div>',
'    <div style="display:flex;gap:12px;margin-bottom:14px">',
'      <textarea id="cpChannelVolume" placeholder="请填写各渠道的预估采购量明细" style="flex:1;min-height:80px"></textarea>',
'      <div class="upload-zone" style="width:180px;flex-shrink:0;padding:12px;text-align:center;cursor:pointer;border:2px dashed #ddd;border-radius:8px;background:#fafafa" onclick="document.getElementById('+SQ+'fileChannel'+SQ+').click()">',
'        <div style="font-size:24px;margin-bottom:4px">&#x1F4C1;</div>',
'        <div style="font-size:11px;color:#888">报量附件</div>',
'        <div style="font-size:10px;color:#bbb">PDF/ZIP/CAD</div>',
'        <input type="file" id="fileChannel" accept=".pdf,.zip,.rar,.7z,.dwg,.dxf" multiple onchange="handleChannelFiles(this.files)" style="display:none">',
'        <div class="file-list" id="channelFileList" style="margin-top:4px;max-height:60px;overflow-y:auto"></div>',
'      </div>',
'    </div>',
'    ',
'    <div class="form-group"><label>截止日期</label><input id="cpDeadline" type="date"></div>',
'    <div class="modal-actions">',
'      <button class="btn btn-outline" onclick="closeModal('+SQ+'createProjectModal'+SQ+')">取消</button>',
'      <button class="btn btn-primary" onclick="createProject()">发布</button>',
'    </div>',
'  </div>',
'</div>',
'',
].join("\n");

html = html.substring(0, modalStart) + newModal + html.substring(modalEnd);
console.log("Modal replaced. Length:", html.length);

// Now update the JS:
// 1. Change uploadedFiles to two separate arrays: planFiles, channelFiles
// 2. Update showCreateProjectModal
// 3. Update handleFiles -> handlePlanFiles + handleChannelFiles
// 4. Update createProject

// Replace uploadedFiles with planFiles + channelFiles
html = html.replace("var uploadedFiles = [];", "var planFiles = [];\nvar channelFiles = [];");

// Update showCreateProjectModal
let oldShow = `function showCreateProjectModal() {
  $("cpName").value = "";
  $("cpPlan").value = "";
  $("cpChannelVolume").value = "";
  $("cpDeadline").value = "";
  $("uploadFileList").innerHTML = "";
  uploadedFiles = [];
  $("createProjectModal").classList.add("show");
}`;

let newShow = `function showCreateProjectModal() {
  $("cpName").value = "";
  $("cpPlan").value = "";
  $("cpChannelVolume").value = "";
  $("cpDeadline").value = "";
  $("planFileList").innerHTML = "";
  $("channelFileList").innerHTML = "";
  planFiles = [];
  channelFiles = [];
  $("createProjectModal").classList.add("show");
}`;

html = html.replace(oldShow, newShow);

// Update handleFiles - split into two
let oldHandle = `async function handleFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var ext = file.name.split(".").pop().toLowerCase();
    var allowed = ["pdf","zip","rar","7z","dwg","dxf"];
    if (allowed.indexOf(ext) < 0) { toast("不支持格式: ." + ext, "error"); continue; }
    if (file.size > 52428800) { toast(file.name + " 超过50MB", "error"); continue; }
    var itemId = "f-" + Date.now() + "-" + i;
    $("uploadFileList").innerHTML += '${SQ}<div class="file-item" id="${SQ}+itemId+${SQ}"><span class="file-name">${SQ}+file.name+${SQ}</span><span class="file-size">${SQ}+formatSize(file.size)+${SQ}</span><span class="file-status uploading">上传中...</span></div>${SQ}';
    var fd = new FormData(); fd.append("file", file); fd.append("uploadedBy", USER.account);
    try {
      var resp = await fetch(API + "/api/upload", { method: "POST", body: fd });
      var result = await resp.json();
      var el = document.getElementById(itemId);
      if (result.success) { uploadedFiles.push(result.data); if (el) el.querySelector(".file-status").innerHTML = '${SQ}<span class="done">&#x2713;</span>${SQ}'; }
      else { if (el) el.querySelector(".file-status").innerHTML = '${SQ}<span class="error">失败</span>${SQ}'; toast("上传失败: " + result.message, "error"); }
    } catch (e) { var el = document.getElementById(itemId); if (el) el.querySelector(".file-status").innerHTML = '${SQ}<span class="error">网络错误</span>${SQ}'; }
  }
  $("fileInput").value = "";
}`;

// The handleFiles is complex. Let me find it and replace it.
let handleStart = html.indexOf("async function handleFiles");
let handleEnd = html.indexOf("function formatSize", handleStart);

// Let me just search for the pattern
let hfIdx = html.indexOf("async function handleFiles");
if (hfIdx >= 0) {
  console.log("handleFiles at:", hfIdx);
}

// Actually, let me just directly replace the function bodies
// First replace handleFiles with two functions

let oldHandleFn = 'async function handleFiles(files) {';
let newHandleFns = [
'async function uploadOneFile(file, listElId, filesArr) {',
'  var ext = file.name.split(".").pop().toLowerCase();',
'  var allowed = ["pdf","zip","rar","7z","dwg","dxf"];',
'  if (allowed.indexOf(ext) < 0) { toast("不支持格式: ." + ext, "error"); return; }',
'  if (file.size > 52428800) { toast(file.name + " 超过50MB", "error"); return; }',
'  var itemId = "f-" + Date.now() + "-" + Math.random().toString(36).substr(2,5);',
'  var el = document.getElementById(listElId);',
'  el.innerHTML += ' + SQ + '<div class="file-item" id="' + SQ + '+itemId+' + SQ + '"><span class="file-name">' + SQ + '+file.name+' + SQ + '</span><span class="file-size">' + SQ + '+formatSize(file.size)+' + SQ + '</span><span class="file-status uploading">上传中...</span></div>' + SQ + ';',
'  var fd = new FormData(); fd.append("file", file); fd.append("uploadedBy", USER.account);',
'  try {',
'    var resp = await fetch(API + "/api/upload", { method: "POST", body: fd });',
'    var result = await resp.json();',
'    var itemEl = document.getElementById(itemId);',
'    if (result.success) { filesArr.push(result.data); if (itemEl) itemEl.querySelector(".file-status").innerHTML = ' + SQ + '<span class="done">&#x2713;</span>' + SQ + '; }',
'    else { if (itemEl) itemEl.querySelector(".file-status").innerHTML = ' + SQ + '<span class="error">失败</span>' + SQ + '; toast("上传失败: " + result.message, "error"); }',
'  } catch (e) { var itemEl = document.getElementById(itemId); if (itemEl) itemEl.querySelector(".file-status").innerHTML = ' + SQ + '<span class="error">网络错误</span>' + SQ + '; }',
'}',
'',
'async function handlePlanFiles(files) {',
'  for (var i = 0; i < files.length; i++) { await uploadOneFile(files[i], "planFileList", planFiles); }',
'  document.getElementById("filePlan").value = "";',
'}',
'',
'async function handleChannelFiles(files) {',
'  for (var i = 0; i < files.length; i++) { await uploadOneFile(files[i], "channelFileList", channelFiles); }',
'  document.getElementById("fileChannel").value = "";',
'}',
].join("\n");

// Find and replace the entire handleFiles function
let hfStart = html.indexOf("async function handleFiles(files) {");
let hfEnd = html.indexOf("function formatSize", hfStart);
if (hfStart >= 0 && hfEnd >= 0) {
  html = html.substring(0, hfStart) + newHandleFns + "\n\n" + html.substring(hfEnd);
  console.log("Replaced handleFiles");
} else {
  console.log("handleFiles not found. hfStart:", hfStart, "hfEnd:", hfEnd);
}

// Update createProject to use planFiles + channelFiles
let oldCreateBody = "attachments: uploadedFiles.map(function(f) { return f.id; })";
let newCreateBody = "planFiles: planFiles.map(function(f) { return f.id; }), channelFiles: channelFiles.map(function(f) { return f.id; })";
html = html.replace(oldCreateBody, newCreateBody);
console.log("Updated createProject body");

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Final length:", html.length);

// Verify JS syntax
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
let r = require("child_process").spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERR:", r.stderr.substring(0, 500));
else console.log("JS OK!");
