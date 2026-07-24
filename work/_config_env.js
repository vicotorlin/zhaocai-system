const fs = require("fs");
const path = require("path");

const envPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", ".env");
let content = fs.readFileSync(envPath, "utf8");

// Replace commented Supabase lines with actual values
const supabaseUrl = "https://gjbsglgbwsnnenlwamil.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqYnNnbGdid3NubmVubHdhbWlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg3NjQ5NCwiZXhwIjoyMTAwNDUyNDk0fQ.y1iQcigzDoxd0CNTSlwHFn-fgpSff-C8jlXFCODnzaw";

content = content.replace(
  "# SUPABASE_URL=",
  "SUPABASE_URL=" + supabaseUrl
);
content = content.replace(
  "# SUPABASE_ANON_KEY=",
  "SUPABASE_ANON_KEY=" + serviceRoleKey
);
content = content.replace(
  "# SUPABASE_SERVICE_ROLE_KEY=",
  "SUPABASE_SERVICE_ROLE_KEY=" + serviceRoleKey
);

fs.writeFileSync(envPath, content, "utf8");
console.log(".env configured with Supabase credentials");
console.log("SUPABASE_URL:", supabaseUrl);
console.log("Keys: set");
