import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Extract JS
import re
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
js = '\n'.join(scripts)

# Check for common issues
issues = []

# 1. Check for unbalanced braces
open_count = js.count('{')
close_count = js.count('}')
if open_count != close_count:
    issues.append(f"Unbalanced braces: {{ = {open_count}, }} = {close_count}")

# 2. Check for unbalanced parens
open_p = js.count('(')
close_p = js.count(')')
if open_p != close_p:
    issues.append(f"Unbalanced parens: ( = {open_p}, ) = {close_p}")

# 3. Check if renderTableHead function exists and is accessible
if 'function renderTableHead' in js:
    issues.append("renderTableHead: OK")
else:
    issues.append("renderTableHead: MISSING")

# 4. Find any 'function' declarations to ensure they're properly formatted
funcs = re.findall(r'function\s+\w+', js)
issues.append(f"Functions found: {len(funcs)}")

for issue in issues:
    print(issue)

# 5. Check the area around submitBid for issues
idx = js.find('function submitBid')
if idx >= 0:
    snippet = js[idx:idx+500]
    # Check for any syntax-looking issues
    if snippet.count('{') != snippet.count('}'):
        print(f"submitBid has unbalanced braces in its snippet")
    print("submitBid snippet:")
    print(snippet[:300])
