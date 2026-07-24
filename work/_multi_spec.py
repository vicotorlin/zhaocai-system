import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "rb") as f:
    raw = f.read()
text = raw.decode("utf-8")
print(f"Size: {len(text)}")

changes = 0

# === 1. Add spec name input ===
old1 = '<h4 style="margin:0 0 8px;font-size:14px;color:#333">\u20bf\ufe0f \u8d39\u7528\u62c6\u5206</h4>'
if old1 not in text:
    # Find it dynamically
    idx = text.find('\u8d39\u7528\u62c6\u5206')
    h4_start = text.rfind('<h4', 0, idx)
    h4_end = text.find('</h4>', idx) + 5
    old1 = text[h4_start:h4_end]
new1 = '<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#333">\u89c4\u683c\u540d\u79f0</label><input class="spec-name-input" placeholder="\u5982\uff1a1.5\u7c73\u5e8a / 1.8\u7c73\u5e8a" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:13px"></div>\n' + old1
text = text.replace(old1, new1, 1)
changes += 1
print("1. Spec name input")

# === 2. Wrap spec form in container ===
# Find the beginning of the cost section and the end of the material section
cost_start = text.find('\u8d39\u7528\u62c6\u5206')
# Go back to find the container div opening
div_start = text.rfind('<div', 0, cost_start)
# Find the matching closing div for the cost section
# Find end of material table + add item button
mat_end_marker = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button>'
mat_end_idx = text.find(mat_end_marker)
mat_end = text.find('\n', mat_end_idx)  # end of button line

# Insert container opening before the spec form
container_open = '<div id="bidSpecsContainer">\n<div class="spec-block" data-spec-idx="0">\n'
text = text[:div_start] + container_open + text[div_start:]

# Find the closing div for the spec form (after the add button)
# The add button is inside <div ...> that closes before the attachments section
close_div_idx = text.find('\n<h4 style="margin:16px', mat_end)
container_close = '</div>\n</div>\n'

# Re-find positions after insertion
close_div_idx = text.find('\n<h4 style="margin:16px', mat_end_idx + 200)
text = text[:close_div_idx] + container_close + text[close_div_idx:]
changes += 1
print("2. Wrapped spec form in container")

# === 3. Change "添加物料" button to "新增规格" ===
old_btn = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button>'
new_btn = 'onclick="addBidItem()">+ \u6dfb\u52a0\u7269\u6599</button> <button onclick="addNewSpec()" style="margin-left:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px">+ \u65b0\u589e\u89c4\u683c</button>'
text = text.replace(old_btn, new_btn)
changes += 1
print("3. Button added")

# === 4. Add javascript for spec management ===
js_code = """
// ===== Spec management =====
var specCounter=1;
var specTemplate='';
function initSpecTemplate(){
var container=document.getElementById("bidSpecsContainer");
if(container){
var first=container.querySelector(".spec-block");
if(first)specTemplate=first.outerHTML;
}
}
function addNewSpec(){
if(!specTemplate)initSpecTemplate();
var container=document.getElementById("bidSpecsContainer");
if(!container)return;
var clone=document.createElement("div");
clone.className="spec-block";
clone.setAttribute("data-spec-idx",specCounter);
clone.innerHTML=specTemplate.replace(/data-spec-idx="0"/g,'data-spec-idx="'+specCounter+'"');
// Clear inputs in clone
clone.querySelectorAll("input").forEach(function(inp){inp.value=inp.type==="number"?"0":"";});
clone.querySelectorAll("tbody").forEach(function(tb){tb.innerHTML="";});
container.appendChild(clone);
// Add one empty row to the new spec
var tb=clone.querySelector("tbody");
if(tb){
var row=document.createElement("tr");
if(isBeddingMode){
row.innerHTML='<td><input value=""></td><td><input value=""></td><td><input value=""></td><td><input type="number" value="" onchange="calcBidTotal()"></td><td><input type="number" step="any" value="" onchange="calcBidTotal()"></td><td><input type="number" value="" onchange="calcBidTotal()"></td><td><input type="number" value="" style="width:60px" onchange="calcBidTotal()"></td><td class="item-actual">0</td><td><input type="number" value="" onchange="calcBidTotal()"></td><td class="item-tax">0</td><td class="item-subtotal">0</td><td><button class="btn btn-outline btn-sm" onclick="var tr=this.closest(\\x27tr\\x27);if(tr)tr.remove();calcBidTotal();">\\u2715</button></td>';
}else{
row.innerHTML='<td><input value=""></td><td><input value=""></td><td><input value=""></td><td><input type="number" value=""></td><td><input value=""></td><td><input type="number" value=""></td><td><button class="btn btn-outline btn-sm" onclick="var tr=this.closest(\\x27tr\\x27);if(tr)tr.remove();calcBidTotal();">\\u2715</button></td>';
}
tb.appendChild(row);
}
specCounter++;
toast("\u65b0\u89c4\u683c\u5df2\u6dfb\u52a0","success");
}
function collectAllSpecs(){
var specs=[];
document.querySelectorAll("#bidSpecsContainer .spec-block").forEach(function(block){
var nameInput=block.querySelector(".spec-name-input");
var name=nameInput?nameInput.value:"";
if(!name)name="\u89c4\u683c"+(specs.length+1);
var items=collectSpecItems(block);
if(items.length===0)return;
specs.push({
name:name,items:items,
laborCost:getSpecInput(block,"laborCost",0),
manufacturingCost:getSpecInput(block,"manufacturingCost",0),
adminCost:getSpecInput(block,"adminCost",0),
profit:getSpecInput(block,"profit",0),
tax:getSpecInput(block,"tax",0)
});
});
return specs;
}
function collectSpecItems(block){
var items=[];
block.querySelectorAll("tbody tr").forEach(function(row){
var inputs=row.querySelectorAll("input");
if(isBeddingMode){
var gw=Number(inputs[3]&&inputs[3].value)||0;
var sw=Number(inputs[4]&&inputs[4].value)||0;
var nu=Number(inputs[5]&&inputs[5].value)||0;
var lo=Number(inputs[6]&&inputs[6].value)||0;
var au=nu*(1+lo/100);
var up=Number(inputs[7]&&inputs[7].value)||0;
var ta=(gw===0&&sw===0)?au*up:gw*sw*au*up/100000;
items.push({partName:inputs[0]&&inputs[0].value||"",materialName:inputs[1]&&inputs[1].value||"",materialCode:inputs[2]&&inputs[2].value||"",weight:gw,spec:inputs[4]&&inputs[4].value||"",netUsage:nu,loss:lo,actualUsage:au,unitPrice:up,taxAmount:ta,subtotal:ta});
}else{
items.push({name:inputs[0]&&inputs[0].value||"",materialCode:inputs[1]&&inputs[1].value||"",spec:inputs[2]&&inputs[2].value||"",qty:Number(inputs[3]&&inputs[3].value)||0,unit:inputs[4]&&inputs[4].value||"",unitPrice:Number(inputs[5]&&inputs[5].value)||0});
}
});
return items;
}
function getSpecInput(block,field,def){
var el=block.querySelector('[onchange*="'+field+'"]');
if(!el){
// Find by position - the cost fields are in .spec-block divs
var divs=block.querySelectorAll("div[class] input[type=number]");
}
return def;
}
"""

# Find where to insert JS (before submitBid)
idx = text.find("function submitBid(){")
text = text[:idx] + js_code + text[idx:]
changes += 1
print("4. JS helpers added")

# === 5. Modify submitBid ===
text = text.replace('function submitBid(){', 'async function submitBid(){')
text = text.replace('specs:[],', 'specs:collectAllSpecs(),')
# Fix total
old_total = 'total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,'
new_total = 'total:collectAllSpecs().reduce(function(s,sp){var m=sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0);return s+m+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),'
text = text.replace(old_total, new_total)
# Fix costs
text = text.replace('laborCost:Number(document.getElementById("bidLabor").value)||0,', 'laborCost:collectAllSpecs().reduce(function(s,sp){return s+(sp.laborCost||0);},0),')
text = text.replace('manufacturingCost:Number(document.getElementById("bidMfg").value)||0,', 'manufacturingCost:collectAllSpecs().reduce(function(s,sp){return s+(sp.manufacturingCost||0);},0),')
text = text.replace('adminCost:Number(document.getElementById("bidAdmin").value)||0,', 'adminCost:collectAllSpecs().reduce(function(s,sp){return s+(sp.adminCost||0);},0),')
text = text.replace('profit:Number(document.getElementById("bidProfit").value)||0,', 'profit:collectAllSpecs().reduce(function(s,sp){return s+(sp.profit||0);},0),')
text = text.replace('tax:Number(document.getElementById("bidTax").value)||0,', 'tax:collectAllSpecs().reduce(function(s,sp){return s+(sp.tax||0);},0),')
text = text.replace('var items=collectBidItems();', 'var items=[];var allSpecs=collectAllSpecs();allSpecs.forEach(function(sp){sp.items.forEach(function(it){items.push(it);});});')
changes += 1
print("5. submitBid modified")

with open(path, "wb") as f:
    f.write(text.encode("utf-8"))

print(f"\nDone: {changes} changes, size: {len(text)}")
