import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find openBidForm
idx = content.find("function openBidForm")
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
    func = content[idx:end]
    print(f"openBidForm: {idx} to {end}, length {len(func)}")
    print(func[:1000])
else:
    print("NOT FOUND")
