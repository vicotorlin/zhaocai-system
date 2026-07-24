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

# === Step 1: Create users ===
print("=== Creating users ===")
r = api("POST", "/api/dev/create-user", {"account": "buyer@test.com", "password": "123456", "role": "buyer"})
print(f"  buyer: {r.get('success')}")
suppliers_list = []
for i in range(1, 6):
    r = api("POST", "/api/dev/create-user", {"account": f"supplier{i}@test.com", "password": "123456", "role": "supplier"})
    suppliers_list.append(f"supplier{i}@test.com")
    print(f"  supplier{i}: {r.get('success')}")

# === Step 2: Create 3 projects ===
print("\n=== Creating projects ===")
projects_def = [
    {"name": "2026年夏季凉感被采购", "deadline": "2026-08-15", "plan": "采购2000套凉感被"},
    {"name": "2026年酒店床品四件套采购", "deadline": "2026-08-30", "plan": "采购1500套酒店床品"},
    {"name": "2026年儿童纯棉被褥采购", "deadline": "2026-09-10", "plan": "采购1000套儿童被褥"}
]
created = []
for p in projects_def:
    r = api("POST", "/api/buyer/projects", {
        "buyerAccount": "buyer@test.com", "projectName": p["name"],
        "buyer": "采购员", "deadline": p["deadline"], "plan": p["plan"],
        "channelDetails": "", "techParams": "", "attachments": []
    })
    if r.get("success"):
        created.append({"id": r["data"]["id"], "name": p["name"]})
        print(f"  {r['data']['id']}: {p['name']}")

# === Step 3: Random supplier assignment ===
random.seed(42)
supplier_names = ["鑫达家纺有限公司", "恒丰纺织集团", "美康家居用品", "华腾实业有限公司", "永昌贸易公司"]
assignments = {}
for sup in suppliers_list:
    n = random.choice([1, 2, 2])
    picked = random.sample(created, min(n, len(created)))
    assignments[sup] = picked

# === Step 4: Generate bids ===
part_names = ["被套", "床单", "枕套", "被芯"]
mat_names = ["纯棉面料", "纯棉面料", "纯棉面料", "羽绒填充"]
mat_codes = ["CT-2401", "CD-2401", "ZT-2401", "YX-2401"]
spec_vals = ["280", "250", "75", "200"]
spec_names = ["1.5米床", "1.8米床", "2.0米床"]

print(f"\n=== Generating bids ===")
for sup_acc, sup_name in zip(suppliers_list, supplier_names):
    for proj in assignments[sup_acc]:
        pid = proj["id"]
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
                ti = weight * spec_num * actual_usage * unit_price / 100000
                if ti < 1: ti = actual_usage * unit_price
                ti = round(ti, 2)
                item = {"partName": part_names[j], "materialName": mat_names[j], "materialCode": mat_codes[j], "weight": weight, "spec": spec_vals[j], "netUsage": net_usage, "wastage": wastage, "quantity": 1, "unitPrice": unit_price, "subtotal": ti, "specName": spec_name}
                items.append(item)
                all_items.append({k: v for k, v in item.items() if k != "specName"})
            mat_total = sum(it["subtotal"] for it in items)
            specs_data.append({"name": spec_name, "laborCost": random.randint(2000, 8000), "manufacturingCost": random.randint(1000, 5000), "adminCost": random.randint(500, 3000), "profit": random.randint(1000, 6000), "tax": random.randint(500, 4000), "items": [{k: v for k, v in it.items() if k != "specName"} for it in items]})
        grand_total = round(sum(sum(it["subtotal"] for it in sp["items"]) + sp["laborCost"] + sp["manufacturingCost"] + sp["adminCost"] + sp["profit"] + sp["tax"] for sp in specs_data), 2)
        r = api("POST", "/api/supplier/bid", {"account": sup_acc, "projectId": pid, "supplierAccount": sup_acc, "supplierName": sup_name, "items": all_items, "total": grand_total, "laborCost": sum(sp["laborCost"] for sp in specs_data), "manufacturingCost": sum(sp["manufacturingCost"] for sp in specs_data), "adminCost": sum(sp["adminCost"] for sp in specs_data), "profit": sum(sp["profit"] for sp in specs_data), "tax": sum(sp["tax"] for sp in specs_data), "specs": specs_data, "category": "被子件套"})
        if r.get("success"): print(f"  {r['data']['id']} {sup_name} -> {pid} total={grand_total:,.0f}")
        else: print(f"  FAIL: {r.get('message')}")

# Summary
print("\n=== Summary ===")
r = api("GET", "/api/buyer/projects?account=buyer@test.com")
for p in r.get("data", []):
    print(f"  {p['id']}: {p['projectName']} | quotes={p.get('quoteCount',0)} | lowest={p.get('lowestBid','--')}")
