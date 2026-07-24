import json, http.client, random, time

BASE = "localhost:3000"
API_HOST = "localhost"
API_PORT = 3000

def api(method, path, body=None):
    conn = http.client.HTTPConnection(API_HOST, API_PORT, timeout=30)
    body_str = json.dumps(body, ensure_ascii=False) if body else None
    conn.request(method, path, body=body_str, headers={"Content-Type": "application/json"} if body_str else {})
    resp = conn.getresponse()
    data = resp.read().decode("utf-8")
    conn.close()
    return json.loads(data)

# Step 1: Create users
print("=== Creating users ===")
r = api("POST", "/api/dev/create-user", {"account": "buyer@test.com", "password": "123456", "role": "buyer"})
print(f"  buyer@test.com: {r.get('success')}")

suppliers = []
supplier_names_list = [
    "鑫达家纺有限公司", "恒丰纺织集团", "美康家居用品", "华腾实业有限公司", "永昌贸易公司"
]
for i in range(1, 6):
    acc = f"supplier{i}@test.com"
    r = api("POST", "/api/dev/create-user", {"account": acc, "password": "123456", "role": "supplier"})
    suppliers.append(acc)
    print(f"  {acc}: {r.get('success')}")

# Also create supplier6 for completeness
r = api("POST", "/api/dev/create-user", {"account": "supplier6@test.com", "password": "123456", "role": "supplier"})
print(f"  supplier6@test.com: {r.get('success')}")

# Step 2: Create projects
print("\n=== Creating projects ===")
projects_data = [
    {"name": "2026年夏季凉感被采购", "deadline": "2026-09-15", "category": "被子件套", "plan": "采购2000套凉感被，包含被套、被芯等"},
    {"name": "2026年儿童被褥套装采购", "deadline": "2026-10-01", "category": "被子件套", "plan": "采购1500套儿童被褥套装"},
    {"name": "2026年酒店床品采购", "deadline": "2026-09-30", "category": "被子件套", "plan": "采购3000套酒店床品四件套"}
]

created_pids = []
for p in projects_data:
    r = api("POST", "/api/buyer/projects", {
        "buyerAccount": "buyer@test.com",
        "projectName": p["name"],
        "buyer": "采购员",
        "deadline": p["deadline"],
        "plan": p["plan"],
        "channelDetails": "",
        "techParams": "",
        "attachments": []
    })
    if r.get("success"):
        pid = r["data"]["id"]
        created_pids.append({"id": pid, "name": p["name"], "category": p["category"]})
        print(f"  {pid}: {p['name']}")
    else:
        print(f"  FAILED: {p['name']} - {r.get('message')}")

# Step 3: Generate bids (5 suppliers x 3 projects)
print(f"\n=== Generating bids for {len(created_pids)} projects ===")

parts_list = ["被套", "床单", "枕套", "被芯"]
materials_list = ["纯棉面料", "纯棉面料", "纯棉面料", "羽绒填充"]
codes_list = ["CT-2401", "CD-2401", "ZT-2401", "YX-2401"]
spec_list = ["280", "250", "75", "200"]
spec_name_opts = ["1.5米床", "1.8米床", "2.0米床"]

for proj in created_pids:
    pid = proj["id"]
    for idx, (supp_acc, supp_name) in enumerate(zip(suppliers, supplier_names_list)):
        spec_name = spec_name_opts[idx % 3]
        
        items = []
        for j in range(4):
            weight = random.choice([150, 180, 200, 250, 300])
            net_usage = round(random.uniform(1.5, 4.5), 1)
            wastage = random.choice([3, 4, 5])
            unit_price = round(random.uniform(15, 80), 2)
            actual_usage = net_usage * (1 + wastage / 100)
            
            spec_num = float(spec_list[j])
            tax_included = weight * spec_num * actual_usage * unit_price / 100000
            if tax_included < 1:
                tax_included = actual_usage * unit_price
            tax_included = round(tax_included, 2)
            
            items.append({
                "partName": parts_list[j],
                "materialName": materials_list[j],
                "materialCode": codes_list[j],
                "weight": weight,
                "spec": spec_list[j],
                "netUsage": net_usage,
                "wastage": wastage,
                "quantity": 1,
                "unitPrice": unit_price,
                "subtotal": tax_included,
                "specName": spec_name
            })
        
        mat_total = sum(it["subtotal"] for it in items)
        labor = random.randint(2000, 8000)
        mfg = random.randint(1000, 5000)
        admin = random.randint(500, 3000)
        profit = random.randint(1000, 6000)
        tax = random.randint(500, 4000)
        
        specs_data = [{
            "name": spec_name,
            "laborCost": labor,
            "manufacturingCost": mfg,
            "adminCost": admin,
            "profit": profit,
            "tax": tax,
            "items": [{k: v for k, v in it.items() if k != "specName"} for it in items]
        }]
        
        total = round(mat_total + labor + mfg + admin + profit + tax, 2)
        
        body = {
            "account": supp_acc,
            "projectId": pid,
            "supplierAccount": supp_acc,
            "supplierName": supp_name,
            "items": [{k: v for k, v in it.items() if k != "specName"} for it in items],
            "total": total,
            "laborCost": labor,
            "manufacturingCost": mfg,
            "adminCost": admin,
            "profit": profit,
            "tax": tax,
            "specs": specs_data,
            "category": proj["category"]
        }
        
        r = api("POST", "/api/supplier/bid", body)
        if r.get("success"):
            print(f"  {r['data']['id']}: {supp_name} -> {pid} ({spec_name}) total=\u00a5{total:,.0f}")
        else:
            print(f"  FAILED bid for {pid} by {supp_name}: {r.get('message')}")

print("\n=== All done! ===")
