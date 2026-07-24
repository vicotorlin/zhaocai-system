import sys, os
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"

# Read with surrogateescape to handle any bad chars
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

changes = 0

# === 1. Find cost header and add spec input above it ===
# Search using ASCII pattern
marker = 'style="margin:0 0 8px;font-size:14px;color:#333"'
idx = content.find(marker)
print(f"Cost header marker at: {idx}")

# Find the actual h4 tag
h4_start = content.rfind('<h4', 0, idx + len(marker))
h4_end = content.find('</h4>', h4_start) + 5
old_h4 = content[h4_start:h4_end]
print(f"H4 tag: {repr(old_h4)}")

# Only replace the first occurrence (the cost breakdown header)
spec_input_html = '''<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">规格名称</label><input id="bidSpecName" placeholder="如：1.5米床 / 1.8米床" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>
''' + old_h4

# Find which occurrence this is
first_occurrence = content.find(old_h4)
second_occurrence = content.find(old_h4, first_occurrence + 1)
print(f"First h4 at: {first_occurrence}, Second at: {second_occurrence}")

# The cost breakdown h4 is likely the first one after "费用拆分" context
# Let me check the context
ctx = content[first_occurrence-80:first_occurrence+len(old_h4)+80]
print(f"Context: {repr(ctx[:200])}")

# Replace the cost breakdown h4 with spec input + h4
content = content[:first_occurrence] + spec_input_html + content[first_occurrence + len(old_h4):]
changes += 1
print("1. Added spec name input above cost breakdown")

# === 2. Add "新增规格" button ===
old_btn = 'onclick="addBidItem()">+ 添加物料</button>'
new_btn = 'onclick="addBidItem()">+ 添加物料</button> <button onclick="saveCurrentSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ 新增规格</button>'
cnt = content.count(old_btn)
if cnt > 0:
    content = content.replace(old_btn, new_btn)
    changes += 1
    print("2. Added new spec button")
else:
    print("2. FAILED")

# === 3. Add saved specs display area ===
old_area = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">未选择文件</div>'
new_area = 'id="bidAttachmentList" style="margin-bottom:8px;font-size:12px;color:#999">未选择文件</div>\n<div id="savedSpecsArea" style="margin:12px 0;display:none"><h4 style="margin:0 0 6px;font-size:13px;color:#333">已保存规格</h4><div id="savedSpecsList" style="font-size:12px;color:#555"></div></div>'
cnt = content.count(old_area)
if cnt > 0:
    content = content.replace(old_area, new_area)
    changes += 1
    print("3. Added saved specs area")
else:
    print("3. FAILED")

# === 4. Modify submitBid ===
old_submit_start = """function submitBid(){
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

new_submit_start = """function submitBid(){
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

cnt = content.count(old_submit_start)
if cnt > 0:
    content = content.replace(old_submit_start, new_submit_start)
    changes += 1
    print("4. Modified submitBid")
else:
    print("4. FAILED")

# === 4b. Fix total calculation in submitBid ===
old_tail = """total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,
laborCost:Number(document.getElementById("bidLabor").value)||0,
manufacturingCost:Number(document.getElementById("bidMfg").value)||0,
adminCost:Number(document.getElementById("bidAdmin").value)||0,
profit:Number(document.getElementById("bidProfit").value)||0,
tax:Number(document.getElementById("bidTax").value)||0,"""

new_tail = """total:allSpecs.reduce(function(s,sp){return s+sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0)+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),
laborCost:totalLabor,
manufacturingCost:totalMfg,
adminCost:totalAdmin,
profit:totalProfit,
tax:totalTax,"""

cnt = content.count(old_tail)
if cnt > 0:
    content = content.replace(old_tail, new_tail)
    changes += 1
    print("4b. Fixed total calculation")
else:
    print("4b. FAILED")

# === 5. Add JS helper functions ===
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
return '<div style="margin:2px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;display:flex;justify-content:space-between"><span>'+sp.name+' ('+sp.items.length+'项物料, ¥'+matSum.toLocaleString()+')</span><span style="color:#e74c3c;cursor:pointer" onclick="savedSpecs.splice('+i+',1);renderSavedSpecs();">✕</span></div>';
}).join("");
}
function clearAllSpecs(){
savedSpecs=[];
renderSavedSpecs();
}
"""

submit_idx = content.find("function submitBid(){")
if submit_idx > 0:
    content = content[:submit_idx] + helpers + content[submit_idx:]
    changes += 1
    print("5. Added spec management helpers")
else:
    print("5. FAILED")

# === 6. Modify openBidForm ===
old_open = 'bidFiles=[];'
new_open = 'bidFiles=[];savedSpecs=[];var sa=document.getElementById("savedSpecsArea");if(sa)sa.style.display="none";'
cnt = content.count(old_open)
if cnt > 0:
    content = content.replace(old_open, new_open)
    changes += 1
    print("6. Modified openBidForm")
else:
    print("6. FAILED")

# === 7. Add calcBidTotal modification to sum material cost properly ===
# The calcBidTotal needs to update bidMaterialCost
# But for now, the material cost is auto-calc by calcBidTotal which updates bidTotalDisplay
# The bidMaterialCost field should mirror the material total
# Add a line to calcBidTotal to update bidMaterialCost
old_calc_end = 'document.getElementById("bidMaterialCost").value=materialTotal;'
if content.count(old_calc_end) == 0:
    # Try to find calcBidTotal and add the line
    calc_idx = content.find("function calcBidTotal(){")
    if calc_idx > 0:
        # Find the last line that updates bidTotalDisplay
        total_line_idx = content.find('document.getElementById("bidTotalDisplay")', calc_idx)
        if total_line_idx > 0:
            line_end = content.find('\n', total_line_idx)
            old_line = content[total_line_idx:line_end]
            new_line = old_line + '\ndocument.getElementById("bidMaterialCost").value=materialTotal;'
            content = content[:total_line_idx] + new_line + content[line_end:]
            changes += 1
            print("7. Added materialCost update to calcBidTotal")
        else:
            print("7. FAILED - bidTotalDisplay not found")
    else:
        print("7. FAILED - calcBidTotal not found")
else:
    print("7. Material cost line already exists")

# Write back
with open(path, "w", encoding="utf-8", errors="surrogateescape") as f:
    f.write(content)

print(f"\nTotal changes: {changes}")
