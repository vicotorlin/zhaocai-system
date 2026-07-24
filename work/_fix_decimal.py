import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

count = 0

# Fix 1: Round matSum to 2 decimals in calcSpecTotal
old_cst = """  const calcSpecTotal = (items: QuoteItem[]) => {
    if (category === "\u88ab\u5b50\u4ef6\u5957") {
      return items.reduce((sum, _, idx) => sum + calcSubtotal(items, idx), 0)
    }
    return items.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0)
  }"""

new_cst = """  const calcSpecTotal = (items: QuoteItem[]) => {
    if (category === "\u88ab\u5b50\u4ef6\u5957") {
      const raw = items.reduce((sum, _, idx) => sum + calcSubtotal(items, idx), 0)
      return Math.round(raw * 100) / 100
    }
    const raw = items.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0)
    return Math.round(raw * 100) / 100
  }"""

cnt1 = content.count(old_cst)
print(f"Fix calcSpecTotal: {cnt1}")
if cnt1 > 0:
    content = content.replace(old_cst, new_cst)
    count += 1

# Fix 2: Round in calcGrandTotal too
old_cgt = """  const calcGrandTotal = () => {
    return specs.reduce((sum, spec) => {
      const matSum = calcSpecTotal(spec.items)
      return sum + matSum + spec.laborCost + spec.manufacturingCost + spec.adminCost + spec.profit + spec.tax
    }, 0)
  }"""

new_cgt = """  const calcGrandTotal = () => {
    const raw = specs.reduce((sum, spec) => {
      const matSum = calcSpecTotal(spec.items)
      return sum + matSum + spec.laborCost + spec.manufacturingCost + spec.adminCost + spec.profit + spec.tax
    }, 0)
    return Math.round(raw * 100) / 100
  }"""

cnt2 = content.count(old_cgt)
print(f"Fix calcGrandTotal: {cnt2}")
if cnt2 > 0:
    content = content.replace(old_cgt, new_cgt)
    count += 1

# Fix 3: Add note to manufacturing cost label
old_mfg = '<label className="text-xs text-slate-500">\u5236\u9020\u8d39\u7528</label>'
new_mfg = '<label className="text-xs text-slate-500">\u5236\u9020\u8d39\u7528</label>\n                        <span className="text-[10px] text-slate-400">\u542b\u623f\u79df\uff0c\u6c34\u7535\uff0c\u673a\u5668\u6298\u65e7</span>'

cnt3 = content.count(old_mfg)
print(f"Fix mfg label: {cnt3}")
if cnt3 > 0:
    content = content.replace(old_mfg, new_mfg)
    count += 1

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal fixes: {count}")
