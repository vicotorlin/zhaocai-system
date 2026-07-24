import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Find collectBidItems
idx = content.find("function collectBidItems")
if idx >= 0:
    # Find closing brace
    depth = 0
    end = idx
    for i in range(idx, len(content)):
        if content[i] == '{': depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    print("collectBidItems:")
    print(content[idx:end])
else:
    print("collectBidItems NOT FOUND")

# Check all called functions
funcs = ["saveCurrentSpec", "saveCurrentSpecSilent", "getAllSpecs", "collectBidItems", "addBidItem", "calcBidTotal", "renderSavedSpecs", "toast", "renderTableHead", "switchMaterialTable", "closeModal", "loadSupplierProjects", "uploadBidFiles"]
print("\nFunction checks:")
for f in funcs:
    if f"function {f}(" in content:
        print(f"  {f}: OK")
    else:
        print(f"  {f}: MISSING")

# Check for any other issues in saveCurrentSpec
idx2 = content.find("function saveCurrentSpec(){")
if idx2 >= 0:
    depth = 0
    end2 = idx2
    for i in range(idx2, len(content)):
        if content[i] == '{': depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end2 = i + 1
                break
    print(f"\nsaveCurrentSpec at {idx2}:")
    print(content[idx2:end2])
