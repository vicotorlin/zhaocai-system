const fs = require("fs");
const path = require("path");

// Create a test binary file with known content
const testBytes = Buffer.alloc(10240);
for (let i = 0; i < testBytes.length; i++) {
  testBytes[i] = i % 256;
}
const testFile = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "test-original.bin");
fs.writeFileSync(testFile, testBytes);
console.log("Created test file: " + testFile + " (" + testBytes.length + " bytes)");
console.log("First 16 bytes: " + testBytes.slice(0, 16).toString("hex"));

// Upload via fetch with FormData
const FormData = require("form-data");
const fetch = require("node-fetch");

async function test() {
  const form = new FormData();
  form.append("file", testBytes, {
    filename: "test.bin",
    contentType: "application/octet-stream",
    knownLength: testBytes.length
  });
  form.append("projectId", "ZB-TEST");
  form.append("uploadedBy", "buyer1@test.com");

  const response = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    body: form,
    headers: form.getHeaders()
  });

  const result = await response.json();
  console.log("Upload result:", JSON.stringify(result, null, 2));

  if (result.success && result.data && result.data.signed_url) {
    const downloadUrl = "http://localhost:3000" + result.data.signed_url;
    console.log("Download URL:", downloadUrl);
    
    const dlResponse = await fetch(downloadUrl);
    const dlBuffer = Buffer.from(await dlResponse.arrayBuffer());
    console.log("Downloaded size:", dlBuffer.length);
    console.log("First 16 bytes: " + dlBuffer.slice(0, 16).toString("hex"));
    
    // Compare
    const match = testBytes.equals(dlBuffer);
    console.log("Bytes match:", match);
    
    // Show diff if mismatch
    if (!match) {
      console.log("Original length:", testBytes.length, "Downloaded length:", dlBuffer.length);
      for (let i = 0; i < Math.min(testBytes.length, dlBuffer.length); i++) {
        if (testBytes[i] !== dlBuffer[i]) {
          console.log("First diff at byte " + i + ": orig=" + testBytes.toString("hex", i, i+1) + " dl=" + dlBuffer.toString("hex", i, i+1));
          break;
        }
      }
      // Check for EF BF BD
      let countFFFD = 0;
      for (let i = 0; i < dlBuffer.length - 2; i++) {
        if (dlBuffer[i] === 0xEF && dlBuffer[i+1] === 0xBF && dlBuffer[i+2] === 0xBD) countFFFD++;
      }
      console.log("EF BF BD (U+FFFD) count in downloaded file:", countFFFD);
    }
  }
}

test().catch(e => console.error("Error:", e.message));
