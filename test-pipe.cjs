const fs = require("fs");
const path = require("path");

async function main() {
  const testContent = Buffer.from("This is test file content for upload verification. " + Date.now());
  
  const form = new FormData();
  form.append("file", new Blob([testContent]), "test.bin");
  form.append("projectId", "ZB-TEST");
  form.append("uploadedBy", "test");
  form.append("originalFileName", "test.bin");
  
  console.log("Uploading", testContent.length, "bytes...");
  const r = await fetch("http://localhost:3000/api/upload", { method: "POST", body: form });
  const d = await r.json();
  console.log("Response:", JSON.stringify(d));
  
  if (d.success) {
    const fileUrl = d.data.signed_url;
    console.log("Downloading from:", "http://localhost:3000" + fileUrl);
    const dr = await fetch("http://localhost:3000" + fileUrl);
    const buf = Buffer.from(await dr.arrayBuffer());
    console.log("Original:", testContent.length, "bytes");
    console.log("Downloaded:", buf.length, "bytes, status:", dr.status);
    console.log("Content-Type:", dr.headers.get("content-type"));
    console.log("Match:", buf.equals(testContent) ? "YES - PERFECT" : "NO - CORRUPTED!");
    
    // Check disk
    const upDir = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/outputs/uploads";
    const diskPath = path.join(upDir, d.data.storage_path);
    if (fs.existsSync(diskPath)) {
      const diskBuf = fs.readFileSync(diskPath);
      console.log("Disk file:", diskBuf.length, "bytes, match:", diskBuf.equals(testContent) ? "OK" : "NO");
    } else {
      console.log("Disk file NOT FOUND at:", diskPath);
    }
  }
}
main().catch(e => console.error("ERROR:", e.message));
