import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Make backup
with open(path + ".spec_bak", "w", encoding="utf-8") as f:
    f.write(content)

changes = 0

# === 1. Add spec name input ABOVE cost breakdown in the HTML ===
old_cost_header = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">\u8d39\u7528\u62c6\u5206</h4>'
new_cost_header = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">\u89c4\u683c\u540d\u79f0</label><input id="bidSpecName" placeholder="\u5982\uff1a1.5\u7c73\u5e8a / 1.8\u7c73\u5e8a" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n<h4 style="margin:0 0 8px;font-size:14px;color:#333">\u8d39\u7528\u62c6\u5206</h4>'

if content.count(old_cost_header) > 0:
    content = content.replace(old_cost_header, new_cost_header)
    changes += 1
    print("1. Added spec name input above cost breakdown")
else:
    print("1. FAILED: cost header not found")

# === 2. Add "新增规格" button below "添加物料" button ===
old_add_item = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button>'
new_add_item = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button> <button onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ \u65b0\u589e\u89c4\u683c</button>'

if content.count(old_add_item) > 0:
    content = content.replace(old_add_item, new_add_item)
    changes += 1
    print("2. Added new spec button next to add item button")
else:
    print("2. FAILED: add item button not found")

# === 3. Add saved specs display area before submit button ===
old_submit_area = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">\u672a\u9009\u62e9\u6587\u4ef6</div>'
new_submit_area = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">\u672a\u9009\u62e9\u6587\u4ef6</div>\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">\ud83d\udccc \u5df2\u4fdd\u5b58\u89c4\u683c</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'

if content.count(old_submit_area) > 0:
    content = content.replace(old_submit_area, new_submit_area)
    changes += 1
    print("3. Added saved specs display area")
else:
    print("3. FAILED: submit area not found")

# === 4. Modify submitBid to collect specs ===
old_submit = """function submitBid(){
var items=collectBidItems();
if(items.length===0)return toast("\u8bf7\u81f3\u5c11\u6dfb\u52a0\u4e00\u4e2a\u7269\u6599","error");
var supplierName=document.getElementById("bidSupplierName").value;
if(!supplierName)return toast("\u8bf7\u8f93\u5165\u4f9b\u5e94\u5546\u540d\u79f0","error");
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

new_submit = """function submitBid(){
// Save current spec before submitting
saveCurrentSpecSilent();
var allSpecs=getAllSpecs();
var allItems=[];
var totalLabor=0,totalMfg=0,totalAdmin=0,totalProfit=0,totalTax=0,totalMat=0;
allSpecs.forEach(function(sp){
sp.items.forEach(function(it){allItems.push(it);});
totalLabor+=sp.laborCost||0;
totalMfg+=sp.manufacturingCost||0;
totalAdmin+=sp.adminCost||0;
totalProfit+=sp.profit||0;
totalTax+=sp.tax||0;
});
if(allSpecs.length===0||allItems.length===0)return toast("\u8bf7\u81f3\u5c11\u6dfb\u52a0\u4e00\u4e2a\u89c4\u683c\u5e76\u6dfb\u52a0\u7269\u6599","error");
var supplierName=document.getElementById("bidSupplierName").value;
if(!supplierName)return toast("\u8bf7\u8f93\u5165\u4f9b\u5e94\u5546\u540d\u79f0","error");
var uploadedFiles=[];
if(bidFiles.length>0){uploadedFiles=await uploadBidFiles();}
var body={
projectId:currentBidProjectId,
supplierAccount:USER.account,
supplierName:supplierName,
items:allItems,
specs:allSpecs,
attachments:uploadedFiles,"""

# Find the submitBid function
idx = content.find(old_submit)
if idx < 0:
    # Try to find a unique marker
    idx = content.find("function submitBid(){")
    if idx >= 0:
        print(f"  submitBid found at {idx}")
        print(f"  Context: {repr(content[idx:idx+100])}")
    print("4. FAILED: submitBid not found with exact match")
else:
    content = content[:idx] + new_submit + content[idx + len(old_submit):]
    changes += 1
    print("4. Modified submitBid to collect specs")

# === 4b. Fix the rest of submitBid (the total/laborCost lines) ===
old_submit_tail = """total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,
laborCost:Number(document.getElementById("bidLabor").value)||0,
manufacturingCost:Number(document.getElementById("bidMfg").value)||0,
adminCost:Number(document.getElementById("bidAdmin").value)||0,
profit:Number(document.getElementById("bidProfit").value)||0,
tax:Number(document.getElementById("bidTax").value)||0,"""

new_submit_tail = """total:totalLabor+totalMfg+totalAdmin+totalProfit+totalTax+allItems.reduce(function(s,it){return s+(Number(it.subtotal)||0);},0),
laborCost:totalLabor,
manufacturingCost:totalMfg,
adminCost:totalAdmin,
profit:totalProfit,
tax:totalTax,"""

cnt = content.count(old_submit_tail)
if cnt > 0:
    content = content.replace(old_submit_tail, new_submit_tail)
    changes += 1
    print("4b. Fixed submitBid total calculation")
else:
    print("4b. FAILED: submitBid tail not found")

# === 5. Add JS helper functions before submitBid ===
helper_functions = """
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
toast("\u89c4\u683c\u5df2\u4fdd\u5b58\uff0c\u8bf7\u7ee7\u7eed\u6dfb\u52a0\u4e0b\u4e00\u4e2a\u89c4\u683c","success");
}
function saveCurrentSpecSilent(){
var items=collectBidItems();
if(items.length===0)return;
var specName=document.getElementById("bidSpecName").value||("\u89c4\u683c"+(savedSpecs.length+1));
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
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'\u9879\u7269\u6599, \u00a5'+sp.items.reduce(function(s,it){return s+(Number(it.subtotal)||0);},0).toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">\u2715</span></div>';
}).join("");
}
function clearAllSpecs(){
savedSpecs=[];
renderSavedSpecs();
}
"""

# Insert before submitBid
submit_idx = content.find("function submitBid(){")
if submit_idx > 0:
    content = content[:submit_idx] + helper_functions + content[submit_idx:]
    changes += 1
    print("5. Added spec management helper functions")
else:
    print("5. FAILED: submitBid function location not found")

# === 6. Modify openBidForm to clear specs ===
old_open = 'bidFiles=[];'
new_open = 'bidFiles=[];savedSpecs=[];document.getElementById("savedSpecsArea").style.display="none";'
cnt = content.count(old_open)
if cnt > 0:
    content = content.replace(old_open, new_open)
    changes += 1
    print("6. Modified openBidForm to clear specs")
else:
    print("6. FAILED: openBidForm bidFiles not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal changes applied: {changes}")
