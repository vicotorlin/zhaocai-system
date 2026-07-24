import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\outputs\dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# The exact old block (4-space indent, inside allSpecNames.forEach)
old_block = """    currentQuoteData.forEach(function(q){
      var specs=q.specs||[];
      var sp=null;
      for(var i=0;i<specs.length;i++){
        if((specs[i].name||"\u9ed8\u8ba4\u89c4\u683c")===specName){sp=specs[i];break;}
      }
      if(sp){
        var mCost=(sp.items||[]).reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
        var st=mCost+(sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0);
        specHTML+='<tr><td><strong>'+q.supplierName+'</strong></td><td style="text-align:right">'+mCost.toLocaleString()+'</td><td style="text-align:right">'+(sp.laborCost||0).toLocaleString()+'</td><td style="text-align:right">'+(sp.manufacturingCost||0).toLocaleString()+'</td><td style="text-align:right">'+(sp.adminCost||0).toLocaleString()+'</td><td style="text-align:right">'+(sp.profit||0).toLocaleString()+'</td><td style="text-align:right">'+(sp.tax||0).toLocaleString()+'</td><td style="text-align:right;color:#2563eb;font-weight:600">'+st.toLocaleString()+'</td></tr>';
      }
    });"""

new_block = """    var specRows=[];
    currentQuoteData.forEach(function(q){
      var specs=q.specs||[];
      var sp=null;
      for(var i=0;i<specs.length;i++){
        if((specs[i].name||"\u9ed8\u8ba4\u89c4\u683c")===specName){sp=specs[i];break;}
      }
      if(sp){
        var mCost=(sp.items||[]).reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
        var st=mCost+(sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0);
        specRows.push({name:q.supplierName,mCost:mCost,labor:sp.laborCost||0,mfg:sp.manufacturingCost||0,admin:sp.adminCost||0,profit:sp.profit||0,tax:sp.tax||0,total:st});
      }
    });
    if(specRows.length>0){
      var minMCost=Math.min.apply(null,specRows.map(function(r){return r.mCost;}));
      var minLabor=Math.min.apply(null,specRows.map(function(r){return r.labor;}));
      var minMfg=Math.min.apply(null,specRows.map(function(r){return r.mfg;}));
      var minAdmin=Math.min.apply(null,specRows.map(function(r){return r.admin;}));
      var minProfit=Math.min.apply(null,specRows.map(function(r){return r.profit;}));
      var minTax=Math.min.apply(null,specRows.map(function(r){return r.tax;}));
      var minTotal=Math.min.apply(null,specRows.map(function(r){return r.total;}));
      specRows.forEach(function(r){
        var mc=r.mCost===minMCost?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var lc=r.labor===minLabor?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var fc=r.mfg===minMfg?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var ac=r.admin===minAdmin?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var pc=r.profit===minProfit?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var tc=r.tax===minTax?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var gc=r.total===minTotal?'background:#C6EFCE;color:#006100;font-weight:600':'';
        specHTML+='<tr><td><strong>'+r.name+'</strong></td><td style="text-align:right;'+mc+'">'+r.mCost.toLocaleString()+'</td><td style="text-align:right;'+lc+'">'+r.labor.toLocaleString()+'</td><td style="text-align:right;'+fc+'">'+r.mfg.toLocaleString()+'</td><td style="text-align:right;'+ac+'">'+r.admin.toLocaleString()+'</td><td style="text-align:right;'+pc+'">'+r.profit.toLocaleString()+'</td><td style="text-align:right;'+tc+'">'+r.tax.toLocaleString()+'</td><td style="text-align:right;color:#2563eb;font-weight:600;'+gc+'">'+r.total.toLocaleString()+'</td></tr>';
      });
    }"""

cnt = content.count(old_block)
print(f"Occurrences: {cnt}")

if cnt > 0:
    content = content.replace(old_block, new_block)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replacement done!")
else:
    print("NOT FOUND - checking encoding")
    # Try to find with ASCII markers
    idx = content.find("currentQuoteData.forEach(function(q){")
    print(f"All occurrences of this pattern:")
    pos = 0
    count = 0
    while True:
        pos = content.find("currentQuoteData.forEach(function(q){", pos)
        if pos < 0:
            break
        print(f"  #{count}: at {pos}")
        # Show a bit of context
        snippet = content[pos:pos+100]
        print(f"  snippet: {repr(snippet[:80])}")
        pos += 1
        count += 1
        if count > 5:
            break
