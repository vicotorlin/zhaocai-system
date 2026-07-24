const fs = require("fs");
const path = require("path");

const testBytes = Buffer.alloc(10240);
for (let i = 0; i < testBytes.length; i++) testBytes[i] = i % 256;
const testFile = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "test-original.bin");
fs.writeFileSync(testFile, testBytes);
console.log("Created: " + testBytes.length + " bytes");

// Use built-in undici fetch with manual multipart
const boundary = "----TestBoundary" + Date.now();
const CRLF = "\r\n";

let bodyParts = [];
bodyParts.push(Buffer.from("--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="file"; filename="test.bin"' + CRLF));
bodyParts.push(Buffer.from("Content-Type: application/octet-stream" + CRLF + CRLF));
bodyParts.push(testBytes);
bodyParts.push(Buffer.from(CRLF + "--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="projectId"' + CRLF + CRLF));
bodyParts.push(Buffer.from("ZB-TEST"));
bodyParts.push(Buffer.from(CRLF + "--" + boundary + CRLF));
bodyParts.push(Buffer.from('Content-Disposition: form-data; name="uploadedBy"' + CRLF + CRLF));
bodyParts.push(Buffer.from("buyer1@test.com"));
bodyParts.push(Buffer.from(CRLF + "--" + boundary + "--" + CRLF));

const body = Buffer.concat(bodyParts);

async function test() {
  const uploadResp = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
    body: body
  });
  const result = await uploadResp.json();
  console.log("Upload:", JSON.stringify(result).substring(0, 300));

  if (result.success && result.data?.signed_url) {
    const dlUrl = "http://localhost:3000" + result.data.signed_url;
    const dlResp = await fetch(dlUrl);
    const dlBuffer = Buffer.from(await dlResp.arrayBuffer());
    console.log("DL size:", dlBuffer.length);
    const match = testBytes.equals(dlBuffer);
    console.log("Bytes match:", match);
    if (!match) {
      for (let i = 0; i < dlBuffer.length; i++) {
        if (dlBuffer[i] !== testBytes[i]) {
          console.log("First diff at byte " + i + ": orig=0x" + testBytes[i].toString(16) + " dl=0x" + dlBuffer[i].toString(16));
          break;
        }
      }
    }
  } else {
    console.log("Upload failed:", result.message);
  }
}
test().catch(e => console.error(e.message));
