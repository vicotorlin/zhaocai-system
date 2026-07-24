import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

changes = 0

# === 1. Spec name input ===
old = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">💰 费用拆分</h4>'
new = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">规格名称</label><input id="bidSpecName" placeholder="如：1.5米床 / 1.8米床" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n' + old
text = text.replace(old, new, 1)
changes += 1
print("1. Spec name input")

# === 2. Add "新增规格" button ===
old2 = 'onclick="addBidItem()">+ 添加物料</button>'
new2 = 'onclick="addBidItem()">+ 添加物料</button> <button onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ 新增规格</button>'
text = text.replace(old2, new2)
changes += 1
print("2. New spec button")

# === 3. Saved specs area ===
old3 = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">未选择文件</div>'
new3 = old3 + '\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">已保存规格</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'
text = text.replace(old3, new3)
changes += 1
print("3. Saved specs area")

# === 4. Add helper JS functions ===
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
toast("规格已保存","success");
}
function saveCurrentSpecSilent(){
var items=collectBidItems();
if(!items||items.length===0)return;
var el=document.getElementById("bidSpecName");
var nm=el&&el.value?el.value:("规格"+(savedSpecs.length+1));
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
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'项, ¥'+s.toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">✕</span></div>';
}).join("");
}
"""

submit_marker = "function submitBid(){"
idx = text.find(submit_marker)
if idx > 0:
    text = text[:idx] + helpers + text[idx:]
    changes += 1
    print("4. Helper functions")
else:
    print("4. FAILED")

# === 5. Modify submitBid: change specs:[] to include saved specs ===
# First add saveCurrentSpecSilent() call at the start
old5 = "function submitBid(){\nvar items=collectBidItems();"
new5 = "function submitBid(){\nsaveCurrentSpecSilent();\nvar items=collectBidItems();"
text = text.replace(old5, new5)
changes += 1
print("5. submitBid: add saveCurrentSpecSilent")

# Change specs:[] to use savedSpecs
old5b = "specs:[],"
new5b = "specs:savedSpecs,"
text = text.replace(old5b, new5b)
changes += 1
print("5b. submitBid: specs:savedSpecs")

# Fix total - use sum of all specs
old5c = 'total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,'
new5c = 'total:savedSpecs.reduce(function(s,sp){var m=sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0);return s+m+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),'
text = text.replace(old5c, new5c)
changes += 1
print("5c. submitBid: total from specs")

# Fix laborCost etc to use sum from specs
old5d = 'laborCost:Number(document.getElementById("bidLabor").value)||0,'
new5d = 'laborCost:savedSpecs.reduce(function(s,sp){return s+(sp.laborCost||0);},0),'
text = text.replace(old5d, new5d)
changes += 1
print("5d. submitBid: laborCost")

old5e = 'manufacturingCost:Number(document.getElementById("bidMfg").value)||0,'
new5e = 'manufacturingCost:savedSpecs.reduce(function(s,sp){return s+(sp.manufacturingCost||0);},0),'
text = text.replace(old5e, new5e)
changes += 1
print("5e. submitBid: manufacturingCost")

old5f = 'adminCost:Number(document.getElementById("bidAdmin").value)||0,'
new5f = 'adminCost:savedSpecs.reduce(function(s,sp){return s+(sp.adminCost||0);},0),'
text = text.replace(old5f, new5f)
changes += 1
print("5f. submitBid: adminCost")

old5g = 'profit:Number(document.getElementById("bidProfit").value)||0,'
new5g = 'profit:savedSpecs.reduce(function(s,sp){return s+(sp.profit||0);},0),'
text = text.replace(old5g, new5g)
changes += 1
print("5g. submitBid: profit")

old5h = 'tax:Number(document.getElementById("bidTax").value)||0,'
new5h = 'tax:savedSpecs.reduce(function(s,sp){return s+(sp.tax||0);},0),'
text = text.replace(old5h, new5h)
changes += 1
print("5h. submitBid: tax")

# === 6. Clear savedSpecs in openBidForm ===
old6 = 'bidFiles=[];\ndocument.getElementById("bidAttachmentList")'
new6 = 'bidFiles=[];savedSpecs=[];var sa=document.getElementById("savedSpecsArea");if(sa)sa.style.display="none";\ndocument.getElementById("bidAttachmentList")'
text = text.replace(old6, new6)
changes += 1
print("6. openBidForm: clear specs")

# Verify
checks = ["bidSpecName", "saveCurrentSpec", "savedSpecsArea", "savedSpecs"]
for c in checks:
    if c in text:
        print(f"  {c}: OK")
    else:
        print(f"  {c}: MISSING!")

with open(path, "wb") as f:
    f.write(text.encode("utf-8", errors="surrogateescape"))

print(f"\nTotal: {changes} changes")
