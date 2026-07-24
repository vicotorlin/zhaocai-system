import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

idx = content.find("async function submitBid(){")
if idx < 0:
    idx = content.find("function submitBid(){")

# Find proper depth
depth = 0
i = idx
while i < len(content):
    if content[i] == '{':
        depth += 1
        if depth == 1:
            pass  # first opening brace
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
    i += 1

func = content[idx:end]
print(f"Length: {len(func)}")
opens = func.count('{')
closes = func.count('}')
print(f"Braces: {{ = {opens}, }} = {closes}")
print(func)
