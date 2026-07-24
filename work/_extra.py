import json, http.client, random

HOST = "localhost"
PORT = 3000

def api(method, path, body=None):
    conn = http.client.HTTPConnection(HOST, PORT, timeout=30)
    if body:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        conn.request(method, path, body=data, headers={"Content-Type": "application/json; charset=utf-8"})
    else:
        conn.request(method, path)
    resp = conn.getresponse()
    raw = resp.read().decode("utf-8")
    conn.close()
    return json.loads(raw)

random.seed(123)

part_names = ["被套", "床单", "枕套", "被芯"]
mat_names = ["纯棉面料", "纯棉面料", "纯棉面料", "羽绒填充"]
mat_codes = ["CT-2401", "CD-2401", "ZT-2401", "YX-2401"]
spec_vals = ["280", "250", "75", "200"]
spec_names = ["1.5米床", "1.8米床", "2.0米床"]

# Add bids to balance ZB-005 and ZB-006
extra_bids = [
    # ZB-005: add supplier3, supplier4
    {"supplier": "supplier3@test.com", "name": "美康家居用品", "pid": "ZB-005"},
    {"supplier": "supplier4@test.com", "name": "华腾实业有限公司", "pid": "ZB-005"},
    {"supplier": "supplier1@test.com", "name": "鑫达家纺有限公司", "pid": "ZB-005"},
    # ZB-006: add supplier2, supplier3, supplier5
    {"supplier": "supplier2@test.com", "name": "恒丰纺织集团", "pid": "ZB-006"},
    {"supplier": "supplier3@test.com", "name": "美康家居用品", "pid": "ZB-006"},
    {"supplier": "supplier5@test.com", "name": "永昌贸易公司", "pid": "ZB-006"},
]

for bid_info in extra_bids:
    pid = bid_info["pid"]
    specs_data = []
    all_items = []
    
    for spec_name in spec_names:
        items = []
        for j in range(4):
            weight = random.choice([150, 180, 200, 250, 300])
            net_usage = round(random.uniform(1.5, 4.5), 1)
            wastage = random.choice([3, 4, 5])
            unit_price = round(random.uniform(15, 80), 2)
            actual_usage = round(net_usage * (1 + wastage / 100), 2)
            spec_num = float(spec_vals[j])
            tax_included = weight * spec_num * actual_usage * unit_price / 100000
            if tax_included < 1:
                tax_included = actual_usage * unit_price
            tax_included = round(tax_included, 2)
            
            item = {
                "partName": part_names[j], "materialName": mat_names[j],
                "materialCode": mat_codes[j], "weight": weight, "spec": spec_vals[j],
                "netUsage": net_usage, "wastage": wastage, "quantity": 1,
                "unitPrice": unit_price, "subtotal": tax_included, "specName": spec_name
            }
            items.append(item)
            all_items.append({k: v for k, v in item.items() if k != "specName"})
        
        mat_total = sum(it["subtotal"] for it in items)
        labor = random.randint(2000, 8000)
        mfg = random.randint(1000, 5000)
        admin = random.randint(500, 3000)
        profit = random.randint(1000, 6000)
        tax = random.randint(500, 4000)
        
        specs_data.append({
            "name": spec_name, "laborCost": labor, "manufacturingCost": mfg,
            "adminCost": admin, "profit": profit, "tax": tax,
            "items": [{k: v for k, v in it.items() if k != "specName"} for it in items]
        })
    
    grand_total = sum(
        sum(it["subtotal"] for it in sp["items"]) + sp["laborCost"] + sp["manufacturingCost"] + sp["adminCost"] + sp["profit"] + sp["tax"]
        for sp in specs_data
    )
    
    body = {
        "account": bid_info["supplier"], "projectId": pid,
        "supplierAccount": bid_info["supplier"], "supplierName": bid_info["name"],
        "items": all_items,
        "total": round(grand_total, 2),
        "laborCost": sum(sp["laborCost"] for sp in specs_data),
        "manufacturingCost": sum(sp["manufacturingCost"] for sp in specs_data),
        "adminCost": sum(sp["adminCost"] for sp in specs_data),
        "profit": sum(sp["profit"] for sp in specs_data),
        "tax": sum(sp["tax"] for sp in specs_data),
        "specs": specs_data,
        "category": "被子件套"
    }
    
    r = api("POST", "/api/supplier/bid", body)
    if r.get("success"):
        print(f"  {r['data']['id']} {bid_info['name']} -> {pid} total={grand_total:,.0f}")
    else:
        print(f"  FAILED: {r.get('message')}")

# Summary
print("\n=== Final Summary ===")
r = api("GET", "/api/buyer/projects?account=buyer@test.com")
for p in r.get("data", []):
    if p["id"] in ("ZB-004", "ZB-005", "ZB-006"):
        print(f"  {p['id']}: {p['projectName']} | quotes={p['quoteCount']} | lowest={p.get('lowestBid','--')}")
