import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the key marker
marker = "currentQuoteData.forEach(function(q){"
idx = content.find(marker)
print(f"First marker at: {idx}")

# Find the spec section's currentQuoteData.forEach
# The section we want starts at the one inside allSpecNames.forEach
all_spec_names = "allSpecNames.forEach(function(specName){"
idx_spec_start = content.find(all_spec_names)
print(f"allSpecNames.forEach at: {idx_spec_start}")

# Find the target code block
# The code to replace is inside allSpecNames.forEach, starting at the currentQuoteData.forEach
# that has mCost calculation + table row building

# Let me find the pattern more precisely
target_start = "    currentQuoteData.forEach(function(q){"
# This should have 4 spaces indent inside allSpecNames.forEach

idx_target = content.find(target_start, idx_spec_start)
print(f"Target at: {idx_target}")

if idx_target > 0:
    # Show the block
    block = content[idx_target:idx_target+800]
    print("=== Block ===")
    print(repr(block[:600]))
    print()
else:
    # Try different indentation
    for indent in [0, 2, 4, 6, 8]:
        ts = " " * indent + "currentQuoteData.forEach(function(q){"
        i = content.find(ts, idx_spec_start)
        if i > 0:
            print(f"Found with {indent} spaces at {i}")
            print(repr(content[i:i+600]))
            break
