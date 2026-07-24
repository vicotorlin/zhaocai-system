const fs = require("fs");
const path = require("path");
const http = require("http");

// Create test binary with .zip extension
const testBytes = Buffer.alloc(10240);
for (let i = 0; i < testBytes.length; i++) testBytes[i] = i % 256;
console.log("Test data: " + testBytes.length + " bytes, first 16: " + testBytes.slice(0,16).toString("hex"));

const boundary = "----TestBoundary" + Date.now();

let parts = [
  "--" + boundary + "\r\n",
  'Content-Disposition: form-data; name="file"; filename="test.zip"' + "\r\n",
  "Content-Type: application/zip\r\n\r\n",
  testBytes,
  "\r\n--" + boundary + "\r\n",
  'Content-Disposition: form-data; name="projectId"' + "\r\n\r\n",
  "ZB-TEST",
  "\r\n--" + boundary + "\r\n",
  'Content-Disposition: form-data; name="uploadedBy"' + "\r\n\r\n",
  "buyer1@test.com",
  "\r\n--" + boundary + "--\r\n",
];

const body = Buffer.concat(parts.map(p => typeof p === "string" ? Buffer.from(p, "utf8") : p));
console.log("Body size: " + body.length);

const req = http.request({
  hostname: "localhost", port: 3000, path: "/api/upload", method: "POST",
  headers: { "Content-Type": "multipart/form-data; boundary=" + boundary, "Content-Length": body.length }
}, (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    console.log("Status: " + res.statusCode);
    console.log("Response: " + data.substring(0, 500));
    try {
      const r = JSON.parse(data);
      if (r.success && r.data?.signed_url) {
        const dlUrl = "http://localhost:3000" + r.data.signed_url;
        console.log("DL: " + dlUrl);
        http.get(dlUrl, (dlRes) => {
          const chunks = [];
          dlRes.on("data", c => chunks.push(c));
          dlRes.on("end", () => {
            const dlBuf = Buffer.concat(chunks);
            console.log("DL size: " + dlBuf.length + " Content-Type: " + dlRes.headers["content-type"] + " Content-Disposition: " + (dlRes.headers["content-disposition"] || "none"));
            const match = testBytes.equals(dlBuf);
            console.log("MATCH: " + match);
            if (!match) {
              for (let i = 0; i < Math.min(testBytes.length, dlBuf.length); i++) {
                if (testBytes[i] !== dlBuf[i]) { console.log("First diff at " + i + ": " + testBytes[i].toString(16) + " vs " + dlBuf[i].toString(16)); break; }
              }
            }
          });
        });
      }
    } catch(e) { console.log("JSON err: " + e.message); }
  });
});
req.on("error", e => console.error("Req err:", e.message));
req.write(body);
req.end();
