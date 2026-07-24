const fs = require("fs");
const file = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier-quote/src/App.tsx";
let content = fs.readFileSync(file, "utf-8");

// 1. Add cost state variables after the existing state declarations
const oldState = 'const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)\n  const [bidResult, setBidResult] = useState<{ id: string; total: number } | null>(null)';

const newState = 'const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)\n  const [bidResult, setBidResult] = useState<{ id: string; total: number } | null>(null)\n  const [laborCost, setLaborCost] = useState(0)\n  const [manufacturingCost, setManufacturingCost] = useState(0)\n  const [adminCost, setAdminCost] = useState(0)\n  const [profit, setProfit] = useState(0)\n  const [tax, setTax] = useState(0)';

content = content.replace(oldState, newState);

// 2. Calculate material total from items
const oldCalcTotal = 'const calcTotal = () =>\n    watchedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0)';

const newCalcTotal = 'const calcTotal = () =>\n    watchedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0)\n\n  const materialSum = calcTotal();\n  const grandTotal = materialSum + laborCost + manufacturingCost + adminCost + profit + tax;';

content = content.replace(oldCalcTotal, newCalcTotal);

// 3. Insert cost breakdown form between header row and material table
const oldTableStart = '<div className="rounded-lg border overflow-hidden">\n              <Table>';

const newTableStart = '{/* 费用拆分表单 */}\n            <div className="bg-slate-50 rounded-lg border p-4 mb-4">\n              <h4 className="text-sm font-semibold text-slate-700 mb-3">💰 费用拆分</h4>\n              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">\n                <div>\n                  <label className="text-xs text-slate-500">📦 材料费用</label>\n                  <div className="mt-1 h-9 flex items-center px-3 bg-white border rounded-md text-sm font-semibold text-slate-700">¥{materialSum.toLocaleString()}</div>\n                  <p className="text-xs text-slate-400 mt-0.5">自动汇总物料金额</p>\n                </div>\n                <div>\n                  <label className="text-xs text-slate-500">👷 人工费用</label>\n                  <Input type="number" min="0" value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value) || 0)} placeholder="0" className="mt-1" />\n                </div>\n                <div>\n                  <label className="text-xs text-slate-500">🏭 制造费用</label>\n                  <Input type="number" min="0" value={manufacturingCost} onChange={(e) => setManufacturingCost(Number(e.target.value) || 0)} placeholder="0" className="mt-1" />\n                </div>\n                <div>\n                  <label className="text-xs text-slate-500">📋 管理费用</label>\n                  <Input type="number" min="0" value={adminCost} onChange={(e) => setAdminCost(Number(e.target.value) || 0)} placeholder="0" className="mt-1" />\n                </div>\n                <div>\n                  <label className="text-xs text-slate-500">💰 利润</label>\n                  <Input type="number" min="0" value={profit} onChange={(e) => setProfit(Number(e.target.value) || 0)} placeholder="0" className="mt-1" />\n                </div>\n                <div>\n                  <label className="text-xs text-slate-500">🧾 税金</label>\n                  <Input type="number" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} placeholder="0" className="mt-1" />\n                </div>\n              </div>\n              <div className="mt-3 pt-3 border-t flex justify-between items-center">\n                <span className="text-sm text-slate-500">费用合计</span>\n                <span className="text-lg font-bold text-slate-800">¥{(materialSum + laborCost + manufacturingCost + adminCost + profit + tax).toLocaleString()}</span>\n              </div>\n            </div>\n\n            <div className="rounded-lg border overflow-hidden">\n              <Table>';

content = content.replace(oldTableStart, newTableStart);

// 4. Update onSubmit to include cost fields
const oldBody = 'body: JSON.stringify({ account: supplierAccount, projectId, supplierAccount, supplierName: supplierName || supplierAccount, items, total }),';

const newBody = 'body: JSON.stringify({ account: supplierAccount, projectId, supplierAccount, supplierName: supplierName || supplierAccount, items, total, laborCost, manufacturingCost, adminCost, profit, tax }),';

content = content.replace(oldBody, newBody);

// 5. Update the submit to use grandTotal
const oldTotal = 'const total = calcTotal()';
const newTotal = 'const total = grandTotal';

content = content.replace(oldTotal, newTotal);

// 6. Update the summary display to show grand total
const oldSummary = '<span className="text-2xl font-bold text-slate-800">¥ {fmtTotal}</span>';
const newSummary = '<span className="text-2xl font-bold text-slate-800">¥ {grandTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</span>';

content = content.replace(oldSummary, newSummary);

// 7. Update success page to show grand total
const oldSuccess = '<span className="text-xl font-bold text-red-600">¥{bidResult.total.toLocaleString()}</span>';
const newSuccess = '<span className="text-xl font-bold text-red-600">¥{bidResult.total.toLocaleString()}</span>';

// No change needed for success page - bidResult.total already uses grandTotal

fs.writeFileSync(file, content, "utf-8");
console.log("Cost breakdown form added to supplier quote form");
