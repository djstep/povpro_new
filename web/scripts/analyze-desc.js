const fs=require('fs');
const s=fs.readFileSync('D:/povpro_new/web/content/frikcionnye-nakladki__nashi-izdeliya.html','utf8');
const tds=[...new Set([...s.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m=>m[1].trim()).filter(t=>/[\u0400-\u04FF]/.test(t)))];
const keys=['пресс','Пресс','Муфта','муфта','Тормоз','Ножницы','Угловые','Круглые','отверст','без ','С ','лыской','рулон','валков','лебёд','Буров','колодк','фрикцион','Комацу','Шулер','Эрфурт','т.с','тн '];
for(const k of keys){
  const m=tds.filter(t=>t.includes(k));
  if(m.length) { console.log('\n==='+k+' ('+m.length+')==='); m.slice(0,15).forEach(x=>console.log(x)); }
}
