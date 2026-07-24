import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\supplier-quote\src\App.tsx"
with open(path + ".bak", "r", encoding="utf-8") as f:
    content = f.read()

# Find using exact substrings
markers = [
    "产品规格 {specIdx + 1}",
    "费用拆分",
    "请输入产品规格名称",
]
for m in markers:
    idx = content.find(m)
    print(f"'{m}': found={idx >= 0}, idx={idx}")
