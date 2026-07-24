import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path + ".bak", "r", encoding="utf-8") as f:
    content = f.read()

count = 0
count2 = 0

# === Replace 1: Move spec name out of header ===
# Find: <span className="text-sm font-bold text-slate-500">产品规格 {specIdx + 1}</span>
#        followed by <Input placeholder="请输入产品规格名称..."
# Replace the Input with nothing, update the span to show spec.name

marker = '产品规格 {specIdx + 1}'
while True:
    idx = content.find(marker)
    if idx == -1:
        break
    
    # Find the outer div containing both span and Input
    div_open = content.rfind('<div className="flex items-center gap-3">', 0, idx)
    if div_open == -1:
        break
    
    # Find end of Input tag
    input_start = content.find('<Input', idx)
    if input_start == -1:
        break
    input_end = content.find('/>', input_start) + 2
    if input_end < 2:
        break
    
    # Find closing </div>
    div_close = content.find('</div>', input_end)
    if div_close == -1:
        break
    
    # Replace the span text to show current spec name or default
    old_span = '<span className="text-sm font-bold text-slate-500">产品规格 {specIdx + 1}</span>'
    new_span = '<span className="text-xs font-semibold text-slate-500 px-2">{spec.name || '
    content = content[:div_open] + new_span + content[div_open + len(old_span):]
    count += 1

print(f"Spec headers replaced: {count}")

# === Replace 2: Add spec input inside cost breakdown ===  
# Find: 费用拆分</h4>\n                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
# Insert spec input before the grid

old_grid = '<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'
spec_input_block = '''                    <div className="mb-2">
                      <label className="text-xs text-slate-500">规格</label>
                      <Input
                        placeholder="请输入产品规格名称（如：1.5米床/1.8米床）"
                        value={spec.name}
                        onChange={(e) => updateSpec(spec.id, { name: e.target.value })}
                        className="mt-0.5 h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'''

# We only want to add this inside spec blocks (after 费用拆分), not all grid occurrences
# Strategy: find 费用拆分 then find the next grid div
marker2 = '费用拆分</h4>'
while True:
    idx = content.find(marker2)
    if idx == -1:
        break
    
    # Find the grid div after this
    grid_idx = content.find(old_grid, idx)
    if grid_idx == -1 or grid_idx - idx > 200:
        # Not close enough - might not be in a spec block
        break
    
    content = content[:grid_idx] + spec_input_block + content[grid_idx + len(old_grid):]
    count2 += 1
    # Remove this marker to avoid reprocessing
    content = content[:idx] + 'COST_REPLACED' + content[idx + len(marker2):]

print(f"Cost sections updated: {count2}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
