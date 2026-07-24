import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

for m in re.finditer(r'sync function submitBid', content):
    print(f"At {m.start()}: ...{repr(content[m.start()-15:m.end()+50])}...")
