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

# === Step 1: Clear old projects by listing what exists ===
r = api("GET", "/api/buyer/projects?account=buyer@test.com")
existing = [p["id"] for p in r.get("data", [])]
print(f"Existing projects: {existing}")

# === Step 2: Create 3 new bedding projects ===
projects_def = [
    {"name": "2026年夏季凉感被采购", "deadline": "2026-08-15", "plan": "采购2000套凉感被，规格含1.5米/1.8米/2.0米床"},
    {"name": "2026年酒店床品四件套采购", "deadline": "2026-08-30", "plan": "采购1500套酒店床品，包含被套床单枕套被芯"},
    {"name": "2026年儿童纯棉被褥采购", "deadline": "2026-09-10", "plan": "采购1000套儿童被褥，A类纯棉面料"}
]

created = []
for p in projects_def:
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
        created.append({"id": pid, "name": p["name"]})
        print(f"Created: {pid} - {p['name']}")
    else:
        print(f"FAILED: {p['name']} - {r.get('message')}")

# === Step 3: Suppliers randomly pick projects ===
suppliers = [
    {"account": "supplier1@test.com", "name": "鑫达家纺有限公司"},
    {"account": "supplier2@test.com", "name": "恒丰纺织集团"},
    {"account": "supplier3@test.com", "name": "美康家居用品"},
    {"account": "supplier4@test.com", "name": "华腾实业有限公司"},
    {"account": "supplier5@test.com", "name": "永昌贸易公司"},
]

# Each supplier randomly picks 1-2 projects
random.seed(42)
assignments = {}
for sup in suppliers:
    n = random.choice([1, 2, 2])  # bias towards 2
    picked = random.sample(created, min(n, len(created)))
    assignments[sup["account"]] = picked
    names = [p["name"][:8] for p in picked]
    print(f"  {sup['name']} -> {names}")

# Ensure each project gets at least 2 suppliers
for proj in created:
    assigned_count = sum(1 for picks in assignments.values() for p in picks if p["id"] == proj["id"])
    print(f"  {proj['id']}: {assigned_count} suppliers")

# === Step 4: Generate bids ===
# Template: 被子件套 with 4 parts x 3 specs = 12 items per bid
part_names = ["被套", "床单", "枕套", "被芯"]
mat_names = ["纯棉面料", "纯棉面料", "纯棉面料", "羽绒填充"]
mat_codes = ["CT-2401", "CD-2401", "ZT-2401", "YX-2401"]
spec_vals = ["280", "250", "75", "200"]
spec_names = ["1.5米床", "1.8米床", "2.0米床"]

bid_count = 0
for sup in suppliers:
    picked_projects = assignments[sup["account"]]
    for proj in picked_projects:
        pid = proj["id"]
        
        # Each spec gets a complete material table
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
                    "partName": part_names[j],
                    "materialName": mat_names[j],
                    "materialCode": mat_codes[j],
                    "weight": weight,
                    "spec": spec_vals[j],
                    "netUsage": net_usage,
                    "wastage": wastage,
                    "quantity": 1,
                    "unitPrice": unit_price,
                    "subtotal": tax_included,
                    "specName": spec_name
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
                "name": spec_name,
                "laborCost": labor,
                "manufacturingCost": mfg,
                "adminCost": admin,
                "profit": profit,
                "tax": tax,
                "items": [{k: v for k, v in it.items() if k != "specName"} for it in items]
            })
        
        grand_total = sum(
            sum(it["subtotal"] for it in sp["items"]) + sp["laborCost"] + sp["manufacturingCost"] + sp["adminCost"] + sp["profit"] + sp["tax"]
            for sp in specs_data
        )
        
        body = {
            "account": sup["account"],
            "projectId": pid,
            "supplierAccount": sup["account"],
            "supplierName": sup["name"],
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
            bid_count += 1
            specs_count = len(specs_data)
            print(f"  {r['data']['id']} {sup['name']} -> {pid} ({specs_count}规格) total={grand_total:,.0f}")
        else:
            print(f"  FAILED {sup['name']} -> {pid}: {r.get('message')}")

print(f"\n=== Total bids: {bid_count} ===")

# === Summary ===
print("\n=== Project Summary ===")
for proj in created:
    r = api("GET", f"/api/buyer/projects?account=buyer@test.com")
    for p in r.get("data", []):
        if p["id"] == proj["id"]:
            print(f"  {proj['id']}: {proj['name']} | quotes={p.get('quoteCount',0)} | lowest={p.get('lowestBid','--')}")
