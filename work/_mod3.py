import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# == Replacement 2: Add spec input inside cost breakdown ==
# Find the cost breakdown header and add spec name input before the grid

old_block_2 = '<h4 className="text-xs font-semibold text-slate-700 mb-2">\u8d39\u7528\u62c6\u5206</h4>\n                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'

new_block_2 = '<h4 className="text-xs font-semibold text-slate-700 mb-2">\u8d39\u7528\u62c6\u5206</h4>\n                    <div className="mb-2">\n                      <label className="text-xs text-slate-500">\u89c4\u683c</label>\n                      <Input\n                        placeholder="\u8bf7\u8f93\u5165\u4ea7\u54c1\u89c4\u683c\u540d\u79f0\uff08\u5982\uff1a1.5\u7c73\u5e8a/1.8\u7c73\u5e8a\uff09"\n                        value={spec.name}\n                        onChange={(e) => updateSpec(spec.id, { name: e.target.value })}\n                        className="mt-0.5 h-8 text-xs"\n                      />\n                    </div>\n                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">'

cnt2 = content.count(old_block_2)
print(f"Occurrences of old_block_2: {cnt2}")

if cnt2 > 0:
    content = content.replace(old_block_2, new_block_2)
    print("Added spec input to cost breakdown")
else:
    print("NOT FOUND")
    # Check encoding
    idx = content.find('text-xs font-semibold text-slate-700 mb-2')
    if idx >= 0:
        print(f"Found at: {idx}")
        print(repr(content[idx:idx+120]))
    else:
        print("No match at all")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
