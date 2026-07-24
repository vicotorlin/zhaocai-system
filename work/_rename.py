import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Rename the helper functions to avoid any conflicts
# Change saveCurrentSpec -> saveCurrentSpecFn
old1 = "function saveCurrentSpec(){"
new1 = "function saveCurrentSpecFn(){"
content = content.replace(old1, new1)

old2 = "function saveCurrentSpecSilent(){"
new2 = "function saveCurrentSpecSilentFn(){"
content = content.replace(old2, new2)

old3 = "function getAllSpecs(){"
new3 = "function getAllSpecsFn(){"
content = content.replace(old3, new3)

old4 = "function renderSavedSpecs(){"
new4 = "function renderSavedSpecsFn(){"
content = content.replace(old4, new4)

# Update internal references
content = content.replace("saveCurrentSpecSilent()", "saveCurrentSpecSilentFn()")
content = content.replace("getAllSpecs()", "getAllSpecsFn()")
content = content.replace("renderSavedSpecs()", "renderSavedSpecsFn()")

# Now redefine saveCurrentSpec as a simple wrapper that calls saveCurrentSpecFn
# and also define saveCurrentSpecSilent, getAllSpecs, renderSavedSpecs as wrappers
wrappers = """
function saveCurrentSpec(){ try{saveCurrentSpecFn();}catch(e){alert("保存失败: "+e.message);} }
function saveCurrentSpecSilent(){ try{saveCurrentSpecSilentFn();}catch(e){console.error(e);} }
function getAllSpecs(){ try{return getAllSpecsFn();}catch(e){console.error(e);return[];} }
function renderSavedSpecs(){ try{renderSavedSpecsFn();}catch(e){console.error(e);} }
"""

# Insert wrappers after the original definitions
idx = content.find("function renderSavedSpecsFn(){")
if idx >= 0:
    # Find end of this function
    depth = 0
    end = idx
    for i in range(idx, len(content)):
        if content[i] == '{': depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    content = content[:end] + wrappers + content[end:]
    print("Added wrapper functions at", end)
else:
    print("renderSavedSpecsFn not found")

with open(path, "wb") as f:
    f.write(content.encode("utf-8", errors="surrogateescape"))

print("Done")
