const fs = require('fs');
let srv = fs.readFileSync('server/server.js', 'utf8');
console.log('File length:', srv.length);
console.log('Has create-user:', srv.includes('create-user'));
console.log('Has ZBStart:', srv.includes('启动服务'));
