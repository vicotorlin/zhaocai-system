import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Simplify: make the button use the global saveCurrentSpec directly with debug
# Actually, let me check if saveCurrentSpec is defined in the global scope
idx = content.find("function saveCurrentSpec(){")
print(f"saveCurrentSpec at: {idx}")

# Check if it's inside or outside the script block
script_start = content.find("<script>")
script_end = content.find("</script>", script_start)
print(f"Script: {script_start} to {script_end}")
print(f"Function inside script: {idx > script_start and idx < script_end}")

# Also check for another saveCurrentSpec definition (duplicates would cause issues)
count = content.count("function saveCurrentSpec(){")
print(f"saveCurrentSpec defined {count} times")
