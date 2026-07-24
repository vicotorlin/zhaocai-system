import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find submitBid and show it
idx = content.find("async function submitBid")
depth = 0
end = idx
for i in range(idx, len(content)):
    if content[i] == '{': depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
print(f"submitBid: {idx} to {end}")
print(content[idx:end])
