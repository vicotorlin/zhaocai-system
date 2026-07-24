import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the cost header
idx = content.find("费用拆分")
if idx >= 0:
    chunk = content[idx-50:idx+80]
    print(f"Found at {idx}:")
    print(repr(chunk))
else:
    print("NOT FOUND with direct search")
    # Try with encoded bytes
    with open(path, "rb") as f:
        raw = f.read()
    marker = "费用拆分".encode("utf-8")
    bidx = raw.find(marker)
    print(f"Raw found at: {bidx}")
    if bidx >= 0:
        print(repr(raw[bidx-50:bidx+80]))

# Check for surrogates
print(f"\nContent length: {len(content)}")
surrogate_count = 0
for i, ch in enumerate(content):
    if '\uD800' <= ch <= '\uDFFF':
        surrogate_count += 1
        if surrogate_count <= 5:
            print(f"Surrogate at {i}: U+{ord(ch):04X}")
print(f"Total surrogates: {surrogate_count}")
