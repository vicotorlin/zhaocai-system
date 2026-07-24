import json, http.client, random

HOST = "localhost"; PORT = 3000
def api(method, path, body=None):
    conn = http.client.HTTPConnection(HOST, PORT, timeout=30)
    if body:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        conn.request(method, path, body=data, headers={"Content-Type": "application/json; charset=utf-8"})
    else: conn.request(method, path)
    resp = conn.getresponse(); raw = resp.read().decode("utf-8"); conn.close()
    return json.loads(raw)

random.seed(123)
part_names = ["被套", "床单", "枕套", "被芯"]
mat_names = ["纯棉面料", "纯棉面料", "纯棉面料", "羽绒填充"]
mat_codes = ["CT-2401", "CD-2401", "ZT-2401", "YX-2401"]
spec_vals = ["280", "250", "75", "200"]
spec_names = ["1.5米床", "1.8米床", "2.0米床"]

extra = [
    ("supplier3@test.com", "美康家居用品", "ZB-002"),
    ("supplier4@test.com", "华腾实业有限公司", "ZB-002"),
    ("supplier1@test.com", "鑫达家纺有限公司", "ZB-002"),
    ("supplier2@test.com", "恒丰纺织集团", "ZB-003"),
    ("supplier3@test.com", "美康家居用品", "ZB-003"),
    ("supplier5@test.com", "永昌贸易公司", "ZB-003"),
]

for sup_acc, sup_name, pid in extra:
    specs_data = []; all_items = []
    for sn in spec_names:
        items = []
        for j in range(4):
            w = random.choice([150,180,200,250,300]); nu = round(random.uniform(1.5,4.5),1); wa = random.choice([3,4,5])
            up = round(random.uniform(15,80),2); au = round(nu*(1+wa/100),2); snv = float(spec_vals[j])
            ti = w*snv*au*up/100000
            if ti<1: ti = au*up
            ti = round(ti,2)
            items.append({"partName":part_names[j],"materialName":mat_names[j],"materialCode":mat_codes[j],"weight":w,"spec":spec_vals[j],"netUsage":nu,"wastage":wa,"quantity":1,"unitPrice":up,"subtotal":ti,"specName":sn})
            all_items.append({k:v for k,v in items[-1].items() if k!="specName"})
        specs_data.append({"name":sn,"laborCost":random.randint(2000,8000),"manufacturingCost":random.randint(1000,5000),"adminCost":random.randint(500,3000),"profit":random.randint(1000,6000),"tax":random.randint(500,4000),"items":[{k:v for k,v in it.items() if k!="specName"} for it in items]})
    gt = round(sum(sum(it["subtotal"] for it in sp["items"])+sp["laborCost"]+sp["manufacturingCost"]+sp["adminCost"]+sp["profit"]+sp["tax"] for sp in specs_data), 2)
    r = api("POST","/api/supplier/bid",{"account":sup_acc,"projectId":pid,"supplierAccount":sup_acc,"supplierName":sup_name,"items":all_items,"total":gt,"laborCost":sum(sp["laborCost"] for sp in specs_data),"manufacturingCost":sum(sp["manufacturingCost"] for sp in specs_data),"adminCost":sum(sp["adminCost"] for sp in specs_data),"profit":sum(sp["profit"] for sp in specs_data),"tax":sum(sp["tax"] for sp in specs_data),"specs":specs_data,"category":"被子件套"})
    print(f"  {r['data']['id'] if r.get('success') else 'FAIL'} {sup_name} -> {pid} total={gt:,.0f}")

print("\n=== Final ===")
r = api("GET","/api/buyer/projects?account=buyer@test.com")
for p in r.get("data",[]): print(f"  {p['id']}: quotes={p.get('quoteCount',0)} lowest={p.get('lowestBid','--')}")
