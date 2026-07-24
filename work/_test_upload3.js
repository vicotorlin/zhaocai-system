const fs = require("fs");
const path = require("path");

// Create a proper test ZIP file with known binary content
const testBytes = Buffer.alloc(10240);
for (let i = 0; i < testBytes.length; i++) testBytes[i] = i % 256;

// Minimal ZIP file: local file header + data + central directory + EOCD
const filename = "test.txt";
const filenameBytes = Buffer.from(filename, "utf8");
const data = Buffer.from("Hello World - upload test");
const crc = require("crypto").createHash("crc32").update(data).digest();
const crcVal = crc.readUInt32LE(0);

const localHeader = Buffer.alloc(30 + filenameBytes.length);
let off = 0;
localHeader.writeUInt32LE(0x04034b50, off); off += 4;
localHeader.writeUInt16LE(20, off); off += 2;
localHeader.writeUInt16LE(0, off); off += 2;
localHeader.writeUInt16LE(0, off); off += 2;
localHeader.writeUInt32LE(0, off); off += 4; // crc placeholder
localHeader.writeUInt32LE(data.length, off); off += 4;
localHeader.writeUInt32LE(data.length, off); off += 4;
localHeader.writeUInt32LE(filenameBytes.length, off); off += 4;
localHeader.writeUInt32LE(0, off); off += 4;
filenameBytes.copy(localHeader, off);

const cdEntry = Buffer.alloc(46 + filenameBytes.length);
off = 0;
cdEntry.writeUInt32LE(0x02014b50, off); off += 4;
cdEntry.writeUInt16LE(20, off); off += 2;
cdEntry.writeUInt16LE(20, off); off += 2;
cdEntry.writeUInt16LE(0, off); off += 2;
cdEntry.writeUInt16LE(0, off); off += 2;
cdEntry.writeUInt32LE(0, off); off += 4; // crc placeholder
cdEntry.writeUInt32LE(data.length, off); off += 4;
cdEntry.writeUInt32LE(data.length, off); off += 4;
cdEntry.writeUInt32LE(filenameBytes.length, off); off += 4;
cdEntry.writeUInt32LE(0, off); off += 4;
cdEntry.writeUInt16LE(0, off); off += 2;
cdEntry.writeUInt16LE(0, off); off += 2;
cdEntry.writeUInt16LE(0, off); off += 2;
cdEntry.writeUInt32LE(0, off); off += 4;
cdEntry.writeUInt32LE(0, off); off += 4;
filenameBytes.copy(cdEntry, off);

const eocd = Buffer.alloc(22);
off = 0;
eocd.writeUInt32LE(0x06054b50, off); off += 4;
eocd.writeUInt16LE(0, off); off += 2;
eocd.writeUInt16LE(0, off); off += 2;
eocd.writeUInt16LE(1, off); off += 2;
eocd.writeUInt16LE(1, off); off += 2;
eocd.writeUInt32LE(cdEntry.length, off); off += 4;
eocd.writeUInt32LE(localHeader.length + data.length, off); off += 4;
eocd.writeUInt16LE(0, off); off += 2;

const zipBytes = Buffer.concat([localHeader, data, cdEntry, eocd]);
const testFile = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "test-original.zip");
fs.writeFileSync(testFile, zipBytes);
console.log("Created test ZIP: " + zipBytes.length + " bytes");

// Upload using stream-based approach
const http = require("http");

const boundary = "----TestBoundary" + Date.now();
const CRLF = "\r\n";

let bodyParts = [];
bodyParts.push(Buffer.from("--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="file"; filename="test.zip"' + CRLF));
bodyParts.push(Buffer.from("Content-Type: application/zip" + CRLF + CRLF));
bodyParts.push(zipBytes);
bodyParts.push(Buffer.from(CRLF + "--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="projectId"' + CRLF + CRLF));
bodyParts.push(Buffer.from("ZB-TEST"));
bodyParts.push(Buffer.from(CRLF + "--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="uploadedBy"' + CRLF + CRLF));
bodyParts.push(Buffer.from("buyer1@test.com"));
bodyParts.push(Buffer.from(CRLF + "--" + boundary + "--" + CRLF));

const body = Buffer.concat(bodyParts);
console.log("Request body size: " + body.length);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/upload",
  method: "POST",
  headers: {
    "Content-Type": "multipart/form-data; boundary=" + boundary,
    "Content-Length": body.length
  }
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Status: " + res.statusCode);
    console.log("Response: " + data.substring(0, 500));
    
    try {
      const result = JSON.parse(data);
      if (result.success && result.data?.signed_url) {
        const dlUrl = "http://localhost:3000" + result.data.signed_url;
        console.log("Download URL: " + dlUrl);
        
        http.get(dlUrl, (dlRes) => {
          const chunks = [];
          dlRes.on("data", c => chunks.push(c));
          dlRes.on("end", () => {
            const dlBuffer = Buffer.concat(chunks);
            console.log("DL size: " + dlBuffer.length);
            console.log("DL headers: " + JSON.stringify(dlRes.headers));
            const match = zipBytes.equals(dlBuffer);
            console.log("Bytes match: " + match);
            if (!match) {
              console.log("Original: " + zipBytes.length + " DL: " + dlBuffer.length);
              for (let i = 0; i < Math.min(zipBytes.length, dlBuffer.length); i++) {
                if (zipBytes[i] !== dlBuffer[i]) {
                  console.log("Diff at byte " + i + ": " + zipBytes[i].toString(16) + " vs " + dlBuffer[i].toString(16));
                  console.log("Context: " + dlBuffer.slice(Math.max(0,i-10), i+10).toString("hex"));
                  break;
                }
              }
            }
          });
        });
      }
    } catch(e) {
      console.log("JSON parse error: " + e.message);
    }
  });
});
req.on("error", e => console.error("Error:", e.message));
req.write(body);
req.end();
