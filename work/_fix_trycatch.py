import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Add try/catch to saveCurrentSpec for debugging
old_func = """function saveCurrentSpec(){
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
}"""

new_func = """function saveCurrentSpec(){
try{
saveCurrentSpecSilent();
var el=document.getElementById("bidSpecName");if(el)el.value="";
document.getElementById("bidItemsBody").innerHTML="";
document.getElementById("bidLabor").value="0";
document.getElementById("bidMfg").value="0";
document.getElementById("bidAdmin").value="0";
document.getElementById("bidProfit").value="0";
document.getElementById("bidTax").value="0";
var mc=document.getElementById("bidMaterialCost");if(mc)mc.value="0";
addBidItem();
calcBidTotal();
renderSavedSpecs();
toast("规格已保存，请继续添加下一个规格","success");
}catch(e){alert("保存规格失败: "+e.message);}
}"""

if old_func in content:
    content = content.replace(old_func, new_func)
    print("Added try/catch to saveCurrentSpec")
else:
    print("FAILED: saveCurrentSpec not found")

with open(path, "wb") as f:
    f.write(content.encode("utf-8", errors="surrogateescape"))

print("Done")
