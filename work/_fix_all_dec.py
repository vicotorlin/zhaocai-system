import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

count = 0

# Fix 1: bidResult.total - add fractionDigits
old = "bidResult.total.toLocaleString()"
new = 'bidResult.total.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'
c = content.count(old)
if c > 0:
    content = content.replace(old, new)
    print(f"Fix bidResult.total: {c}")
    count += c

# Fix 2: calcActualUsage - add maximumFractionDigits
old = 'calcActualUsage(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2 })'
new = 'calcActualUsage(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'
c = content.count(old)
if c > 0:
    content = content.replace(old, new)
    print(f"Fix calcActualUsage: {c}")
    count += c

# Fix 3 & 4: calcTaxIncluded - add maximumFractionDigits
old = 'calcTaxIncluded(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2 })'
new = 'calcTaxIncluded(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'
c = content.count(old)
if c > 0:
    content = content.replace(old, new)
    print(f"Fix calcTaxIncluded: {c}")
    count += c

# Fix 5 & 6: calcSubtotal - add maximumFractionDigits (2 occurrences)
old = 'calcSubtotal(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2 })'
new = 'calcSubtotal(specItems, idx).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'
c = content.count(old)
if c > 0:
    content = content.replace(old, new)
    print(f"Fix calcSubtotal: {c}")
    count += c

# Fix 7: Add label note to material cost
old_label = '<label className="text-xs text-slate-500">\u6750\u6599\u8d39\u7528</label>'
new_label = '<label className="text-xs text-slate-500">\u6750\u6599\u8d39\u7528\uff08\u542b\u4e3b\u6750\u8f85\u6750\uff0c\u5305\u88c5\u7b49\u5b9e\u7269\u8d39\u7528\uff09</label>'
c = content.count(old_label)
if c > 0:
    content = content.replace(old_label, new_label)
    print(f"Fix material cost label: {c}")
    count += c

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal fixes: {count}")
