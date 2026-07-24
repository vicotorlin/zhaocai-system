/**
 * 招采管理系统 - 文件上传模块 (Supabase Storage + 本地回退)
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// ===================== 配置 =====================

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const UPLOAD_DIR = path.join(__dirname, "..", "outputs", "uploads");
const BUCKET_NAME = "attachments";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".pdf", ".zip", ".rar", ".7z", ".dwg", ".dxf", ".igs", ".stp", ".step"];
const ALLOWED_MIMES = [
  "application/pdf",
  "application/zip", "application/x-zip-compressed", "application/x-rar-compressed", "application/x-7z-compressed",
  "application/octet-stream",
  "application/acad", "image/vnd.dwg", "image/vnd.dxf",
  "application/iges", "application/step", "application/x-step"
];

// ===================== Supabase 客户端 =====================

let supabase = null;
let supabaseAvailable = false;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      supabaseAvailable = true;
      console.log("[Upload] Supabase Storage 已配置");
      return true;
    } catch (e) {
      console.warn("[Upload] Supabase 初始化失败:", e.message);
    }
  }
  console.log("[Upload] 使用本地文件存储模式");
  return false;
}

// ===================== 本地存储（回退方案） =====================

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// 本地 Attachment 存储（内存，重启丢失）
const localAttachmentStore = [];

// ===================== 文件验证 =====================

function validateFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, message: "不支持的文件格式，仅允许: " + ALLOWED_EXTENSIONS.join(", ") };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: "文件大小超过限制 (最大 50MB)" };
  }
  return { valid: true, ext };
}

// ===================== 文件上传 =====================

/**
 * 上传文件到 Supabase Storage 或本地
 * @param {Object} file - multer file object { originalname, buffer, size, mimetype }
 * @param {Object} metadata - { projectId, uploadedBy, uploadIp }
 * @returns {Object} { success, data: { id, fileName, signedUrl, ... } }
 */
async function uploadFile(file, metadata = {}) {
  // 使用客户端传入的原始文件名（已在路由层修复编码）
  if (metadata.originalFileName) {
    file.originalname = metadata.originalFileName;
  }
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const ext = validation.ext;
  const uniqueName = crypto.randomUUID() + ext;
  const storagePath = (metadata.projectId || "general") + "/" + uniqueName;

  let fileUrl = null;
  let signedUrl = null;
  let signedUrlExpires = null;

  if (supabaseAvailable) {
    // ===== Supabase Storage 上传 =====
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || "application/octet-stream",
          upsert: true,
        });

      if (error) throw error;

      // 生成带签名的临时 URL（7天有效）
      const { data: signedData, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 7 * 24 * 60 * 60); // 7天

      if (!signedError && signedData) {
        signedUrl = signedData.signedUrl;
        signedUrlExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      fileUrl = signedUrl || storagePath;

      // 写入 Supabase Attachment 表
      const attachmentRecord = {
        project_id: metadata.projectId || null,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype || "application/octet-stream",
        file_ext: ext,
        bucket_name: BUCKET_NAME,
        storage_path: storagePath,
        signed_url: signedUrl,
        signed_url_expires_at: signedUrlExpires,
        uploaded_by: metadata.uploadedBy || "anonymous",
        upload_ip: metadata.uploadIp || "",
        status: "active",
      };

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const { data: dbData, error: dbError } = await supabase
          .from("attachments")
          .insert(attachmentRecord)
          .select()
          .single();

        if (dbError) {
          console.warn("[Upload] DB 写入失败:", dbError.message);
          // 即使 DB 写入失败，文件已上传到 Storage，回退到本地记录
          attachmentRecord.id = crypto.randomUUID();
          localAttachmentStore.push(attachmentRecord);
        }

        return {
          success: true,
          data: dbData || attachmentRecord,
          message: "文件上传成功 (Supabase)",
        };
      }
    } catch (e) {
      console.error("[Upload] Supabase 上传失败:", e.message);
      // 回退到本地存储
    }
  }

  // ===== 本地存储（回退） =====
  ensureUploadDir();
  const localPath = path.join(UPLOAD_DIR, uniqueName);
  fs.writeFileSync(localPath, file.buffer);

  fileUrl = "/uploads/" + uniqueName;

  const attachmentRecord = {
    id: crypto.randomUUID(),
    project_id: metadata.projectId || null,
    file_name: file.originalname,
    file_size: file.size,
    file_type: file.mimetype || "application/octet-stream",
    file_ext: ext,
    bucket_name: "local",
    storage_path: uniqueName,
    signed_url: fileUrl,
    signed_url_expires_at: null,
    uploaded_by: metadata.uploadedBy || "anonymous",
    upload_ip: metadata.uploadIp || "",
    status: "active",
    created_at: new Date().toISOString(),
  };

  localAttachmentStore.push(attachmentRecord);

  return {
    success: true,
    data: attachmentRecord,
    message: "文件上传成功 (本地存储)",
  };
}

/**
 * 获取项目的所有附件
 */
function getAttachments(projectId) {
  return localAttachmentStore.filter(a => a.project_id === projectId && a.status === "active");
}

/**
 * 删除附件
 */
function deleteAttachment(attachmentId) {
  const idx = localAttachmentStore.findIndex(a => a.id === attachmentId);
  if (idx >= 0) {
    localAttachmentStore[idx].status = "deleted";
    return { success: true };
  }
  return { success: false, message: "附件不存在" };
}

// ===================== multer 配置 =====================

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件格式: " + ext + "，仅允许 " + ALLOWED_EXTENSIONS.join(", ")));
    }
  },
});


/**
 * 添加附件记录到内存存储
 */
function addAttachment(record) {
  const attachment = {
    id: record.id || crypto.randomUUID(),
    project_id: record.projectId || null,
    file_name: record.fileName || "unknown",
    file_size: record.fileSize || 0,
    file_type: record.fileType || "application/octet-stream",
    file_ext: record.fileExt || "",
    bucket_name: "local",
    storage_path: record.fileUrl || "",
    signed_url: record.fileUrl || "",
    signed_url_expires_at: null,
    uploaded_by: record.uploadedBy || "anonymous",
    upload_ip: "",
    status: "active",
    created_at: new Date().toISOString(),
  };
  localAttachmentStore.push(attachment);
  console.log("[Attachment] 已记录: " + record.fileName);
  return attachment;
}

module.exports = {
  _localStore: localAttachmentStore,
  initSupabase,
  uploadFile,
  getAttachments,
  deleteAttachment,
  addAttachment,
  upload,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
