import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Check critical functions
funcs = ["buildSidebar", "switchView", "loadSupplierProjects", "loadBuyerProjects", "loadReviewerProjects", "api", "toast", "closeModal", "init"]
for f in funcs:
    count = content.count(f"function {f}(")
    print(f"  function {f}: {count} occurrences")

# Check for renderProjectList
count = content.count("function renderProjectList")
print(f"  function renderProjectList: {count}")

# Check the script open/close
print(f"\n  <script>: {content.count('<script>')}")
print(f"  </script>: {content.count('</script>')}")

# Check for any malformed script tags
import re
script_opens = list(re.finditer(r'<script[^>]*>', content))
script_closes = list(re.finditer(r'</script>', content))
print(f"  Script opens: {len(script_opens)}, closes: {len(script_closes)}")
for so in script_opens:
    print(f"    Open at {so.start()}: {content[so.start():so.end()]}")
for sc in script_closes:
    print(f"    Close at {sc.start()}")

# Check if any </script> appears inside a script block
for so in script_opens:
    so_end = so.end()
    # Find the next script close after this open
    for sc in script_closes:
        if sc.start() > so_end:
            js_block = content[so_end:sc.start()]
            if '</script' in js_block.lower():
                print(f"  WARNING: </script> inside script block at {so.start()}-{sc.start()}")
            break
