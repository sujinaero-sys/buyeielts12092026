const topics=[
["Art & creativity","culture, censorship, education, funding"],
["Education","schools, universities, learning methods"],
["Environment","climate, pollution, conservation"],
["Technology","innovation, internet, automation"],
["Health","lifestyle, public health, healthcare"],
["Work & careers","employment, skills, workplace change"],
["Business & money","commerce, advertising, consumer choices"],
["Family & children","parenting, relationships, development"],
["Crime & society","law, punishment, social responsibility"],
["Government","public services, policy, spending"],
["Transport","cities, travel, infrastructure"],
["Tourism","travel, culture, destinations"],
["Media","news, entertainment, social platforms"],
["Communication","language, personality, interaction"],
["Food & diet","nutrition, habits, agriculture"],
["Sport & exercise","fitness, competition, public health"],
["Housing & cities","urban planning, buildings, communities"],
["Science & space","research, exploration, discovery"],
["Animals","wildlife, conservation, human responsibility"],
["Language","learning languages, global communication"]
];
document.getElementById("topics").innerHTML=topics.map(t=>`<div class="topic">${t[0]}<small>${t[1]}</small></div>`).join("");
document.querySelector(".menu-btn").addEventListener("click",()=>document.getElementById("navLinks").classList.toggle("open"));
const pairs=[["acquire","obtain / gain"],["important","significant / essential"],["increase","rise / grow"],["reduce","decrease / cut"],["common","widespread / frequent"],["difficult","challenging / demanding"],["help","assist / support"],["show","indicate / demonstrate"]];
let pi=0;
function newPair(){const box=document.querySelector(".lesson-box"); const p=pairs[pi++%pairs.length]; box.querySelector(".pair span:first-child").textContent=p[0]; box.querySelector(".pair span:last-child").textContent=p[1];}
