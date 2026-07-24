/**
 * 招采管理系统 - Supabase 客户端模块
 * 提供统一的 Supabase 连接和数据库操作方法
 */

const { createClient } = require("@supabase/supabase-js");

// ===================== 配置 =====================

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ===================== 客户端实例 =====================

let supabase = null;
let supabaseAdmin = null;
let supabaseAvailable = false;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      // 匿名客户端（遵循 RLS）
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      // 管理员客户端（绕过 RLS，仅服务端使用）
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      supabaseAvailable = true;
      console.log("[Supabase] 已连接 PostgreSQL 数据库");
      return true;
    } catch (e) {
      console.warn("[Supabase] 初始化失败:", e.message);
    }
  }
  console.log("[Supabase] 未配置，使用内存存储模式");
  return false;
}

function isAvailable() {
  return supabaseAvailable;
}

function getClient() {
  return supabase;
}

function getAdminClient() {
  return supabaseAdmin;
}


// ===================== 内存存储回退 =====================
const memoryDb = {
  users: [],
  verificationCodes: [],
  projects: [],
  bids: [],
  attachments: [],
  projectIdCounter: 1,
  bidIdCounter: 1,
  attachmentIdCounter: 1,
};

function genUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ===================== 用户操作 =====================

async function createUser(account, role, password, status, name) {
  const userStatus = status || "active";
  if (!supabaseAvailable) {
    const existing = memoryDb.users.find(u => u.account === account);
    if (existing) return null;
    const user = { id: genUUID(), account, role, password, status: userStatus, name: name || "", created_at: new Date().toISOString() };
    memoryDb.users.push(user);
    console.log("[Memory] createUser:", account, role, userStatus);
    return user;
  }
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert({ account, role, password, name: name || "", created_at: new Date().toISOString() })
    .select()
    .single();
  if (error) { console.error("[Supabase] createUser 失败:", error.message); return null; }
  return data;
}

async function getUser(account) {
  if (!supabaseAvailable) {
    const user = memoryDb.users.find(u => u.account === account);
    if (!user) return null;
    return { account: user.account, role: user.role, password: user.password, status: user.status || "active", name: user.name || user.account };
  }
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("account", account)
    .single();
  if (error) return null;
  return data;
}

async function getAllUsers() {
  if (!supabaseAvailable) return memoryDb.users.slice().reverse();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// ===================== 验证码操作 =====================

async function saveVerificationCode(account, code, expiresAt) {
  if (!supabaseAvailable) {
    memoryDb.verificationCodes = memoryDb.verificationCodes.filter(v => v.account !== account);
    const record = { account, code, expires_at: new Date(expiresAt).toISOString(), verified: false, last_sent_at: new Date().toISOString() };
    memoryDb.verificationCodes.push(record);
    return record;
  }
  const { data, error } = await supabaseAdmin
    .from("verification_codes")
    .upsert({
      account,
      code,
      expires_at: new Date(expiresAt).toISOString(),
      verified: false,
      last_sent_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) { console.error("[Supabase] saveCode 失败:", error.message); return null; }
  return data;
}

async function getVerificationCode(account) {
  if (!supabaseAvailable) return memoryDb.verificationCodes.find(v => v.account === account) || null;
  const { data, error } = await supabaseAdmin
    .from("verification_codes")
    .select("*")
    .eq("account", account)
    .single();
  if (error) return null;
  return data;
}

async function markCodeVerified(account) {
  if (!supabaseAvailable) {
    const record = memoryDb.verificationCodes.find(v => v.account === account);
    if (record) record.verified = true;
    return record || null;
  }
  const { data, error } = await supabaseAdmin
    .from("verification_codes")
    .update({ verified: true })
    .eq("account", account)
    .select()
    .single();
  if (error) return null;
  return data;
}

async function deleteExpiredCodes() {
  if (!supabaseAvailable) return;
  await supabaseAdmin
    .from("verification_codes")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

// ===================== 项目操作 =====================

async function createProject(project) {
  if (!supabaseAvailable) {
    project.created_at = project.created_at || new Date().toISOString();
    memoryDb.projects.push(project);
    console.log("[Memory] createProject:", project.id);
    return project;
  }
  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert(project)
    .select()
    .single();
  if (error) { console.error("[Supabase] createProject 失败:", error.message); return null; }
  return data;
}

async function getAllProjects() {
  if (!supabaseAvailable) return memoryDb.projects.slice().reverse();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

async function getProject(id) {
  if (!supabaseAvailable) return memoryDb.projects.find(p => p.id === id) || null;
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

async function updateProjectStatus(id, status) {
  if (!supabaseAvailable) {
    const project = memoryDb.projects.find(p => p.id === id);
    if (project) { project.status = status; project.updated_at = new Date().toISOString(); }
    return project || null;
  }
  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return data;
}

// ===================== 报价（Bid）操作 =====================

async function createBid(bid) {
  if (!supabaseAvailable) {
    if (!bid.id) {
      const lastBid = memoryDb.bids.length > 0 ? memoryDb.bids[memoryDb.bids.length - 1] : null;
      const lastNum = lastBid && lastBid.id ? parseInt(lastBid.id.replace("BID-", "")) || 0 : 0;
      bid.id = "BID-" + String(lastNum + 1).padStart(3, "0");
    }
    bid.created_at = bid.created_at || new Date().toISOString();
    memoryDb.bids.push(bid);
    console.log("[Memory] createBid:", bid.id);
    return bid;
  }
  const { data, error } = await supabaseAdmin
    .from("bids")
    .insert(bid)
    .select()
    .single();
  if (error) { console.error("[Supabase] createBid 失败:", error.message); return null; }
  return data;
}

async function updateBid(id, updates) {
  if (!supabaseAvailable) {
    const idx = memoryDb.bids.findIndex(b => b.id === id);
    if (idx >= 0) {
      updates.updated_at = new Date().toISOString();
      memoryDb.bids[idx] = { ...memoryDb.bids[idx], ...updates };
      return memoryDb.bids[idx];
    }
    return null;
  }
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("bids")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[Supabase] updateBid 失败:", error.message); return null; }
  return data;
}

async function getBid(id) {
  if (!supabaseAvailable) return memoryDb.bids.find(b => b.id === id) || null;
  const { data, error } = await supabaseAdmin
    .from("bids")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

async function getBidBySupplierAndProject(supplierAccount, projectId) {
  if (!supabaseAvailable) {
    const matches = memoryDb.bids.filter(b => b.supplier_account === supplierAccount && b.project_id === projectId);
    matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return matches[0] || null;
  }
  const { data, error } = await supabaseAdmin
    .from("bids")
    .select("*")
    .eq("supplier_account", supplierAccount)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

async function getBidsByProject(projectId) {
  if (!supabaseAvailable) return memoryDb.bids.filter(b => b.project_id === projectId);
  const { data, error } = await supabaseAdmin
    .from("bids")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

async function getAllBids() {
  if (!supabaseAvailable) return memoryDb.bids.slice().reverse();
  const { data, error } = await supabaseAdmin
    .from("bids")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// ===================== 辅助函数 =====================

async function getNextProjectId() {
  if (!supabaseAvailable) {
    if (memoryDb.projects.length === 0) return 1;
    const last = memoryDb.projects[memoryDb.projects.length - 1].id;
    const num = parseInt(last.replace("ZB-", "")) || 0;
    return num + 1;
  }
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return 1;
  const last = data[0].id;
  const num = parseInt(last.replace("ZB-", "")) || 0;
  return num + 1;
}

async function updateProject(id, updates) {
  if (!supabaseAvailable) {
    const idx = memoryDb.projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      updates.updated_at = new Date().toISOString();
      memoryDb.projects[idx] = { ...memoryDb.projects[idx], ...updates };
      return memoryDb.projects[idx];
    }
    return null;
  }
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[Supabase] updateProject failed:", error.message); return null; }
  return data;
}
async function updateUserStatus(account, status) {
  if (!supabaseAvailable) {
    const user = memoryDb.users.find(u => u.account === account);
    if (!user) return null;
    user.status = status;
    console.log("[Memory] updateUserStatus: " + account + " -> " + status);
    return user;
  }
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ status })
    .eq("account", account)
    .select()
    .single();
  if (error) { console.error("[Supabase] updateUserStatus failed:", error.message); return null; }
  return data;
}

module.exports = {
  initSupabase,
  isAvailable,
  getClient,
  getAdminClient,
  // 用户
  createUser,
  getUser,
  getAllUsers,
  // 验证码
  saveVerificationCode,
  getVerificationCode,
  markCodeVerified,
  deleteExpiredCodes,
  // 项目
  createProject,
  getAllProjects,
  getProject,
  updateProjectStatus,
  updateProject,
  // 报价
  createBid,
  updateBid,
  getBid,
  getBidBySupplierAndProject,
  getBidsByProject,
  getAllBids,
  // 辅助
  getNextProjectId,
  updateUserStatus,
};
