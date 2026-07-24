-- 招采管理系统 Supabase 建表 SQL
-- 在 Supabase SQL Editor 中执行

CREATE TABLE IF NOT EXISTS users (
  account TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'supplier',
  password TEXT NOT NULL,
  name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  account TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  last_sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_vc_account ON verification_codes(account);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  buyer_account TEXT NOT NULL,
  buyer_name TEXT DEFAULT '',
  project_name TEXT NOT NULL,
  buyer TEXT DEFAULT '',
  budget DECIMAL DEFAULT 0,
  deadline TEXT DEFAULT '',
  plan TEXT DEFAULT '',
  tech_params TEXT DEFAULT '',
  channel_details TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]',
  winning_supplier TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_proj_buyer ON projects(buyer_account);
CREATE INDEX idx_proj_status ON projects(status);

CREATE TABLE IF NOT EXISTS bids (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  project_name TEXT DEFAULT '',
  supplier_account TEXT NOT NULL,
  supplier_name TEXT DEFAULT '',
  category TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  specs JSONB DEFAULT '[]',
  total DECIMAL DEFAULT 0,
  labor_cost DECIMAL DEFAULT 0,
  manufacturing_cost DECIMAL DEFAULT 0,
  admin_cost DECIMAL DEFAULT 0,
  profit DECIMAL DEFAULT 0,
  tax DECIMAL DEFAULT 0,
  validity TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]',
  submit_ip TEXT DEFAULT '',
  submit_ua TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_bid_project ON bids(project_id);
CREATE INDEX idx_bid_supplier ON bids(supplier_account);

-- 默认账号
INSERT INTO users (account, role, password, name, status) VALUES
  ('794474441@qq.com', 'buyer', '123456', '采购管理员', 'active'),
  ('linguodong@corp.netease.com', 'supplier', '123456', '恒源纺织', 'active')
ON CONFLICT (account) DO NOTHING;
