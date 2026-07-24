import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

# Find submitBid and extract exact text between function name and specs:[]
idx_start = text.find("function submitBid(){")
idx_specs = text.find("specs:", idx_start)
print(f"submitBid: {idx_start} to {idx_specs}")

# Get the exact text
exact = text[idx_start:idx_specs + 10]
print("Exact text:")
print(repr(exact))

# Now get from specs: to the end of the line
line_end = text.find("\n", idx_specs)
exact2 = text[idx_specs:line_end]
print("\nSpecs line:")
print(repr(exact2))
