const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Create a known binary file with specific patterns
const testData = Buffer.alloc(10000);
for (let i = 0; i < testData.length; i++) testData[i] = i % 256;
// Add a PDF header pattern so multer accepts it
testData[0] = 0x25; testData[1] = 0x50; testData[2] = 0x44; testData[3] = 0x46; // %PDF
const testHash = crypto.createHash("md5").update(testData).digest("hex");
console.log("Original:", testData.length, "bytes, MD5:", testHash);

// Build multipart body manually
const boundary = "----TestBoundary" + Date.now();
const filename = "test-real.pdf";
const parts = [];
parts.push(Buffer.from(`--${boundary}\r\n`));
parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`));
parts.push(Buffer.from(`Content-Type: application/pdf\r\n\r\n`));
parts.push(testData);
parts.push(Buffer.from(`\r\n--${boundary}\r\n`));
parts.push(Buffer.from(`Content-Disposition: form-data; name="projectId"\r\n\r\n`));
parts.push(Buffer.from(`ZB-TEST3\r\n`));
parts.push(Buffer.from(`--${boundary}\r\n`));
parts.push(Buffer.from(`Content-Disposition: form-data; name="uploadedBy"\r\n\r\n`));
parts.push(Buffer.from(`test\r\n`));
parts.push(Buffer.from(`--${boundary}\r\n`));
parts.push(Buffer.from(`Content-Disposition: form-data; name="originalFileName"\r\n\r\n`));
parts.push(Buffer.from(`${filename}\r\n`));
parts.push(Buffer.from(`--${boundary}--\r\n`));
const body = Buffer.concat(parts);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/upload",
  method: "POST",
  headers: {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length
  }
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", async () => {
    const d = JSON.parse(data);
    console.log("Upload response:", JSON.stringify(d));
    
    if (d.success) {
      // Download the file
      const dlUrl = "http://localhost:3000" + d.data.signed_url;
      console.log("Download URL:", dlUrl);
      
      const dlReq = http.get(dlUrl, (dlRes) => {
        const chunks = [];
        dlRes.on("data", (c) => chunks.push(c));
        dlRes.on("end", () => {
          const dlData = Buffer.concat(chunks);
          const dlHash = crypto.createHash("md5").update(dlData).digest("hex");
          console.log("Downloaded:", dlData.length, "bytes, MD5:", dlHash);
          console.log("Match:", testHash === dlHash ? "PERFECT" : "CORRUPTED - MISMATCH!");
          
          // Also check file on disk
          const diskPath = path.join("C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/outputs/uploads", d.data.storage_path);
          if (fs.existsSync(diskPath)) {
            const diskData = fs.readFileSync(diskPath);
            const diskHash = crypto.createHash("md5").update(diskData).digest("hex");
            console.log("Disk file:", diskData.length, "bytes, MD5:", diskHash);
            console.log("Disk match:", testHash === diskHash ? "OK" : "MISMATCH");
          }
        });
      });
    }
  });
});
req.write(body);
req.end();
