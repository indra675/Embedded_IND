// Study site server: serves the site + F.R.I.D.A.Y AI proxy. No dependencies (Node 18+).
// Progress is saved in each visitor's own browser (localStorage).
// Set ANTHROPIC_API_KEY to enable FRIDAY's AI answers (without it, FRIDAY falls back to on-page search).
const http=require('http'),fs=require('fs'),path=require('path');
const PAGE=path.join(__dirname,'index.html');
const KEY=process.env.ANTHROPIC_API_KEY,MODEL=process.env.FRIDAY_MODEL||'claude-sonnet-4-6';
const SYS=`You are F.R.I.D.A.Y, a friendly, sharp study assistant built into a website that teaches C, Embedded C, protocols (UART, SPI, I2C, CAN...), RTOS, microcontrollers, IoT, HTML/CSS and JavaScript.
Help the learner understand the topic they are reading. Be concise (under ~200 words unless asked), use simple language, short code examples in fenced blocks, and analogies. For quizzes ask one question at a time. If a question is unrelated to studying or programming, answer briefly and steer back. If unsure, say so rather than guessing.`;
const hits=new Map();
function limited(ip){const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<60000);a.push(n);hits.set(ip,a);return a.length>20}
function friday(q,r){
 const ip=q.headers['x-forwarded-for']||q.socket.remoteAddress;
 const out=(c,o)=>{r.writeHead(c,{'Content-Type':'application/json'});r.end(JSON.stringify(o))};
 if(!KEY)return out(503,{error:'no key'});
 if(limited(ip))return out(429,{error:'slow down'});
 let b='';q.on('data',d=>{b+=d;if(b.length>60000)q.destroy()});
 q.on('end',async()=>{
  try{
   const j=JSON.parse(b),c=j.context||{};
   const msgs=(j.messages||[]).slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content).slice(0,4000)}));
   if(!msgs.length||msgs[0].role!=='user')return out(400,{error:'bad'});
   const system=SYS+`\n\nThe learner is reading the "${String(c.book||'').slice(0,100)}" tab, section "${String(c.section||'').slice(0,150)}". Section text:\n${String(c.text||'').slice(0,6000)}`;
   const a=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
    headers:{'content-type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model:MODEL,max_tokens:900,system,messages:msgs})});
   const d=await a.json();
   if(!a.ok)return out(502,{error:d.error?.message||'upstream'});
   out(200,{reply:(d.content||[]).map(x=>x.text||'').join('')});
  }catch(e){out(500,{error:'fail'})}
 });
}
http.createServer((q,r)=>{
 const u=q.url.split('?')[0];
 if(u==='/api/friday'&&q.method==='POST')return friday(q,r);
 if(u==='/'||u==='/index.html'){fs.readFile(PAGE,(e,d)=>{r.writeHead(e?500:200,{'Content-Type':'text/html; charset=utf-8'});r.end(e?'error':d)});return}
 r.writeHead(404);r.end('Not found');
}).listen(process.env.PORT||3000,()=>console.log('Server running on port '+(process.env.PORT||3000)));
