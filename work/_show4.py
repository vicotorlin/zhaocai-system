import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

idx = content.find("async function submitBid(){")
print(f"Start: {idx}")

# Show 2000 chars from start
chunk = content[idx:idx+2000]
opens = chunk.count('{')
closes = chunk.count('}')
print(f"First 2000 chars: {{ = {opens}, }} = {closes}")
print(chunk)
