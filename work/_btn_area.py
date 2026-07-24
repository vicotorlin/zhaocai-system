import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find the area around the "添加物料" and "新增规格" buttons
idx = content.find('onclick="addBidItem()">+ 添加物料</button>')
if idx >= 0:
    # Show 200 chars before and after
    start = max(0, idx - 200)
    end = min(len(content), idx + 300)
    chunk = content[start:end]
    print(f"Button area at {idx}:")
    print(chunk)
else:
    print("Button NOT FOUND")
