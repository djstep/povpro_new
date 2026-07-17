const fs=require('fs');
const s=fs.readFileSync('D:/povpro_new/web/content/frikcionnye-nakladki__nashi-izdeliya.html','utf8');
const re=/alt="([^"]*)"/g; let m; const set=new Set();
while((m=re.exec(s))) set.add(m[1]);
console.log([...set].join('\n'));
