import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find the problematic area
idx = content.find("aasync function")
if idx >= 0:
    print(f"Found at {idx}")
    print(repr(content[idx-10:idx+80]))
else:
    # Find all "async function"
    import re
    for m in re.finditer(r'async function', content):
        print(f"At {m.start()}: ...{repr(content[m.start()-20:m.end()+60])}...")
