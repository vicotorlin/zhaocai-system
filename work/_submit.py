import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
js = '\n'.join(scripts)

# Find submitBid and show it fully
idx = js.find('async function submitBid')
if idx < 0:
    idx = js.find('function submitBid')
    
# Find the matching closing brace
depth = 0
end_idx = idx
for i in range(idx, len(js)):
    if js[i] == '{': depth += 1
    elif js[i] == '}': 
        depth -= 1
        if depth == 0:
            end_idx = i + 1
            break

print(f"submitBid: {idx} to {end_idx}, length: {end_idx - idx}")
print(js[idx:end_idx])
