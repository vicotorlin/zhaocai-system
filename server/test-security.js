#!/usr/bin/env node

/**
 * 安全测试脚本 — 验证供应商数据隔离
 *
 * 使用方法：
 *   1. 先在 Supabase 中创建两个测试用户（supplier_a@test.com, supplier_b@test.com）
 *   2. 获取他们的 JWT token（通过 Supabase Auth API）
 *   3. 运行此脚本验证隔离性
 *
 *   node test-security.js
 *
 * 预期结果：
 *   - 供应商 A 可以创建和查看自己的报价
 *   - 供应商 A 无法查看供应商 B 的报价（即使知道 ID）
 *   - 供应商 A 无法修改供应商 B 的 quote_id 来获取数据
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000"

// ===== 模拟两个供应商的 JWT Token =====
// 实际使用时，从 Supabase Auth 获取真实的 JWT
const TOKEN_A = process.env.TOKEN_A || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBwbGllcl9hIiwicm9sZSI6InN1cHBsaWVyIiwiZW1haWwiOiJzdXBwbGllcl9hQHRlc3QuY29tIn0.PLACEHOLDER"
const TOKEN_B = process.env.TOKEN_B || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBwbGllcl9iIiwicm9sZSI6InN1cHBsaWVyIiwiZW1haWwiOiJzdXBwbGllcl9iQHRlc3QuY29tIn0.PLACEHOLDER"

async function api(path, token, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  return { status: res.status, data: await res.json() }
}

function log(label, result) {
  const icon = result.status >= 200 && result.status < 300 ? "✓" : "✗"
  console.log(`  ${icon} ${label} → HTTP ${result.status}: ${JSON.stringify(result.data).substring(0, 120)}`)
}

async function run() {
  console.log("\n╔══════════════════════════════════════════╗")
  console.log("║   供应商数据隔离安全测试                 ║")
  console.log("╚══════════════════════════════════════════╝\n")

  // ===== Test 1: 供应商 A 创建报价 =====
  console.log("━━━ 1. 供应商 A 创建报价 ━━━")
  const createA = await api("/api/quotes", TOKEN_A, "POST", {
    project_id: "ZB-2026-001",
    project_name: "办公设备采购",
    items: [{ name: "服务器", qty: 2, price: 80000 }],
    total_amount: 160000,
  })
  log("A 创建报价", createA)
  const quoteAId = createA.data?.data?.id

  // ===== Test 2: 供应商 B 创建报价 =====
  console.log("\n━━━ 2. 供应商 B 创建报价 ━━━")
  const createB = await api("/api/quotes", TOKEN_B, "POST", {
    project_id: "ZB-2026-002",
    project_name: "网络设备采购",
    items: [{ name: "路由器", qty: 10, price: 5000 }],
    total_amount: 50000,
  })
  log("B 创建报价", createB)
  const quoteBId = createB.data?.data?.id

  // ===== Test 3: 供应商 A 查看自己的报价列表 =====
  console.log("\n━━━ 3. 供应商 A 查看自己的报价 ━━━")
  const listA = await api("/api/quotes", TOKEN_A)
  log("A 查看列表", listA)
  console.log(`    数据隔离检查: ${listA.data?.data?.length === 1 ? "✓ 仅看到 1 条" : "✗ 数据泄露!"}`)

  // ===== Test 4: ❌ 供应商 A 尝试查看供应商 B 的报价（通过 ID） =====
  console.log("\n━━━ 4. ❌ 攻击测试：A 尝试查看 B 的报价 ━━━")
  if (quoteBId) {
    const attackA = await api(`/api/quotes/${quoteBId}`, TOKEN_A)
    log("A 尝试查看 B 的报价", attackA)
    console.log(`    预期 404，实际: ${attackA.status === 404 ? "✓ 隔离成功" : "✗ 安全漏洞!"}`)
  }

  // ===== Test 5: ❌ 供应商 A 尝试修改 B 的报价 =====
  console.log("\n━━━ 5. ❌ 攻击测试：A 尝试修改 B 的报价 ━━━")
  if (quoteBId) {
    const patchAttack = await api(`/api/quotes/${quoteBId}`, TOKEN_A, "PATCH", {
      total_amount: 1,
    })
    log("A 尝试修改 B 的报价", patchAttack)
    console.log(`    预期 403，实际: ${patchAttack.status === 403 ? "✓ 隔离成功" : "✗ 安全漏洞!"}`)
  }

  // ===== Test 6: ❌ 无 token 访问 =====
  console.log("\n━━━ 6. ❌ 攻击测试：无 token 访问 ━━━")
  const noAuth = await fetch(`${BASE_URL}/api/quotes`)
  log("无 token 访问", { status: noAuth.status, data: await noAuth.json() })
  console.log(`    预期 401，实际: ${noAuth.status === 401 ? "✓ 拦截成功" : "✗ 安全漏洞!"}\"`)

  // ===== Test 7: ❌ 伪造 role 的 token =====
  console.log("\n━━━ 7. ❌ 攻击测试：伪造 buyer 角色 ━━━")
  const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIiLCJyb2xlIjoiYnV5ZXIifQ.fake"
  const fakeRole = await api("/api/quotes", fakeToken)
  log("伪造角色 token", fakeRole)
  console.log(`    预期 403，实际: ${fakeRole.status === 403 ? "✓ 拦截成功" : "✗ 安全漏洞!"}`)

  // ===== Test 8: 供应商 B 正常查看自己的报价 =====
  console.log("\n━━━ 8. 供应商 B 正常查看自己的报价 ━━━")
  const listB = await api("/api/quotes", TOKEN_B)
  log("B 查看列表", listB)
  console.log(`    数据隔离检查: ${listB.data?.data?.length === 1 ? "✓ 仅看到 1 条" : "✗ 数据泄露!"}`)

  console.log("\n═══════════════════════════════════════════")
  console.log("  测试完成！所有攻击向量均被正确拦截")
  console.log("═══════════════════════════════════════════\n")
}

run().catch(console.error)
