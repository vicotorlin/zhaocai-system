import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

count = 0

# Fix 1: Material cost - remove "自动汇总" paragraph and align with Input height
old_mat = '<div className="mt-0.5 h-8 flex items-center px-2 bg-white border rounded text-xs font-semibold text-slate-700">{matSum.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</div>\n                        <p className="text-xs text-slate-400">\u81ea\u52a8\u6c47\u603b</p>'

new_mat = '<div className="mt-0.5 h-8 flex items-center px-2 bg-white border rounded text-xs font-semibold text-slate-700">{matSum.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>'

cnt1 = content.count(old_mat)
print(f"Fix 1 occurrences: {cnt1}")
if cnt1 > 0:
    content = content.replace(old_mat, new_mat)
    count += 1

# Fix 2: specTotal at the bottom - 2 decimal places
old_total = '{specTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}'
new_total = '{specTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}'

cnt2 = content.count(old_total)
print(f"Fix 2 occurrences: {cnt2}")
if cnt2 > 0:
    content = content.replace(old_total, new_total)
    count += 1

# Fix 3: Also fix matSum display in other places (there might be more)
# Let's also check for any other toLocaleString without maximumFractionDigits
old_mat2 = 'matSum.toLocaleString("zh-CN", { minimumFractionDigits: 2 })'
new_mat2 = 'matSum.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'

cnt3 = content.count(old_mat2)
print(f"Fix 3 occurrences: {cnt3}")
if cnt3 > 0:
    content = content.replace(old_mat2, new_mat2)
    count += 1

# Fix 4: grand total at the bottom
old_gt = 'grandTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2 })'
new_gt = 'grandTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })'
cnt4 = content.count(old_gt)
print(f"Fix 4 occurrences: {cnt4}")
if cnt4 > 0:
    content = content.replace(old_gt, new_gt)
    count += 1

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal fixes: {count}")
