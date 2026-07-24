const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// ===== 1. Add upload CSS before </style> =====
let uploadCSS = `
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

html = html.replace("</style>", uploadCSS + "\n</style>");

// ===== 2. Replace the modal HTML =====
let oldModalStart = html.indexOf('<!-- 创建项目弹窗 -->');
let oldModalEnd = html.indexOf('</div>\n</div>\n\n<script>', oldModalStart);
if (oldModalEnd < 0) oldModalEnd = html.indexOf('</div>\n</div>\n\n<script>', oldModalStart);

// Find exact boundaries
let modalDiv = html.indexOf('<div class="modal-overlay" id="createProjectModal">');
let modalEnd = html.indexOf('</div>\n</div>\n\n<script>', modalDiv);
if (modalEnd < 0) {
  // Try alternative
  let scriptIdx = html.indexOf('\n<script>');
  modalEnd = html.lastIndexOf('</div>', scriptIdx);
}

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

// Replace from modal start to script start
html = html.substring(0, modalDiv) + newModal + html.substring(scriptIdx + 8);
// Actually, I need to be more careful. Let me use the known markers.

// Hmm, let me do this differently - replace the modal and the start of script
let beforeModal = html.substring(0, modalDiv);
let afterModal = html.substring(html.indexOf('\n<script>', modalDiv) + 1);

html = beforeModal + newModal + afterModal;
