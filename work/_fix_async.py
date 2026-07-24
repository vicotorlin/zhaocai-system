import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Fix: add async to submitBid
old = "function submitBid(){"
new = "async function submitBid(){"
cnt = content.count(old)
if cnt > 0:
    content = content.replace(old, new)
    print(f"Fixed submitBid async: {cnt}")

with open(path, "w", encoding="utf-8", errors="surrogateescape") as f:
    f.write(content)

print("Done")
