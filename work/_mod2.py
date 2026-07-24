import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# == Replacement 1: Spec header ==
# Find the exact block and replace it
old_block_1 = '''                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-500">\u4ea7\u54c1\u89c4\u683c {specIdx + 1}</span>
                      <Input
                        placeholder="\u8bf7\u8f93\u5165\u4ea7\u54c1\u89c4\u683c\u540d\u79f0\uff08\u5982\uff1a1.5\u7c73\u5e8a/1.8\u7c73\u5e8a\uff09"
                        value={spec.name}
                        onChange={(e) => updateSpec(spec.id, { name: e.target.value })}
                        className="w-64 text-sm"
                      />
                    </div>'''

new_block_1 = '''                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 px-2">{spec.name || '\u4ea7\u54c1\u6216\u89c4\u683c ' + (specIdx + 1)}</span>
                    </div>'''

cnt1 = content.count(old_block_1)
print(f"Occurrences of old_block_1: {cnt1}")

if cnt1 > 0:
    content = content.replace(old_block_1, new_block_1)
    print("Replaced spec header")
else:
    # Try to find it differently - maybe the Unicode escapes don't match
    # Let's use ASCII markers
    idx = content.find('className="text-sm font-bold text-slate-500"')
    if idx >= 0:
        print(f"Found bold text-sm at: {idx}")
        print(repr(content[idx-100:idx+200]))
    else:
        print("NOT FOUND - checking with different patterns")
        # Read the file raw to check encoding
        with open(path, "rb") as f:
            raw = f.read()
        marker_bytes = '\u4ea7\u54c1\u89c4\u683c'.encode('utf-8')
        print(f"Raw marker found: {marker_bytes in raw}")

sys.stdout.flush()
