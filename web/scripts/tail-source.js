const fs=require('fs');
const s=fs.readFileSync('D:/povpro_new/web/content/frikcionnye-nakladki__nashi-izdeliya.html','utf8');
const tail=s.slice(-8000);
console.log(tail);
