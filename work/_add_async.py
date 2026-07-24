import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

# Add async to submitBid
old = "function submitBid(){\nsaveCurrentSpecSilent();"
new = "async function submitBid(){\nsaveCurrentSpecSilent();"
text = text.replace(old, new)
print(f"Replaced: {old in text} -> found")

with open(path, "wb") as f:
    f.write(text.encode("utf-8", errors="surrogateescape"))

print("Done")
