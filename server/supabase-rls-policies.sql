-- ============================================================
-- 招采管理系统 - Supabase RLS 策略（供应商报价数据隔离）
-- 执行方式：Supabase Dashboard → SQL Editor 中粘贴运行
-- ============================================================

-- 1. 创建 supplier_quotes 表
CREATE TABLE IF NOT EXISTS supplier_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 供应商身份（关联 Supabase Auth）
  supplier_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_email  TEXT,
  -- 项目信息
  project_id      TEXT NOT NULL,
  project_name    TEXT,
  -- 报价数据
  items           JSONB NOT NULL DEFAULT '[]',
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  -- 安全字段
  ip_address      TEXT,
  -- 哈希校验（防篡改）
  data_hash       TEXT,
  -- 状态
  status          TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('draft', 'submitted', 'withdrawn')),
  -- 审计
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sq_supplier   ON supplier_quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sq_project    ON supplier_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_sq_status     ON supplier_quotes(status);

-- ============================================================
-- 2. 行级安全策略 (RLS) — 核心安全层
-- ============================================================
ALTER TABLE supplier_quotes ENABLE ROW LEVEL SECURITY;

-- 策略 1: 供应商只能查看自己的报价
-- 即使恶意构造 URL /api/quotes?id=xxx，RLS 也会拦截
CREATE POLICY "Suppliers can view own quotes"
  ON supplier_quotes
  FOR SELECT
  USING (supplier_id = auth.uid());

-- 策略 2: 供应商只能创建属于自己的报价
-- 客户端传入的 supplier_id 会被忽略，强制使用 auth.uid()
CREATE POLICY "Suppliers can insert own quotes"
  ON supplier_quotes
  FOR INSERT
  WITH CHECK (supplier_id = auth.uid());

-- 策略 3: 供应商只能更新自己的报价
CREATE POLICY "Suppliers can update own quotes"
  ON supplier_quotes
  FOR UPDATE
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- 策略 4: 供应商只能删除自己的报价
CREATE POLICY "Suppliers can delete own quotes"
  ON supplier_quotes
  FOR DELETE
  USING (supplier_id = auth.uid());

-- ============================================================
-- 3. 管理员视图（使用 service_role key 绕过 RLS）
-- ============================================================

-- 管理员函数：查看所有供应商的报价（仅服务端调用）
CREATE OR REPLACE FUNCTION admin_get_all_quotes()
RETURNS SETOF supplier_quotes
LANGUAGE sql
SECURITY DEFINER    -- 使用函数创建者的权限执行
SET search_path = ''
AS $$
  SELECT * FROM supplier_quotes ORDER BY created_at DESC;
$$;

-- 管理员函数：按项目统计报价（用于分析串标嫌疑）
CREATE OR REPLACE FUNCTION admin_get_project_stats()
RETURNS TABLE(
  project_id    TEXT,
  project_name  TEXT,
  quote_count   BIGINT,
  supplier_ids  UUID[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    sq.project_id,
    MAX(sq.project_name) AS project_name,
    COUNT(*)::BIGINT AS quote_count,
    ARRAY_AGG(DISTINCT sq.supplier_id) AS supplier_ids
  FROM supplier_quotes sq
  GROUP BY sq.project_id
  ORDER BY quote_count DESC;
$$;

-- ============================================================
-- 4. 触发器：自动更新 updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_sq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sq_updated_at ON supplier_quotes;
CREATE TRIGGER trg_sq_updated_at
  BEFORE UPDATE ON supplier_quotes
  FOR EACH ROW EXECUTE FUNCTION update_sq_updated_at();
