import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

with open(path, "rb") as f:
    raw = f.read()

text = raw.decode("utf-8", errors="replace")
print(f"Size: {len(text)}")

changes = 0

# === 1. Add spec name input ===
old1 = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">💰 费用拆分</h4>'
new1 = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">规格名称</label><input id="bidSpecName" placeholder="如：1.5米床 / 1.8米床" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n' + old1
text = text.replace(old1, new1, 1)
changes += 1
print("1. Added spec name input")

# === 2. Add "新增规格" button ===
old2 = 'onclick="addBidItem()">+ 添加物料</button>'
new2 = 'onclick="addBidItem()">+ 添加物料</button> <button class="btn btn-sm" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px" onclick="saveCurrentSpec()">+ 新增规格</button>'
text = text.replace(old2, new2)
changes += 1
print("2. Added new spec button")

# === 3. Add saved specs area ===
old3 = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">未选择文件</div>'
new3 = old3 + '\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">已保存规格</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'
text = text.replace(old3, new3)
changes += 1
print("3. Added saved specs area")

# === 4. Replace submitBid ===
old4_start = text.find("function submitBid(){")
old4_specs = text.find("specs:[],", old4_start)
old4_tail_start = text.find("total:Number(", old4_start)
old4_tail_end = text.find(",\ncategory:", old4_start)

# Extract sections
submit_prefix = text[:old4_start]
submit_middle = text[old4_specs + 10:old4_tail_start]  # text between specs:[] and total:Number(
submit_suffix = text[old4_tail_end:]  # text from ,\ncategory: onward

new_submit = """async function submitBid(){
saveCurrentSpecSilent();
var allSpecs=getAllSpecs();
var allItems=[];
var totalLabor=0,totalMfg=0,totalAdmin=0,totalProfit=0,totalTax=0;
allSpecs.forEach(function(sp){
sp.items.forEach(function(it){allItems.push(it);});
totalLabor+=sp.laborCost||0;
totalMfg+=sp.manufacturingCost||0;
totalAdmin+=sp.adminCost||0;
totalProfit+=sp.profit||0;
totalTax+=sp.tax||0;
});
if(allSpecs.length===0||allItems.length===0)return toast("请至少添加一个规格并添加物料","error");
var supplierName=document.getElementById("bidSupplierName").value;
if(!supplierName)return toast("请输入供应商名称","error");
var materialCost=0;
var uploadedFiles=[];
if(bidFiles.length>0){uploadedFiles=await uploadBidFiles();}
var body={
projectId:currentBidProjectId,
supplierAccount:USER.account,
supplierName:supplierName,
items:allItems,
specs:allSpecs,
attachments:uploadedFiles,
total:allSpecs.reduce(function(s,sp){return s+sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0)+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),
laborCost:totalLabor,
manufacturingCost:totalMfg,
adminCost:totalAdmin,
profit:totalProfit,
tax:totalTax"""

text = submit_prefix + new_submit + submit_middle + submit_suffix
changes += 1
print("4. Replaced submitBid")

# === 5. Add helper functions before submitBid ===
helpers = """

// ===== Spec management =====
var savedSpecs=[];
function saveCurrentSpec(){
try{
saveCurrentSpecSilent();
var el=document.getElementById("bidSpecName");if(el)el.value="";
var tb=document.getElementById("bidItemsBody");if(tb)tb.innerHTML="";
var inputs=["bidLabor","bidMfg","bidAdmin","bidProfit","bidTax"];
inputs.forEach(function(id){var e=document.getElementById(id);if(e)e.value="0";});
var mc=document.getElementById("bidMaterialCost");if(mc)mc.value="0";
addBidItem();
calcBidTotal();
renderSavedSpecs();
toast("规格已保存，请继续添加下一个规格","success");
}catch(e){alert("保存规格失败: "+e.message);}
}
function saveCurrentSpecSilent(){
try{
var items=collectBidItems();
if(items.length===0)return;
var el=document.getElementById("bidSpecName");
var specName=el&&el.value?el.value:("规格"+(savedSpecs.length+1));
savedSpecs.push({
name:specName,
items:items,
laborCost:Number((document.getElementById("bidLabor")||{}).value)||0,
manufacturingCost:Number((document.getElementById("bidMfg")||{}).value)||0,
adminCost:Number((document.getElementById("bidAdmin")||{}).value)||0,
profit:Number((document.getElementById("bidProfit")||{}).value)||0,
tax:Number((document.getElementById("bidTax")||{}).value)||0
});
}catch(e){console.error(e);}
}
function getAllSpecs(){
try{saveCurrentSpecSilent();}catch(e){}
return savedSpecs;
}
function renderSavedSpecs(){
try{
var area=document.getElementById("savedSpecsArea");
var list=document.getElementById("savedSpecsList");
if(!area||!list)return;
if(savedSpecs.length===0){area.style.display="none";return;}
area.style.display="block";
list.innerHTML=savedSpecs.map(function(sp,i){
var matSum=sp.items.reduce(function(s,it){return s+(Number(it.subtotal)||0);},0);
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'项物料, ¥'+matSum.toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">✕</span></div>';
}).join("");
}catch(e){console.error(e);}
}
"""

idx5 = text.find("function submitBid(){")
# After replacement it's now "async function submitBid(){"
idx5 = text.find("async function submitBid(){")
if idx5 > 0:
    text = text[:idx5] + helpers + text[idx5:]
    changes += 1
    print("5. Added helper functions")
else:
    print("5. FAILED: submitBid not found")

# === 6. Clear specs in openBidForm ===
old6 = 'bidFiles=[];\ndocument.getElementById("bidAttachmentList")'
new6 = 'bidFiles=[];savedSpecs=[];\nvar sa=document.getElementById("savedSpecsArea");if(sa)sa.style.display="none";\ndocument.getElementById("bidAttachmentList")'
text = text.replace(old6, new6)
changes += 1
print("6. Modified openBidForm")

# Final: ensure all changes are present
checks = ["bidSpecName", "saveCurrentSpec", "savedSpecsArea", "allSpecs", "getAllSpecs"]
for c in checks:
    if c in text:
        print(f"  {c}: OK")
    else:
        print(f"  {c}: MISSING!")

with open(path, "wb") as f:
    f.write(text.encode("utf-8"))

print(f"\nDone. {changes} changes. Size: {len(text)}")
