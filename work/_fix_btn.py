import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Make button more robust - use a simple inline function first
old_btn = """onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ 新增规格</button>"""

new_btn = """onclick="try{saveCurrentSpec()}catch(e){alert('错误: '+e.message)}" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ 新增规格</button>"""

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    print("Updated button onclick")
else:
    print("FAILED: button not found")

# Also check JS syntax
js_start = content.find("<script>")
js_end = content.find("</script>", js_start)
js = content[js_start+8:js_end]

with open(path, "wb") as f:
    f.write(content.encode("utf-8", errors="surrogateescape"))

print("Done")
