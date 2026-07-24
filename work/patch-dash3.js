const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// ===== 1. Add CSS =====
let cssAdd = `
.upload-zone{border:2px dashed #ddd;border-radius:8px;padding:24px;text-align:center;cursor:pointer;transition:.2s;background:#fafafa;margin-bottom:12px}
.upload-zone:hover,.upload-zone.drag-over{border-color:#2c5364;background:#eef4f7}
.upload-zone .upload-icon{font-size:32px;margin-bottom:8px}
.upload-zone .upload-text{font-size:13px;color:#888}
.upload-zone .upload-hint{font-size:11px;color:#bbb;margin-top:4px}
.upload-zone input[type=file]{display:none}
.file-list{margin-top:8px}
.file-item{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f0f2f5;border-radius:6px;margin-bottom:4px;font-size:13px}
.file-item .file-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:10px}
.file-item .file-size{color:#999;font-size:11px;margin-right:10px}
.file-item .file-remove{color:#e74c3c;cursor:pointer;font-size:11px}
.file-item .file-status{font-size:11px;margin-right:8px}
.file-item .file-status.uploading{color:#e67e22}
.file-item .file-status.done{color:#27ae60}
.file-item .file-status.error{color:#e74c3c}
.form-group textarea{width:100%;border:1.5px solid #e0e0e0;border-radius:6px;padding:10px 12px;font-size:14px;outline:none;resize:vertical;min-height:70px;font-family:inherit}
.form-group textarea:focus{border-color:#2c5364}`;

html = html.replace("</style>", cssAdd + "\n</style>");
console.log("✓ Added CSS");

// ===== 2. Replace modal HTML =====
let oldModal = html.match(/<div class="modal-overlay" id="createProjectModal">[\s\S]*?<\/div>\s*<\/div>\s*\n\s*<script>/);
if (oldModal) {
  let newModal = `<!-- 创建项目弹窗 -->
<div class="modal-overlay" id="createProjectModal">
  <div class="modal" style="width:560px">
    <h3>发布新项目</h3>
    <div class="form-group"><label>项目名称</label><input id="cpName" placeholder="请输入项目名称"></div>
    <div class="form-group"><label>项目企划</label><textarea id="cpPlan" placeholder="请描述项目企划内容、采购需求等"></textarea></div>
    <div class="form-group"><label>渠道报量明细</label><textarea id="cpChannelVolume" placeholder="请填写各渠道的预估采购量明细"></textarea></div>
    <div class="form-group"><label>截止日期</label><input id="cpDeadline" type="date"></div>
    <div class="form-group">
      <label>投标附件（PDF/ZIP/CAD，最大50MB）</label>
      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
        <div class="upload-icon">&#x1F4C1;</div>
        <div class="upload-text">点击或拖拽文件到此处上传</div>
        <div class="upload-hint">支持 PDF、ZIP、RAR、7Z、DWG、DXF 格式，最大 50MB</div>
        <input type="file" id="fileInput" accept=".pdf,.zip,.rar,.7z,.dwg,.dxf" multiple onchange="handleFiles(this.files)">
      </div>
      <div class="file-list" id="uploadFileList"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal('createProjectModal')">取消</button>
      <button class="btn btn-primary" id="btnCreateProject" onclick="createProject()">发布</button>
    </div>
  </div>
</div>

<script>`;

  html = html.replace(oldModal[0], newModal);
  console.log("✓ Replaced modal");
} else {
  console.log("✗ Could not find modal");
}

// ===== 3. Replace showCreateProjectModal =====
let oldShow = `function showCreateProjectModal() {
  $("cpName").value = "";
  $("cpBuyer").value = "";
  $("cpBudget").value = "";
  $("cpDeadline").value = "";
  $("createProjectModal").classList.add("show");
}`;

let newShow = `function showCreateProjectModal() {
  $("cpName").value = "";
  $("cpPlan").value = "";
  $("cpChannelVolume").value = "";
  $("cpDeadline").value = "";
  $("uploadFileList").innerHTML = "";
  uploadedFiles = [];
  $("createProjectModal").classList.add("show");
}`;

if (html.includes(oldShow)) {
  html = html.replace(oldShow, newShow);
  console.log("✓ Replaced showCreateProjectModal");
} else {
  console.log("✗ Old showCreateProjectModal not found");
}

// ===== 4. Replace createProject function =====
let oldCreate = `async function createProject() {
  var name = $("cpName").value.trim();
  var buyer = $("cpBuyer").value.trim();
  if (!name) return toast("请输入项目名称", "error");
  try {
    var r = await api("/api/buyer/projects", {
      method: "POST",
      body: {
        account: USER.account,
        projectName: name,
        buyer: buyer || USER.account,
        budget: Number($("cpBudget").value) || 0,
        deadline: $("cpDeadline").value
      }
    });
    if (r.success) {
      toast("项目发布成功", "success");
      closeModal("createProjectModal");
      loadBuyerProjects();
      loadBuyerProjectSelect();
    } else {
      toast(r.message, "error");
    }
  } catch (e) {
    toast("网络错误", "error");
  }
}`;

let newCreate = `var uploadedFiles = [];

async function handleFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var ext = file.name.split(".").pop().toLowerCase();
    var allowed = ["pdf","zip","rar","7z","dwg","dxf"];
    if (allowed.indexOf(ext) < 0) {
      toast("不支持的文件格式: ." + ext, "error");
      continue;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast("文件 " + file.name + " 超过50MB限制", "error");
      continue;
    }

    var itemId = "file-" + Date.now() + "-" + i;
    var listHtml = '<div class="file-item" id="' + itemId + '"><span class="file-name">' + file.name + '</span><span class="file-size">' + formatSize(file.size) + '</span><span class="file-status uploading">上传中...</span></div>';
    $("uploadFileList").innerHTML += listHtml;

    var formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", USER.account);

    try {
      var r = await fetch(API + "/api/upload", { method: "POST", body: formData });
      var result = await r.json();
      if (result.success) {
        uploadedFiles.push(result.data);
        var el = document.getElementById(itemId);
        if (el) el.querySelector(".file-status").innerHTML = '<span class="done">✓</span>';
      } else {
        var el = document.getElementById(itemId);
        if (el) el.querySelector(".file-status").innerHTML = '<span class="error">失败</span>';
        toast("上传失败: " + result.message, "error");
      }
    } catch (e) {
      var el = document.getElementById(itemId);
      if (el) el.querySelector(".file-status").innerHTML = '<span class="error">网络错误</span>';
    }
  }
  $("fileInput").value = "";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

async function createProject() {
  var name = $("cpName").value.trim();
  if (!name) return toast("请输入项目名称", "error");
  try {
    var r = await api("/api/buyer/projects", {
      method: "POST",
      body: {
        account: USER.account,
        projectName: name,
        plan: $("cpPlan").value.trim(),
        channelVolume: $("cpChannelVolume").value.trim(),
        deadline: $("cpDeadline").value,
        attachments: uploadedFiles.map(function(f) { return f.id; })
      }
    });
    if (r.success) {
      toast("项目发布成功", "success");
      closeModal("createProjectModal");
      loadBuyerProjects();
      loadBuyerProjectSelect();
    } else {
      toast(r.message, "error");
    }
  } catch (e) {
    toast("网络错误", "error");
  }
}`;

if (html.includes(oldCreate)) {
  html = html.replace(oldCreate, newCreate);
  console.log("✓ Replaced createProject");
} else {
  console.log("✗ Old createProject not found, searching...");
  let idx = html.indexOf("async function createProject");
  if (idx >= 0) {
    console.log("  Found at:", idx);
    let snippet = html.substring(idx, idx + 300);
    console.log("  Snippet:", snippet.substring(0, 150));
  }
}

// ===== 5. Update table - remove budget column, show plan indicator =====
// Update loadBuyerProjects table header and rows
let oldTableHeader = '<th>编号</th><th>项目名称</th><th>预算</th><th>截止</th><th>状态</th><th>创建时间</th><th>操作</th>';
let newTableHeader = '<th>编号</th><th>项目名称</th><th>截止</th><th>状态</th><th>创建时间</th><th>操作</th>';

// Update table row
// Old pattern: return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>&yen;'+(p.budget||...
// New pattern: remove budget column
let oldRowPattern = "return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>&yen;' + (p.budget || \"--\") + '</td><td>' + p.deadline + '</td><td><span class=\"status ' + sc + '\">' + st + '</span></td><td>' + new Date(p.createdAt).toLocaleDateString() + '</td><td><button class=\"btn btn-danger btn-sm\" onclick=\"closeProject(\\'' + p.id + '\\')\">截止</button></td></tr>'";
let newRowPattern = "return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>' + p.deadline + '</td><td><span class=\"status ' + sc + '\">' + st + '</span></td><td>' + new Date(p.createdAt).toLocaleDateString() + '</td><td><button class=\"btn btn-danger btn-sm\" onclick=\"closeProject(\\'' + p.id + '\\')\">截止</button></td></tr>'";

if (html.includes(oldTableHeader)) {
  html = html.replace(oldTableHeader, newTableHeader);
  console.log("✓ Updated table header");
}
if (html.includes(oldRowPattern)) {
  html = html.replace(oldRowPattern, newRowPattern);
  console.log("✓ Updated table row");
} else {
  console.log("✗ Old row pattern not found");
  let idx = html.indexOf("p.budget");
  if (idx >= 0) console.log("  Found budget at:", idx, html.substring(idx-10, idx+30));
}

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Dashboard patched! Length:", html.length);

// Verify JS syntax
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERROR:", r.stderr.substring(0, 300));
else console.log("JS syntax: OK!");
