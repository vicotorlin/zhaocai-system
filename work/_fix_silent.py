import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

# Direct fix: add saveCurrentSpecSilent call
old = "async function submitBid(){\nvar items=collectBidItems();"
new = "async function submitBid(){\nsaveCurrentSpecSilent();\nvar items=collectBidItems();"

if old in text:
    text = text.replace(old, new)
    print("Fixed: added saveCurrentSpecSilent")
else:
    print("Old pattern not found, searching...")
    idx = text.find("async function submitBid(){")
    if idx >= 0:
        snippet = text[idx:idx+80]
        print(repr(snippet))

with open(path, "wb") as f:
    f.write(text.encode("utf-8"))

print("Done")
