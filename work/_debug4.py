import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

# Read with surrogate handling
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

print(f"Content length: {len(content)}")

# Check for surrogates
surrogate_count = 0
for i, ch in enumerate(content):
    if '\uD800' <= ch <= '\uDFFF':
        surrogate_count += 1
        if surrogate_count <= 5:
            print(f"Surrogate at {i}: U+{ord(ch):04X}")
print(f"Total surrogates: {surrogate_count}")
