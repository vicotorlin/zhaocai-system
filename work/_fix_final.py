import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    text = f.read()

changes = 0

# Replace submitBid function body from start to specs line
old_start = text[74504:75011]  # from function submitBid(){ to specs:[],
print(f"Old start length: {len(old_start)}")

new_start = """function submitBid(){
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
"""

text = text[:74504] + new_start + text[75011:]
changes += 1
print("1. Replaced submitBid start")

# Now fix the total/laborCost lines
# Find the old total line
old_total_line = 'total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,'
new_total_line = 'total:allSpecs.reduce(function(s,sp){return s+sp.items.reduce(function(ss,it){return ss+(Number(it.subtotal)||0);},0)+sp.laborCost+sp.manufacturingCost+sp.adminCost+sp.profit+sp.tax;},0),'

if old_total_line in text:
    text = text.replace(old_total_line, new_total_line)
    changes += 1
    print("2. Replaced total line")
else:
    print("2. FAILED: total line not found")

# Fix laborCost line
old_labor = 'laborCost:Number(document.getElementById("bidLabor").value)||0,'
new_labor = 'laborCost:totalLabor,'
if old_labor in text:
    text = text.replace(old_labor, new_labor)
    changes += 1
    print("3. Replaced laborCost line")
else:
    print("3. FAILED")

# Fix manufacturingCost
old_mfg = 'manufacturingCost:Number(document.getElementById("bidMfg").value)||0,'
new_mfg = 'manufacturingCost:totalMfg,'
if old_mfg in text:
    text = text.replace(old_mfg, new_mfg)
    changes += 1
    print("4. Replaced manufacturingCost line")
else:
    print("4. FAILED")

# Fix adminCost
old_admin = 'adminCost:Number(document.getElementById("bidAdmin").value)||0,'
new_admin = 'adminCost:totalAdmin,'
if old_admin in text:
    text = text.replace(old_admin, new_admin)
    changes += 1
    print("5. Replaced adminCost line")
else:
    print("5. FAILED")

# Fix profit
old_profit = 'profit:Number(document.getElementById("bidProfit").value)||0,'
new_profit = 'profit:totalProfit,'
if old_profit in text:
    text = text.replace(old_profit, new_profit)
    changes += 1
    print("6. Replaced profit line")
else:
    print("6. FAILED")

# Fix tax
old_tax = 'tax:Number(document.getElementById("bidTax").value)||0,'
new_tax = 'tax:totalTax,'
if old_tax in text:
    text = text.replace(old_tax, new_tax)
    changes += 1
    print("7. Replaced tax line")
else:
    print("7. FAILED")

with open(path, "wb") as f:
    f.write(text.encode("utf-8", errors="surrogateescape"))

print(f"\nTotal changes: {changes}")
