import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find all occurrences of "function submitBid"
import re
for m in re.finditer(r'function submitBid', content):
    start = max(0, m.start() - 5)
    end = min(len(content), m.end() + 60)
    print(f"At {m.start()}: ...{repr(content[start:end])}...")
    print()
