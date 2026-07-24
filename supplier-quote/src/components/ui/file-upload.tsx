import { useState, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const ALLOWED_EXTS = ["pdf", "zip", "dwg", "dxf", "dgn"]
const MAX_SIZE = 50 * 1024 * 1024
const BUCKET = "attachments"

interface UploadedFile {
  id: string
  file_name: string
  file_size: number
  file_ext: string
  signed_url: string
  created_at: string
}

interface FileUploadProps {
  projectId?: string
}

export function FileUpload({ projectId }: FileUploadProps) {
  const [supabase, setSupabase] = useState<any | null>(null)
  const [connected, setConnected] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressFile, setProgressFile] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const keyRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const connect = useCallback(() => {
    const url = urlRef.current?.value?.trim() || localStorage.getItem("supabase_url") || ""
    const key = keyRef.current?.value?.trim() || localStorage.getItem("supabase_key") || ""
    if (!url || !key) { showToast("请输入 Supabase URL 和 Key", "error"); return }
    localStorage.setItem("supabase_url", url)
    localStorage.setItem("supabase_key", key)
    try {
      const client = createClient(url, key)
      setSupabase(client)
      setConnected(true)
      loadFiles(client)
    } catch { showToast("连接失败", "error") }
  }, [])

  // Auto-connect on mount if saved
  useState(() => {
    const url = localStorage.getItem("supabase_url")
    const key = localStorage.getItem("supabase_key")
    if (url && key) {
      try {
        const client = createClient(url, key)
        setSupabase(client)
        setConnected(true)
        loadFiles(client)
      } catch { /* ignore */ }
    }
  })

  async function loadFiles(client: any) {
    try {
      const { data, error } = await client.from("attachments").select("*").eq("status", "active").order("created_at", { ascending: false })
      if (error) throw error
      setFiles((data || []).map((r: any) => ({ id: r.id, file_name: r.file_name, file_size: r.file_size, file_ext: r.file_ext, signed_url: r.signed_url, created_at: r.created_at })))
    } catch { /* ignore */ }
  }

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !supabase) return
    const filesArr = Array.from(fileList)
    for (const file of filesArr) {
      if (file.size > MAX_SIZE) { showToast(`${file.name} 超过50MB限制`, "error"); continue }
      if (file.size === 0) { showToast(`${file.name} 为空`, "error"); continue }
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      if (!ALLOWED_EXTS.includes(ext)) { showToast(`不支持 .${ext} 格式`, "error"); continue }

      setUploading(true)
      setProgressFile(file.name)
      setProgress(0)

      const now = new Date()
      const dp = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`
      const sp = `uploads/${dp}/${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`

      try {
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(sp, file, { cacheControl: "3600", upsert: false })
        if (upErr) throw upErr
        setProgress(100)

        const { data: sigData, error: sigErr } = await supabase.storage.from(BUCKET).createSignedUrl(sp, 60*60*24*7)
        if (sigErr) throw sigErr
        const signedUrl = sigData.signedUrl

        const { data: insData, error: insErr } = await supabase.from("attachments").insert({
          project_id: projectId || null,
          file_name: file.name, file_size: file.size,
          file_type: file.type || "application/octet-stream", file_ext: ext,
          bucket_name: BUCKET, storage_path: sp,
          signed_url: signedUrl,
          signed_url_expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(),
          uploaded_by: "system", upload_ip: "0.0.0.0", status: "active"
        }).select()
        if (insErr) throw insErr

        const newFile: UploadedFile = { id: insData[0].id, file_name: file.name, file_size: file.size, file_ext: ext, signed_url: signedUrl, created_at: insData[0].created_at }
        setFiles(prev => [newFile, ...prev])
        showToast(`${file.name} 上传成功`, "success")
      } catch (e: any) {
        showToast(`上传失败: ${e.message || "未知错误"}`, "error")
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("确定删除？")) return
    try {
      await supabase.from("attachments").update({ status: "deleted" }).eq("id", id)
      setFiles(prev => prev.filter(f => f.id !== id))
      showToast("已删除", "success")
    } catch { showToast("删除失败", "error") }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => showToast("已复制", "success")).catch(() => showToast("复制失败", "error"))
  }

  const fmtSize = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
    return `${(b/1048576).toFixed(1)} MB`
  }

  const fmtDate = (d: string) => {
    if (!d) return ""
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
  }

  const getIcon = (ext: string) => {
    if (ext === "pdf") return { emoji: "📄", cls: "bg-red-50 text-red-500" }
    if (ext === "zip") return { emoji: "📦", cls: "bg-orange-50 text-orange-500" }
    return { emoji: "📐", cls: "bg-blue-50 text-blue-600" }
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">📎 投标附件上传</h3>
      <p className="text-xs text-slate-400 mb-4">支持 PDF / ZIP / CAD（.dwg .dxf .dgn），单文件最大 50MB</p>

      {/* Config */}
      {!connected && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <input ref={urlRef} defaultValue={localStorage.getItem("supabase_url") || ""} placeholder="Supabase URL" className="flex-1 min-w-[160px] h-9 border rounded-md px-3 text-sm outline-none focus:border-slate-400" />
          <input ref={keyRef} defaultValue={localStorage.getItem("supabase_key") || ""} placeholder="anon key" className="flex-1 min-w-[160px] h-9 border rounded-md px-3 text-sm outline-none focus:border-slate-400" />
          <button onClick={connect} className="h-9 px-4 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700 shrink-0">连接</button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors mb-4"
      >
        <div className="text-3xl mb-2">📤</div>
        <div className="text-sm font-medium text-slate-600">点击或拖拽文件到此处上传</div>
        <div className="text-xs text-slate-400 mt-1">
          支持 <strong className="text-slate-600">PDF</strong> / <strong className="text-slate-600">ZIP</strong> / <strong className="text-slate-600">CAD</strong>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.zip,.dwg,.dxf,.dgn" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* Progress */}
      {uploading && (
        <div className="mb-4">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{progressFile}</span><span>{progress}%</span>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="text-sm font-medium text-slate-700 mb-2">已上传附件 ({files.length})</div>
      {files.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">暂无上传文件</div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const icon = getIcon(f.file_ext)
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0 ${icon.cls}`}>{icon.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{f.file_name}</div>
                  <div className="text-xs text-slate-400">{fmtSize(f.file_size)} · {f.file_ext?.toUpperCase()} · {fmtDate(f.created_at)}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => f.signed_url && window.open(f.signed_url, "_blank")} className="h-7 px-3 text-xs border rounded hover:border-slate-400 hover:text-slate-700">预览</button>
                  <button onClick={() => f.signed_url && copyUrl(f.signed_url)} className="h-7 px-3 text-xs border rounded hover:border-slate-400 hover:text-slate-700">复制</button>
                  <button onClick={() => handleDelete(f.id)} className="h-7 px-3 text-xs border rounded hover:border-red-400 hover:text-red-500">删除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
