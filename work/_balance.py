import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
js = '\n'.join(scripts)

# Count braces
opens = js.count('{')
closes = js.count('}')
print(f"Braces: {{ = {opens}, }} = {closes}, diff = {opens - closes}")

opens_p = js.count('(')
closes_p = js.count(')')
print(f"Parens: ( = {opens_p}, ) = {closes_p}, diff = {opens_p - closes_p}")

opens_b = js.count('[')
closes_b = js.count(']')
print(f"Brackets: [ = {opens_b}, ] = {closes_b}, diff = {opens_b - closes_b}")

# Check the init at the end
init_idx = js.find('(function init()')
if init_idx >= 0:
    print(f"init found at {init_idx}")
    # Find the matching closing
    depth = 0
    for i in range(init_idx, len(js)):
        if js[i] == '(': depth += 1
        elif js[i] == ')': 
            depth -= 1
            if depth == 0:
                print(f"init closes at {i}")
                print(js[i-5:i+10])
                break

# Check for the final })(); 
end_idx = js.rfind('})();')
print(f"Final }})(); at: {end_idx}")
if end_idx >= 0:
    print(js[end_idx-20:end_idx+10])
