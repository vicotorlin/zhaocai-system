import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# === Change 1: Move spec name input from header into cost breakdown section ===

# OLD: Header has both "产品规格 {specIdx + 1}" span AND the spec name Input
old_header = '                    <div className="flex items-center gap-3">\n                      <span className="text-sm font-bold text-slate-500">'

# Find the old header block
idx = content.find(old_header)
if idx < 0:
    print("ERROR: old_header not found")
else:
    # Find the end of this block (closing </div> after the Input)
    # The block is: <div className="flex items-center gap-3"> ... </div>
    # We need to find the matching </div>
    input_marker = 'className="w-64 text-sm"'
    input_idx = content.find(input_marker, idx)
    if input_idx < 0:
        print("ERROR: input marker not found")
    else:
        # Find /> after the Input
        slash_end = content.find('/>', input_idx)
        # Find </div> after that
        div_close = content.find('</div>', slash_end)
        
        old_block = content[idx:div_close+6]
        
        # New block: just the label (no Input)
        new_block = '                    <div className="flex items-center gap-3">\n                      <span className="text-xs font-semibold text-slate-500 px-2">{spec.name || ' + "'" + '\u4ea7\u54c1\u6216\u89c4\u683c ' + "'" + ' + (specIdx + 1)}</span>\n                    </div>'
        
        content = content[:idx] + new_block + content[div_close+6:]
        print("Change 1: Moved spec name input from header to cost breakdown")

# === Change 2: Add spec input inside cost breakdown ===
# Find the cost breakdown header and insert spec input above the grid

# After change 1, the file has been modified. Now find the cost breakdown section
cost_marker = '<h4 className="text-xs font-semibold text-slate-700 mb-2">\u8d39\u7528\u62c6\u5206</h4>\n                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'

idx2 = content.find(cost_marker)
if idx2 < 0:
    # Try with just the h4 tag
    h4_marker = '<h4 className="text-xs font-semibold text-slate-700 mb-2">'
    idx2 = content.find(h4_marker)
    if idx2 >= 0:
        print(f"Found h4 at {idx2}")
        print(repr(content[idx2:idx2+150]))
    else:
        print("ERROR: cost marker not found")
else:
    # Replace: insert spec input before the grid
    grid_start = content.find('<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">', idx2)
    if grid_start < 0:
        print("ERROR: grid not found")
    else:
        insert = '\n                    <div className="mb-2">\n                      <label className="text-xs text-slate-500">\u89c4\u683c</label>\n                      <Input\n                        placeholder="\u8bf7\u8f93\u5165\u4ea7\u54c1\u89c4\u683c\u540d\u79f0\uff08\u5982\uff1a1.5\u7c73\u5e8a/1.8\u7c73\u5e8a\uff09"\n                        value={spec.name}\n                        onChange={(e) => updateSpec(spec.id, { name: e.target.value })}\n                        className="mt-0.5 h-8 text-xs"\n                      />\n                    </div>'
        
        content = content[:grid_start] + insert + content[grid_start:]
        print("Change 2: Added spec input to cost breakdown")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("All changes written!")
