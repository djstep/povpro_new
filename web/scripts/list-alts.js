const fs=require('fs');
const s=fs.readFileSync('D:/povpro_new/web/content/en/frikcionnye-nakladki__nashi-izdeliya.html','utf8');
const re=/alt="([^"]*)"/g; let m; while((m=re.exec(s))) console.log(m[1]);
