import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

# Read as bytes to avoid any encoding issues
with open(path, "rb") as f:
    raw = f.read()

print(f"File size: {len(raw)}")

# Check for HTML validity
text = raw.decode("utf-8", errors="replace")

# Check basic HTML structure
for tag in ["<html", "</html>", "<body>", "</body>", "<script>", "</script>"]:
    count = text.count(tag)
    print(f"  {tag}: {count}")

# Check for any stray characters that might break the page
# Look for the script opening
script_open = text.find("<script>")
script_close = text.find("</script>", script_open)
print(f"Script block: {script_open} to {script_close}, length: {script_close - script_open}")

# Check for any </script> inside the script (would break)
inside_script = text[script_open:script_close]
if "</script" in inside_script.lower():
    print("WARNING: </script> found inside script block!")
else:
    print("No nested </script> - OK")
