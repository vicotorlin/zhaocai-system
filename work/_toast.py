import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find toast function
idx = content.find("function toast(")
if idx >= 0:
    depth = 0
    end = idx
    for i in range(idx, len(content)):
        if content[i] == '{': depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    print("toast function:")
    print(content[idx:end])
else:
    print("toast NOT FOUND")

# Also check if there's a "btn-sm" class defined
if ".btn-sm" in content:
    print("\n.btn-sm CSS: FOUND")
else:
    print("\n.btn-sm CSS: MISSING")
