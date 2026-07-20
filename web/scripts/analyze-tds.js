const fs=require('fs');
const s=fs.readFileSync('D:/povpro_new/web/content/frikcionnye-nakladki__nashi-izdeliya.html','utf8');
const tds=[...s.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m=>m[1].trim()).filter(t=>/[\u0400-\u04FF]/.test(t));
const counts={};
for(const t of tds) counts[t]=(counts[t]||0)+1;
const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
for(const [t,c] of sorted.slice(0,80)) console.log(c+'\t'+t);
console.log('total unique', sorted.length);
