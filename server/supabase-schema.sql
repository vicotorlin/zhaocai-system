-- ============================================================
-- 招采管理系统 - Supabase 数据库 Schema
-- 执行方式：在 Supabase Dashboard → SQL Editor 中粘贴运行
-- ============================================================

-- 1. 附件表：存储上传文件记录
CREATE TABLE IF NOT EXISTS attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 关联业务（例如关联到报价项目）
  project_id    TEXT,
  -- 文件信息
  file_name     TEXT NOT NULL,                              -- 原始文件名
  file_size     BIGINT NOT NULL,                           -- 文件大小（字节）
  file_type     TEXT NOT NULL,                              -- MIME 类型
  file_ext      TEXT NOT NULL,                              -- 文件扩展名（如 pdf, zip, dwg）
  -- Supabase Storage 路径
  bucket_name   TEXT NOT NULL DEFAULT 'attachments',        -- Storage bucket 名称
  storage_path  TEXT NOT NULL,                              -- bucket 内的存储路径
  -- 带签名的临时 URL（有过期时间）
  signed_url    TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  -- 上传信息
  uploaded_by   TEXT,                                       -- 上传者标识
  upload_ip     TEXT,                                       -- 上传者 IP
  -- 状态与审计
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived', 'deleted')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_status ON attachments(status);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);

-- 2. 更新时间的触发器
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attachments_updated_at ON attachments;
CREATE TRIGGER trg_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW EXECUTE FUNCTION update_attachments_updated_at();

-- 3. 行级安全策略 (RLS)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户查看自己的附件
CREATE POLICY "Users can view own attachments"
  ON attachments FOR SELECT
  USING (auth.uid()::text = uploaded_by OR uploaded_by IS NULL);

-- 允许已认证用户插入附件
CREATE POLICY "Users can insert attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.uid()::text = uploaded_by OR uploaded_by IS NULL);

-- 允许已认证用户更新自己的附件
CREATE POLICY "Users can update own attachments"
  ON attachments FOR UPDATE
  USING (auth.uid()::text = uploaded_by)
  WITH CHECK (auth.uid()::text = uploaded_by);

-- 4. RPC 函数：生成并更新签名 URL
-- 调用方式：SELECT refresh_signed_url(attachment_id);
CREATE OR REPLACE FUNCTION refresh_signed_url(p_attachment_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  -- 注：实际签名 URL 由客户端 SDK 生成，这里只是占位示例
  -- 真实的签名 URL 应在应用层调用 supabase.storage.from().createSignedUrl() 获取
  UPDATE attachments
  SET signed_url_expires_at = now() + interval '7 days'
  WHERE id = p_attachment_id;
  RETURN 'URL refreshed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
