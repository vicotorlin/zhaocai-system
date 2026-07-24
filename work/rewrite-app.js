const fs = require("fs");
const file = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier-quote/src/App.tsx";

const newContent = `import { useState, useRef, useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Calculator } from "lucide-react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table"

// ==================== Zod Schema ====================
const quoteItemSchema = z.object({
  materialName: z.string().min(1, "请输入物料名称"),
  spec: z.string().min(1, "请输入规格"),
  quantity: z.coerce.number().min(0.01, "数量必须大于 0"),
  unitPrice: z.coerce.number().min(0.01, "单价必须大于 0"),
})

const quoteFormSchema = z.object({
  items: z.array(quoteItemSchema).min(1, "至少添加一行物料"),
})

type QuoteFormValues = z.infer<typeof quoteFormSchema>
type QuoteItem = { materialName: string; spec: string; quantity: number; unitPrice: number }

const API_BASE = "http://localhost:3000"

// ==================== 表单组件 (可独立挂载) ====================
function QuoteForm({
  projectId, projectName, supplierAccount, supplierName, buyer, budget,
  bidId, initialItems,
}: {
  projectId: string; projectName: string; supplierAccount: string; supplierName: string;
  buyer: string; budget: string; bidId: string;
  initialItems: QuoteItem[];
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [bidResult, setBidResult] = useState<{ id: string; total: number } | null>(null)

  const {
    control, register, handleSubmit, watch,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { items: initialItems.length > 0 ? initialItems : [{ materialName: "", spec: "", quantity: 1, unitPrice: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const watchedItems = watch("items")

  const calcSubtotal = (idx: number) => {
    const item = watchedItems[idx]
    if (!item) return 0
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
  }

  const calcTotal = () =>
    watchedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0)

  const onSubmit = async (data: QuoteFormValues) => {
    if (!projectId) { setSubmitResult({ success: false, message: "缺少项目ID" }); return }
    if (!supplierAccount) { setSubmitResult({ success: false, message: "缺少供应商账号信息" }); return }
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const items = data.items.map((it, i) => ({ ...it, subtotal: calcSubtotal(i) }))
      const total = calcTotal()
      const method = bidId ? "PUT" : "POST"
      const url = bidId ? API_BASE + "/api/supplier/bid/" + bidId : API_BASE + "/api/supplier/bid"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: supplierAccount, projectId, supplierAccount, supplierName: supplierName || supplierAccount, items, total }),
      })
      const json = await res.json()
      if (json.success) {
        setBidResult({ id: json.data.id, total })
      } else {
        setSubmitResult({ success: false, message: json.message || "提交失败" })
      }
    } catch (e: any) {
      setSubmitResult({ success: false, message: "网络错误: " + (e.message || "未知") })
    } finally { setSubmitting(false) }
  }

  const fmtSubtotal = (idx: number) => calcSubtotal(idx).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
  const fmtTotal = calcTotal().toLocaleString("zh-CN", { minimumFractionDigits: 2 })

  if (bidResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center py-6 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-emerald-700 mb-2">报价提交成功！</h1>
          <p className="text-slate-500 mb-6">您的报价已成功提交，采购方将进行审核</p>
          <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between"><span className="text-slate-500">报价单号</span><span className="font-mono font-bold text-slate-800">{bidResult.id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">报价项目</span><span className="font-medium text-slate-700">{projectName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">供应商</span><span className="font-medium text-slate-700">{supplierName || supplierAccount}</span></div>
            <div className="border-t pt-3 flex justify-between"><span className="text-slate-700 font-semibold">总报价金额</span><span className="text-xl font-bold text-red-600">¥{bidResult.total.toLocaleString()}</span></div>
          </div>
          <button onClick={() => { setBidResult(null); setSubmitResult(null); }} className="w-full py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium">继续报价</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{bidId ? '✏️ 修改报价' : '📝 供应商报价填写'}</h1>
          <p className="text-sm text-slate-500 mt-1">逐行填写物料信息，系统自动计算小计与总报价</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            {projectId && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-slate-700 flex flex-wrap gap-x-6 gap-y-1">
                <span><strong>项目：</strong>{projectName}（{projectId}）</span>
                <span><strong>采购单位：</strong>{buyer}</span>
                <span><strong>供应商：</strong>{supplierName || supplierAccount}</span>
                <span><strong>预算：</strong>¥{Number(budget || 0).toLocaleString()}</span>
              </div>
            )}
            {submitResult && (
              <div className={'mb-4 p-3 rounded-lg text-sm font-medium ' + (submitResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                {submitResult.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div><label className="text-sm font-medium text-slate-600">供应商名称</label><Input placeholder="请输入供应商名称" defaultValue={supplierName || supplierAccount} className="mt-1.5" /></div>
              <div><label className="text-sm font-medium text-slate-600">报价项目</label><Input placeholder="请输入报价项目名称" defaultValue={projectName} className="mt-1.5" /></div>
              <div><label className="text-sm font-medium text-slate-600">报价有效期</label><Input placeholder="如：30天" className="mt-1.5" /></div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>物料名称 *</TableHead>
                    <TableHead>规格 *</TableHead>
                    <TableHead className="w-28">数量 *</TableHead>
                    <TableHead className="w-36">单价 (元) *</TableHead>
                    <TableHead className="w-36">小计 (元)</TableHead>
                    <TableHead className="w-20 text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, idx) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-center text-slate-400 text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <Input {...register('items.' + idx + '.materialName')} placeholder="如：服务器主机" className={errors.items?.[idx]?.materialName ? "border-red-400" : ""} />
                        {errors.items?.[idx]?.materialName && <p className="text-xs text-red-500 mt-1">{errors.items[idx]!.materialName!.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register('items.' + idx + '.spec')} placeholder="如：Dell R750xs" className={errors.items?.[idx]?.spec ? "border-red-400" : ""} />
                        {errors.items?.[idx]?.spec && <p className="text-xs text-red-500 mt-1">{errors.items[idx]!.spec!.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register('items.' + idx + '.quantity', { valueAsNumber: true })} type="number" min="0" step="1" placeholder="0" className={errors.items?.[idx]?.quantity ? "border-red-400" : ""} />
                        {errors.items?.[idx]?.quantity && <p className="text-xs text-red-500 mt-1">{errors.items[idx]!.quantity!.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register('items.' + idx + '.unitPrice', { valueAsNumber: true })} type="number" min="0" step="0.01" placeholder="0.00" className={errors.items?.[idx]?.unitPrice ? "border-red-400" : ""} />
                        {errors.items?.[idx]?.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.items[idx]!.unitPrice!.message}</p>}
                      </TableCell>
                      <TableCell><span className="font-semibold text-slate-700">¥ {fmtSubtotal(idx)}</span></TableCell>
                      <TableCell className="text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length <= 1} className="text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => append({ materialName: "", spec: "", quantity: 0, unitPrice: 0 })} className="text-slate-600"><Plus className="w-4 h-4 mr-1.5" />添加一行</Button>
            </div>
            {errors.items && !Array.isArray(errors.items) && <p className="text-sm text-red-500 mt-3">{errors.items.message}</p>}
          </div>

          {/* 投标附件上传 */}
          <InlineFileUpload projectId={projectId} />

          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-500">报价汇总</span>
              <span className="text-2xl font-bold text-slate-800">¥ {fmtTotal}</span>
            </div>
            <div className="flex gap-3 self-end sm:self-auto">
              <Button type="button" variant="outline">保存草稿</Button>
              <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50">{submitting ? "提交中..." : "提交报价"}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== 主 App ====================
function App() {
  const searchParams = new URLSearchParams(window.location.search)
  const projectId = searchParams.get("projectId") || ""
  const projectName = searchParams.get("projectName") || ""
  const supplierAccount = searchParams.get("supplierAccount") || ""
  const supplierName = searchParams.get("supplierName") || ""
  const buyer = searchParams.get("buyer") || ""
  const budget = searchParams.get("budget") || ""
  const bidId = searchParams.get("bidId") || ""

  const [initialItems, setInitialItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(!!bidId)

  useEffect(() => {
    if (!bidId || !supplierAccount) { setLoading(false); return }
    fetch(API_BASE + "/api/supplier/bid/" + bidId + "?account=" + encodeURIComponent(supplierAccount))
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setInitialItems(json.data.items.map((it: any) => ({
            materialName: it.materialName || "", spec: it.spec || "",
            quantity: it.quantity || 1, unitPrice: it.unitPrice || 0
          })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [bidId, supplierAccount])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-500 text-lg">加载报价数据...</div></div>
  }

  return <QuoteForm
    key={bidId || "new"}
    projectId={projectId} projectName={projectName}
    supplierAccount={supplierAccount} supplierName={supplierName}
    buyer={buyer} budget={budget} bidId={bidId}
    initialItems={initialItems}
  />
}

// ==================== 内联文件上传组件 ====================
const ALLOWED_EXTS = ["pdf", "zip", "dwg", "dxf", "dgn"]
const MAX_SIZE = 50 * 1024 * 1024

interface UploadedFile {
  id: string; file_name: string; file_size: number; file_ext: string; signed_url: string; created_at: string
}

function InlineFileUpload({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progressFile, setProgressFile] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: string) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!projectId) return
    fetch(API_BASE + "/api/attachments/" + projectId)
      .then(r => r.json()).then(data => { if (data.success) setFiles(data.data || []) }).catch(() => {})
  }, [projectId])

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList) return
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_SIZE) { showToast(file.name + " 超过50MB限制", "error"); continue }
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      if (!ALLOWED_EXTS.includes(ext)) { showToast("不支持 ." + ext + " 格式", "error"); continue }
      setUploading(true); setProgressFile(file.name)
      const fd = new FormData(); fd.append("file", file); fd.append("projectId", projectId); fd.append("uploadedBy", "supplier")
      try {
        const res = await fetch(API_BASE + "/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (json.success) { setFiles(prev => [json.data, ...prev]); showToast(file.name + " 上传成功", "success") }
        else { showToast(json.message || "上传失败", "error") }
      } catch (e: any) { showToast("上传失败: " + (e.message || "网络错误"), "error") }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(API_BASE + "/api/attachments/" + id, { method: "DELETE" })
      const json = await res.json()
      if (json.success) { setFiles(prev => prev.filter(f => f.id !== id)); showToast("附件已删除", "success") }
    } catch { showToast("删除失败", "error") }
  }

  const fmtSize = (bytes: number) => bytes < 1024 ? bytes + " B" : bytes < 1048576 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / 1048576).toFixed(1) + " MB"

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">📎 投标附件上传</h3>
      <p className="text-xs text-slate-400 mb-4">支持 PDF / ZIP / CAD（.dwg .dxf .dgn），单文件最大 50MB</p>
      <div onDrop={(e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }} onDragOver={(e: React.DragEvent) => { e.preventDefault() }} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors mb-4">
        <div className="text-3xl mb-2">📤</div>
        <div className="text-sm font-medium text-slate-600">点击或拖拽文件到此处上传</div>
        <div className="text-xs text-slate-400 mt-1">支持 <strong className="text-slate-600">PDF</strong> / <strong className="text-slate-600">ZIP</strong> / <strong className="text-slate-600">CAD</strong></div>
        <input ref={fileInputRef} type="file" accept=".pdf,.zip,.dwg,.dxf,.dgn" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>
      {uploading && <div className="mb-4"><div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: "60%" }} /></div><div className="text-xs text-slate-500 mt-1">正在上传: {progressFile}</div></div>}
      <div className="text-sm font-medium text-slate-700 mb-2">已上传附件 ({files.length})</div>
      {files.length === 0 ? <div className="text-center py-8 text-sm text-slate-400">暂无上传文件</div> : (
        <div className="space-y-2">
          {files.map((f) => {
            const ext = (f.file_ext || "").toLowerCase()
            const iconCls = ext === "pdf" ? "bg-red-50 text-red-500" : ext === "zip" ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-600"
            const iconEmoji = ext === "pdf" ? "📄" : ext === "zip" ? "📦" : "📐"
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className={"w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0 " + iconCls}>{iconEmoji}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{f.file_name}</div><div className="text-xs text-slate-400">{fmtSize(f.file_size)} · {(f.file_ext || "").toUpperCase()} · {f.created_at ? new Date(f.created_at).toLocaleString() : ""}</div></div>
                <div className="flex gap-1 shrink-0">
                  {f.signed_url && <button type="button" onClick={() => window.open(f.signed_url, "_blank")} className="h-7 px-3 text-xs border rounded hover:border-slate-400">预览</button>}
                  <button type="button" onClick={() => handleDelete(f.id)} className="h-7 px-3 text-xs border rounded hover:border-red-400 hover:text-red-500">删除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {toast && <div className={"fixed top-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 " + (toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>{toast.msg}</div>}
    </div>
  )
}

export default App
`;

fs.writeFileSync(file, newContent, "utf-8");
console.log("App.tsx fully rewritten, length:", newContent.length);
