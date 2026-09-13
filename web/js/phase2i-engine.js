const CFG={listening:{label:"Listening",seconds:1800},academic_reading:{label:"Academic Reading",seconds:3600},general_reading:{label:"General Training Reading",seconds:3600}};
let S={section:null,index:0,answers:{},flags:{},remaining:0};
const $=s=>document.querySelector(s); const bank=()=>window.PRACTICE_DATA[S.section]||[];
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function save(){localStorage.setItem("buye2i_"+S.section,JSON.stringify(S));}
function load(sec){let x=localStorage.getItem("buye2i_"+sec);if(x){try{S=JSON.parse(x);return}} S={section:sec,index:0,answers:{},flags:{},remaining:CFG[sec].seconds};}
function speak(txt){if(S.section!=="listening"||!txt||!speechSynthesis)return;speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(txt);u.rate=.9;speechSynthesis.speak(u)}
function render(){
 let q=bank()[S.index]; if(!q)return;
 $("#title").textContent=CFG[S.section].label;$("#counter").textContent=`Question ${S.index+1} of 40`;
 $("#timer").textContent=`${String(Math.floor(S.remaining/60)).padStart(2,"0")}:${String(S.remaining%60).padStart(2,"0")}`;
 $("#passage").textContent=q.passage_text||q.passage||"";
 $("#question").innerHTML=`<h2>${esc(q.prompt)}</h2><div class="choices">${(q.options||[]).map((o,i)=>{let a=String.fromCharCode(65+i);return `<button class="choice ${S.answers[S.index]===a?"selected":""}" data-a="${a}">${a}. ${esc(o)}</button>`}).join("")}</div>`;
 document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{S.answers[S.index]=b.dataset.a;save();render()});
 $("#flag").textContent=S.flags[S.index]?"⚑ Flagged":"⚐ Flag";
 $("#nav").innerHTML=bank().map((_,i)=>`<button class="${i===S.index?"cur ":""}${S.answers[i]?"ans ":""}${S.flags[i]?"flag":""}" data-i="${i}">${i+1}</button>`).join("");
 document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{S.index=+b.dataset.i;save();render()});
 if(S.section==="listening"&&!S.answers[S.index])speak(q.script);
}
function band(score,type){let a=type==="general"?[[35,7],[30,6],[23,5],[19,4.5],[15,4],[13,3.5],[10,3]]:[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4]];for(let x of a)if(score>=x[0])return x[1];return 3}
function finish(){clearInterval(T);let qs=bank(),score=qs.reduce((n,q,i)=>n+(S.answers[i]===q.answer?1:0),0),b=band(score,S.section==="general_reading"?"general":"academic");localStorage.setItem("buye2i_latest",JSON.stringify({section:S.section,score,band:b,at:new Date().toISOString()}));$("#app").innerHTML=`<section class="result"><p>BUYE IELTS · Phase 2I</p><h1>${CFG[S.section].label} complete</h1><div class="big">${score}<small>/40</small></div><h2>Estimated practice band: ${b}</h2><p>Answers, flags and timing data were saved locally in this browser.</p><p class="muted">This is an original practice estimate; exact IELTS raw-score boundaries can vary by test version.</p><button onclick="location.href='practice.html'">Back to Mock Centre</button></section>`}
function start(sec){load(sec);$("#app").innerHTML=$("#template").innerHTML;render();T=setInterval(()=>{S.remaining--;save();if(S.remaining<=0)finish();else $("#timer").textContent=`${String(Math.floor(S.remaining/60)).padStart(2,"0")}:${String(S.remaining%60).padStart(2,"0")}`},1000);$("#prev").onclick=()=>{S.index=Math.max(0,S.index-1);save();render()};$("#next").onclick=()=>{S.index=Math.min(39,S.index+1);save();render()};$("#flag").onclick=()=>{S.flags[S.index]=!S.flags[S.index];save();render()};$("#submit").onclick=()=>confirm("Finish this section?")&&finish()}
fetch("data/practice-tests.json").then(r=>r.json()).then(d=>{window.PRACTICE_DATA=d;window.start=start;document.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>start(b.dataset.start))});
