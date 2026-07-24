import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

# Find submitBid
idx = text.find("function submitBid")
if idx >= 0:
    # Show exact text with repr
    chunk = text[idx:idx+80]
    print(f"Found at {idx}:")
    print(repr(chunk))
    print()
    # Show more
    chunk2 = text[idx:idx+400]
    print("Full start:")
    print(chunk2[:400])
else:
    print("NOT FOUND")
