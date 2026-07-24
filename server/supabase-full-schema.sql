-- ============================================================
-- 招采管理系统 - 完整数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中粘贴运行
-- ============================================================

-- ==================== 1. 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account     TEXT NOT NULL UNIQUE,              -- 手机号或邮箱
  role        TEXT NOT NULL CHECK (role IN ('"'"'supplier'"'"', '"'"'buyer'"'"', '"'"'reviewer'"'"', '"'"'admin'"'"')),
  password    TEXT NOT NULL,                      -- 密码哈希
  name        TEXT,                               -- 用户名称
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_account ON users(account);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==================== 2. 验证码表 ====================
CREATE TABLE IF NOT EXISTS verification_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account       TEXT NOT NULL,                    -- 手机号或邮箱
  code          TEXT NOT NULL,                    -- 验证码
  expires_at    TIMESTAMPTZ NOT NULL,             -- 过期时间
  verified      BOOLEAN NOT NULL DEFAULT false,   -- 是否已验证
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_account ON verification_codes(account);
CREATE INDEX IF NOT EXISTS idx_vc_expires ON verification_codes(expires_at);

-- ==================== 3. 采购项目表 ====================
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,                 -- ZB-001 格式
  buyer_account TEXT NOT NULL,                    -- 采购方账号
  project_name  TEXT NOT NULL,                    -- 项目名称
  buyer         TEXT,                             -- 采购单位
  budget        DECIMAL(12,2) NOT NULL DEFAULT 0, -- 预算
  deadline      DATE,                             -- 截止日期
  status        TEXT NOT NULL DEFAULT '"'"'open'"'"'
                  CHECK (status IN ('"'"'open'"'"', '"'"'closed'"'"', '"'"'awarded'"'"', '"'"'cancelled'"'"')),
  description   TEXT,                             -- 项目描述
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_buyer ON projects(buyer_account);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);

-- ==================== 4. 供应商报价表 ====================
CREATE TABLE IF NOT EXISTS bids (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        TEXT NOT NULL,                -- 关联项目ID
  project_name      TEXT,                         -- 项目名称
  supplier_account  TEXT NOT NULL,                -- 供应商账号
  supplier_name     TEXT,                         -- 供应商名称
  category          TEXT,                         -- 报价类目
  -- 物料明细 (JSONB 数组)
  items             JSONB NOT NULL DEFAULT '"'"'[]'"'"',
  -- 产品规格与费用拆分 (JSONB 数组)
  specs             JSONB DEFAULT '"'"'[]'"'"',
  -- 报价汇总
  total             DECIMAL(12,2) NOT NULL DEFAULT 0,
  labor_cost        DECIMAL(12,2) DEFAULT 0,
  manufacturing_cost DECIMAL(12,2) DEFAULT 0,
  admin_cost        DECIMAL(12,2) DEFAULT 0,
  profit            DECIMAL(12,2) DEFAULT 0,
  tax               DECIMAL(12,2) DEFAULT 0,
  -- 有效期
  validity          TEXT,
  -- 状态
  status            TEXT NOT NULL DEFAULT '"'"'submitted'"'"'
                      CHECK (status IN ('"'"'draft'"'"', '"'"'submitted'"'"', '"'"'withdrawn'"'"')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_project ON bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_supplier ON bids(supplier_account);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- ==================== 5. 触发器和更新时间 ====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 表
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- projects 表
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- bids 表
DROP TRIGGER IF EXISTS trg_bids_updated_at ON bids;
CREATE TRIGGER trg_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== 6. RLS 策略 ====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 使用 service_role key 的服务端可以绕过 RLS，所以这里使用宽松策略
-- 所有表：允许 service_role 完全访问

-- users 表策略
CREATE POLICY "Service role full access users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- projects 表策略
CREATE POLICY "Service role full access projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- bids 表策略
CREATE POLICY "Service role full access bids"
  ON bids FOR ALL
  USING (true)
  WITH CHECK (true);

-- verification_codes 表策略（仅服务端访问）
CREATE POLICY "Service role full access codes"
  ON verification_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== 7. 定期清理过期验证码 ====================
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 可选：启用 pg_cron 扩展后添加定时任务
-- SELECT cron.schedule('"'"'cleanup-codes'"'"', '"'"'*/5 * * * *'"'"', '"'"'SELECT cleanup_expired_codes();'"'"');

-- ==================== 完成 ====================
SELECT '"'"'数据库 Schema 创建完成!'"'"' AS result;
