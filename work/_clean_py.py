import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

# Read binary, decode
with open(path, "rb") as f:
    raw = f.read()
text = raw.decode("utf-8")
print(f"Read {len(text)} chars")

# --- Change 1: Spec name input ---
old1 = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">\u20bf\ufe0f \u8d39\u7528\u62c6\u5206</h4>'
if old1 not in text:
    # Try without emoji variant
    old1 = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">\U0001f4b0 \u8d39\u7528\u62c6\u5206</h4>'
if old1 not in text:
    # Find it dynamically
    idx = text.find('\u8d39\u7528\u62c6\u5206')
    if idx >= 0:
        # Find the h4 tag
        h4_start = text.rfind('<h4', 0, idx)
        h4_end = text.find('</h4>', idx) + 5
        old1 = text[h4_start:h4_end]
        print(f"Found cost h4: {repr(old1)}")
    else:
        print("ERROR: cannot find cost header")
        sys.exit(1)

new1 = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">\u89c4\u683c\u540d\u79f0</label><input id="bidSpecName" placeholder="\u5982\uff1a1.5\u7c73\u5e8a / 1.8\u7c73\u5e8a" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n' + old1
text = text.replace(old1, new1, 1)
print("1. Spec name input added")

# --- Change 2: Add "新增规格" button ---
old2 = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button>'
new2 = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button> <button onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ \u65b0\u589e\u89c4\u683c</button>'
text = text.replace(old2, new2)
print("2. Button added")

# --- Change 3: Saved specs area ---
old3 = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">\u672a\u9009\u62e9\u6587\u4ef6</div>'
new3 = old3 + '\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">\u5df2\u4fdd\u5b58\u89c4\u683c</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'
text = text.replace(old3, new3)
print("3. Saved specs area added")

# --- Change 4: Add specs to submitBid WITHOUT rewriting the whole function ---
# Just change submitBid to: a) save current spec, b) use savedSpecs for data

# Add async + saveCurrentSpecSilent call
old4 = 'function submitBid(){\nvar items=collectBidItems();'
new4 = 'async function submitBid(){\nsaveCurrentSpecSilent();\nvar items=collectBidItems();'
text = text.replace(old4, new4)
print("4a. submitBid: async + saveCurrentSpecSilent")

# Change specs:[] to specs:savedSpecs
text = text.replace('specs:[],', 'specs:savedSpecs,')
print("4b. submitBid: specs:savedSpecs")

# Change total
old_total = 'total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,'
new_total = 'total:savedSpecs.reduce(function(s,sp){var m=sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0);return s+m+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),'
text = text.replace(old_total, new_total)
print("4c. submitBid: total")

# Change costs
text = text.replace('laborCost:Number(document.getElementById("bidLabor").value)||0,', 'laborCost:savedSpecs.reduce(function(s,sp){return s+(sp.laborCost||0);},0),')
text = text.replace('manufacturingCost:Number(document.getElementById("bidMfg").value)||0,', 'manufacturingCost:savedSpecs.reduce(function(s,sp){return s+(sp.manufacturingCost||0);},0),')
text = text.replace('adminCost:Number(document.getElementById("bidAdmin").value)||0,', 'adminCost:savedSpecs.reduce(function(s,sp){return s+(sp.adminCost||0);},0),')
text = text.replace('profit:Number(document.getElementById("bidProfit").value)||0,', 'profit:savedSpecs.reduce(function(s,sp){return s+(sp.profit||0);},0),')
text = text.replace('tax:Number(document.getElementById("bidTax").value)||0,', 'tax:savedSpecs.reduce(function(s,sp){return s+(sp.tax||0);},0),')
print("4d. submitBid: costs")

# --- Change 5: Add helper functions before submitBid ---
helpers = """
// ===== Spec management =====
var savedSpecs=[];
function saveCurrentSpec(){
saveCurrentSpecSilent();
var el=document.getElementById("bidSpecName");if(el)el.value="";
var tb=document.getElementById("bidItemsBody");if(tb)tb.innerHTML="";
["bidLabor","bidMfg","bidAdmin","bidProfit","bidTax"].forEach(function(id){var e=document.getElementById(id);if(e)e.value="0";});
var mc=document.getElementById("bidMaterialCost");if(mc)mc.value="0";
addBidItem();
calcBidTotal();
renderSavedSpecs();
toast("\u89c4\u683c\u5df2\u4fdd\u5b58","success");
}
function saveCurrentSpecSilent(){
var items=collectBidItems();
if(!items||items.length===0)return;
var el=document.getElementById("bidSpecName");
var nm=el&&el.value?el.value:("\u89c4\u683c"+(savedSpecs.length+1));
savedSpecs.push({
name:nm,items:items,
laborCost:Number((document.getElementById("bidLabor")||{}).value)||0,
manufacturingCost:Number((document.getElementById("bidMfg")||{}).value)||0,
adminCost:Number((document.getElementById("bidAdmin")||{}).value)||0,
profit:Number((document.getElementById("bidProfit")||{}).value)||0,
tax:Number((document.getElementById("bidTax")||{}).value)||0
});
}
function renderSavedSpecs(){
var a=document.getElementById("savedSpecsArea");
var l=document.getElementById("savedSpecsList");
if(!a||!l)return;
if(savedSpecs.length===0){a.style.display="none";return;}
a.style.display="block";
l.innerHTML=savedSpecs.map(function(sp,i){
var s=sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0);
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'\u9879, \\u00a5'+s.toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">\\u2715</span></div>';
}).join("");
}
"""

idx = text.find("async function submitBid(){")
if idx > 0:
    text = text[:idx] + helpers + text[idx:]
    print("5. Helpers inserted")
else:
    print("5. ERROR: async function submitBid not found")

# --- Change 6: Clear specs in openBidForm ---
old6 = 'bidFiles=[];\ndocument.getElementById("bidAttachmentList")'
new6 = 'bidFiles=[];savedSpecs=[];var sa=document.getElementById("savedSpecsArea");if(sa)sa.style.display="none";\ndocument.getElementById("bidAttachmentList")'
text = text.replace(old6, new6)
print("6. openBidForm updated")

# Write binary
with open(path, "wb") as f:
    f.write(text.encode("utf-8"))

# Verify
print(f"\nFile size: {len(text)}")
for c in ["bidSpecName", "saveCurrentSpec", "savedSpecsArea", "async function submitBid"]:
    print(f"  {c}: {'OK' if c in text else 'MISSING'}")
