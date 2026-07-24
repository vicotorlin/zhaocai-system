import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

with open(path, "rb") as f:
    raw = f.read()

text = raw.decode("utf-8")

changes = 0

# 1. Add spec name input above cost breakdown
old = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">💰 费用拆分</h4>'
new = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">规格名称</label><input id="bidSpecName" placeholder="如：1.5米床 / 1.8米床" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n' + old

cnt = text.count(old)
print(f"1. Cost header: {cnt}")
if cnt > 0:
    text = text.replace(old, new, 1)  # Only first occurrence
    changes += 1

# 2. Add "新增规格" button next to "添加物料"
old2 = 'onclick="addBidItem()">+ 添加物料</button>'
new2 = 'onclick="addBidItem()">+ 添加物料</button> <button onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ 新增规格</button>'
cnt2 = text.count(old2)
print(f"2. Add item button: {cnt2}")
if cnt2 > 0:
    text = text.replace(old2, new2)
    changes += 1

# 3. Add saved specs area
old3 = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">未选择文件</div>'
new3 = old3 + '\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">已保存规格</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'
cnt3 = text.count(old3)
print(f"3. Attachment area: {cnt3}")
if cnt3 > 0:
    text = text.replace(old3, new3)
    changes += 1

# 4. Modify submitBid
old4 = """function submitBid(){
var items=collectBidItems();
if(items.length===0)return toast("请至少添加一个物料","error");
var supplierName=document.getElementById("bidSupplierName").value;
if(!supplierName)return toast("请输入供应商名称","error");
var materialCost=Number(document.getElementById("bidMaterialCost").value)||0;
var uploadedFiles=[];
if(bidFiles.length>0){uploadedFiles=await uploadBidFiles();}
var body={
projectId:currentBidProjectId,
supplierAccount:USER.account,
supplierName:supplierName,
items:items,
specs:[],
attachments:uploadedFiles,"""

new4 = """async function submitBid(){
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
var uploadedFiles=[];
if(bidFiles.length>0){uploadedFiles=await uploadBidFiles();}
var body={
projectId:currentBidProjectId,
supplierAccount:USER.account,
supplierName:supplierName,
items:allItems,
specs:allSpecs,
attachments:uploadedFiles,"""

cnt4 = text.count(old4)
print(f"4. submitBid start: {cnt4}")
if cnt4 > 0:
    text = text.replace(old4, new4)
    changes += 1
else:
    print("   FAILED - trying without async")
    old4b = """function submitBid(){
var items=collectBidItems();"""
    if text.count(old4b) > 0:
        print("   Found submitBid with different format")

# 4b. Fix total calculation  
old4b = """total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,
laborCost:Number(document.getElementById("bidLabor").value)||0,
manufacturingCost:Number(document.getElementById("bidMfg").value)||0,
adminCost:Number(document.getElementById("bidAdmin").value)||0,
profit:Number(document.getElementById("bidProfit").value)||0,
tax:Number(document.getElementById("bidTax").value)||0,"""

new4b = """total:allSpecs.reduce(function(s,sp){return s+sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0)+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),
laborCost:totalLabor,
manufacturingCost:totalMfg,
adminCost:totalAdmin,
profit:totalProfit,
tax:totalTax,"""

cnt4b = text.count(old4b)
print(f"4b. submitBid tail: {cnt4b}")
if cnt4b > 0:
    text = text.replace(old4b, new4b)
    changes += 1

# 5. Add spec management helpers before submitBid
helpers = """

// ===== Spec management =====
var savedSpecs=[];
function saveCurrentSpec(){
saveCurrentSpecSilent();
document.getElementById("bidSpecName").value="";
document.getElementById("bidItemsBody").innerHTML="";
document.getElementById("bidLabor").value="0";
document.getElementById("bidMfg").value="0";
document.getElementById("bidAdmin").value="0";
document.getElementById("bidProfit").value="0";
document.getElementById("bidTax").value="0";
document.getElementById("bidMaterialCost").value="0";
addBidItem();
calcBidTotal();
renderSavedSpecs();
toast("规格已保存，请继续添加下一个规格","success");
}
function saveCurrentSpecSilent(){
var items=collectBidItems();
if(items.length===0)return;
var specName=document.getElementById("bidSpecName").value||("规格"+(savedSpecs.length+1));
savedSpecs.push({
name:specName,
items:items,
laborCost:Number(document.getElementById("bidLabor").value)||0,
manufacturingCost:Number(document.getElementById("bidMfg").value)||0,
adminCost:Number(document.getElementById("bidAdmin").value)||0,
profit:Number(document.getElementById("bidProfit").value)||0,
tax:Number(document.getElementById("bidTax").value)||0
});
}
function getAllSpecs(){
saveCurrentSpecSilent();
return savedSpecs;
}
function renderSavedSpecs(){
var area=document.getElementById("savedSpecsArea");
var list=document.getElementById("savedSpecsList");
if(savedSpecs.length===0){area.style.display="none";return;}
area.style.display="block";
list.innerHTML=savedSpecs.map(function(sp,i){
var matSum=sp.items.reduce(function(s,it){return s+(Number(it.subtotal)||0);},0);
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'项物料, \\u00a5'+matSum.toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">\\u2715</span></div>';
}).join("");
}
function clearAllSpecs(){
savedSpecs=[];
renderSavedSpecs();
}
"""

# Insert before submitBid
submit_marker = "function submitBid(){"
# After our replacement it's "async function submitBid(){"
if "async function submitBid(){" in text:
    submit_marker = "async function submitBid(){"
    
idx5 = text.find(submit_marker)
if idx5 > 0:
    text = text[:idx5] + helpers + text[idx5:]
    changes += 1
    print(f"5. Added helpers at {idx5}")
else:
    print("5. FAILED - submitBid not found")

# 6. Modify openBidForm to clear specs
old6 = 'bidFiles=[];'
new6 = 'bidFiles=[];savedSpecs=[];var sa=document.getElementById("savedSpecsArea");if(sa)sa.style.display="none";'
cnt6 = text.count(old6)
print(f"6. openBidForm bidFiles: {cnt6}")
if cnt6 > 0:
    text = text.replace(old6, new6, 1)  # Only first occurrence (in openBidForm)
    changes += 1

# Write back as bytes
with open(path, "wb") as f:
    f.write(text.encode("utf-8"))

print(f"\nTotal changes: {changes}")
print(f"New file size: {len(text.encode('utf-8'))}")
