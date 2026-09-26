const state={modules:[],currentFilter:"All",query:"",current:null,test:null,progress:JSON.parse(localStorage.getItem("buye_progress_v2")||"{}"),mistakes:JSON.parse(localStorage.getItem("buye_mistakes_v1")||"[]"),bookmarks:JSON.parse(localStorage.getItem("buye_bookmarks_v1")||"[]")};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* =========================================================
   IELTS ACCESS CONTROL — 2 / 7 / 157
   Visitor       : lessons 1–2
   Registered    : lessons 1–7
   Approved + OTP: lessons 1–157
   ========================================================= */

const IELTS_TOTAL_LESSONS = 157;
const IELTS_VISITOR_MAX = 2;
const IELTS_REGISTERED_MAX = 7;

state.accessLevel = "visitor";
state.maxLesson = IELTS_VISITOR_MAX;

function getRegisteredEmail(){
  return String(
    localStorage.getItem("buye_ielts_registered_email") || ""
  ).trim().toLowerCase();
}

function setRegisteredEmail(email){
  const value = String(email || "").trim().toLowerCase();

  if(value){
    localStorage.setItem(
      "buye_ielts_registered_email",
      value
    );
  }
}

function clearRegisteredEmail(){
  localStorage.removeItem(
    "buye_ielts_registered_email"
  );
}

function applyAccessLevel(level){

  if(level === "full"){
    state.accessLevel = "full";
    state.maxLesson = IELTS_TOTAL_LESSONS;
    return;
  }

  if(level === "registered"){
    state.accessLevel = "registered";
    state.maxLesson = IELTS_REGISTERED_MAX;
    return;
  }

  state.accessLevel = "visitor";
  state.maxLesson = IELTS_VISITOR_MAX;
}

function lessonNumber(id){
  const n = Number(id);
  return Number.isFinite(n) ? n : 0;
}

function isLessonAllowed(id){
  const n = lessonNumber(id);

  return (
    n >= 1 &&
    n <= state.maxLesson
  );
}

function showAccessNotice(message){

  const status =
    document.querySelector("#authStatus");

  if(status && message){
    status.textContent = message;
  }
}

function lockIELTS(){

  /*
   * Legacy function retained for logout compatibility.
   * It no longer hides the IELTS workspace.
   */
  document.body.classList.remove(
    "ielts-locked"
  );

  applyAccessLevel(
    getRegisteredEmail()
      ? "registered"
      : "visitor"
  );
}

function unlockIELTS(session){

  document.body.classList.remove(
    "ielts-locked"
  );

  if(
    session &&
    session.accessLevel === "full"
  ){
    applyAccessLevel("full");
    return;
  }

  if(
    session &&
    session.accessLevel === "registered"
  ){
    applyAccessLevel("registered");
    return;
  }

  applyAccessLevel(
    getRegisteredEmail()
      ? "registered"
      : "visitor"
  );
}

async function load(){

  /*
   * IELTS remains visible to visitors.
   * The lesson pool is restricted by maxLesson.
   */

  let accessLevel =
    getRegisteredEmail()
      ? "registered"
      : "visitor";

  const session =
    typeof getSession === "function"
      ? getSession()
      : null;

  if(session && session.token){

    try{

      const validation =
        await api(
          "validateSession",
          {
            token: session.token
          }
        );

      if(
        validation &&
        validation.ok
      ){

        accessLevel =
          validation.accessLevel === "full"
            ? "full"
            : validation.accessLevel === "registered"
              ? "registered"
              : accessLevel;

        unlockIELTS(validation);

      }else{

        if(
          typeof clearSession === "function"
        ){
          clearSession();
        }

        applyAccessLevel(accessLevel);
      }

    }catch(err){

      console.warn(
        "Session validation unavailable; using local IELTS tier.",
        err
      );

      applyAccessLevel(accessLevel);
    }

  }else{

    applyAccessLevel(accessLevel);
  }

  try{

    const response =
      await fetch(
        "data/modules.json"
      );

    const allModules =
      await response.json();

    /*
     * Only accessible lessons enter state.modules.
     *
     * Visitor    => 2
     * Registered => 7
     * Full       => 157
     */
    state.modules =
      allModules.filter(
        m => isLessonAllowed(m.id)
      );

    const allowedIds =
      new Set(
        state.modules.map(
          m => String(m.id)
        )
      );

    /*
     * Keep progress statistics restricted
     * to the current access tier.
     */
    state.mistakes =
      state.mistakes.filter(
        id =>
          allowedIds.has(
            String(id)
          )
      );

    state.bookmarks =
      state.bookmarks.filter(
        id =>
          allowedIds.has(
            String(id)
          )
      );

    renderSkills();
    renderLessons();
    updateDashboard();
    refreshAccessIndicator();
    bind();

  }catch(err){

    console.error(
      "Unable to load IELTS lessons:",
      err
    );

    const lessonGrid =
      document.querySelector(
        "#lessonGrid"
      );

    if(lessonGrid){

      lessonGrid.innerHTML =
        "<p>Unable to load IELTS lessons. Please refresh the page.</p>";
    }
  }
}

function refreshAccessIndicator(){

  const el =
    document.querySelector(
      "#ieltsAccessLevel"
    );

  if(!el)return;

  if(
    state.accessLevel === "full"
  ){

    el.textContent =
      "Full IELTS Access — Lessons 1–157";

  }else if(
    state.accessLevel === "registered"
  ){

    el.textContent =
      "Registered Learner — Lessons 1–7";

  }else{

    el.textContent =
      "Free Access — Lessons 1–2";
  }
}


/* =========================================================
   LESSON ENGINE
   ========================================================= */

function skill(m){return m.skill||m.category||"General"} function done(id){return !!state.progress[id]}
function save(){localStorage.setItem("buye_progress_v2",JSON.stringify(state.progress));localStorage.setItem("buye_mistakes_v1",JSON.stringify(state.mistakes));localStorage.setItem("buye_bookmarks_v1",JSON.stringify(state.bookmarks))}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function renderSkills(){let a=["All",...new Set(state.modules.map(skill))];$("#skillTabs").innerHTML=a.map(s=>`<button class="skill-tab ${state.currentFilter===s?"active":""}" data-skill="${esc(s)}">${esc(s)}</button>`).join("")}
function renderLessons(){

  let list =
    state.modules.filter(
      m =>
        (
          state.currentFilter === "All" ||
          skill(m) === state.currentFilter
        ) &&
        (
          !state.query ||
          `${m.title} ${skill(m)} ${m.learning_goal || ""}`
            .toLowerCase()
            .includes(
              state.query.toLowerCase()
            )
        )
    );

  $("#lessonCount").textContent =
    `${list.length} available lesson${list.length === 1 ? "" : "s"} • ${IELTS_TOTAL_LESSONS - state.maxLesson} locked`;

  $("#lessonGrid").innerHTML =
    list.map(
      m =>
        `<article class="lesson-card ${done(m.id) ? "completed" : ""}">
          <div class="card-top">
            <span class="badge">
              ${esc(skill(m))}
            </span>

            <button
              class="bookmark"
              data-bookmark="${esc(m.id)}"
            >${state.bookmarks.includes(m.id) ? "★" : "☆"}</button>
          </div>

          <h3>
            Lesson ${esc(m.id)} — ${esc(m.title)}
          </h3>

          <p>
            ${esc(
              m.learning_goal ||
              "Build a practical IELTS skill."
            )}
          </p>

          <div class="card-bottom">

            <span>
              ${done(m.id)
                ? "✓ Completed"
                : "Ready to learn"}
            </span>

            <button
              class="primary small"
              data-open="${esc(m.id)}"
            >
              Open lesson
            </button>

          </div>
        </article>`
    ).join("");
}


function updateDashboard(){

  /*
   * state.modules contains only the current
   * access tier.
   */

  let total =
    state.modules.length;

  let d =
    state.modules.filter(
      m => done(m.id)
    ).length;

  let p =
    total
      ? Math.round(
          d / total * 100
        )
      : 0;

  $("#overallProgress").textContent =
    p + "%";

  $("#progressFill").style.width =
    p + "%";

  $("#doneCount").textContent =
    d;

  $("#mistakeCount").textContent =
    state.mistakes.length;

  $("#bookmarkCount").textContent =
    state.bookmarks.length;

  let by = {};

  state.modules.forEach(
    m => {

      let s = skill(m);

      by[s] ??= {
        t: 0,
        d: 0
      };

      by[s].t++;

      if(done(m.id)){
        by[s].d++;
      }
    }
  );

  $("#skillProgress").innerHTML =
    Object.entries(by)
      .map(
        ([s,v]) =>
          `<div class="progress-row">
            <div>
              <span>${esc(s)}</span>
              <b>${v.d}/${v.t}</b>
            </div>

            <div class="mini-track">
              <i style="width:${v.d/v.t*100}%"></i>
            </div>
          </div>`
      )
      .join("");
}


function openLesson(id){let m=state.modules.find(x=>String(x.id)===String(id));if(!m)return;state.current=m;$("#modal").classList.add("show");$("#modalBody").innerHTML=`<div class="modal-head"><div><span class="badge">${esc(skill(m))}</span><h2>${esc(m.title)}</h2></div><button class="icon-btn" id="closeModal">×</button></div><div class="lesson-section"><h4>Learn</h4><p>${esc(m.explanation||m.learning_goal||"Build this skill through focused practice.")}</p></div><div class="lesson-section"><h4>Try it</h4><p>${esc(m.practice_prompt||"Apply the strategy to a fresh IELTS-style situation.")}</p></div><div class="exercise"><h4>Quick check</h4><p>${esc(m.exercise.question)}</p><div class="options">${m.exercise.options.map((o,i)=>`<button class="option" data-opt="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("")}</div><div id="feedback" class="feedback hidden"></div></div><div class="lesson-section answer"><h4>Suggested direction</h4><p>${esc(m.suggested_answer||m.exercise.explanation||"Review your answer and explain why it fits.")}</p></div><div class="modal-actions"><button class="secondary" id="markDone">${done(m.id)?"✓ Completed":"Mark complete"}</button><button class="primary" id="nextLesson">Next lesson →</button></div>`;$("#closeModal").onclick=closeModal;$$(".option").forEach(b=>b.onclick=()=>checkAnswer(+b.dataset.opt));$("#markDone").onclick=()=>{state.progress[m.id]=true;save();updateDashboard();renderLessons();$("#markDone").textContent="✓ Completed"};$("#nextLesson").onclick=nextLesson}
function checkAnswer(choice){let m=state.current,fb=$("#feedback"),ok=choice===m.exercise.answer;fb.className="feedback "+(ok?"correct":"wrong");fb.innerHTML=ok?"✓ Correct. "+esc(m.exercise.explanation):"Not quite. "+esc(m.exercise.explanation)+' <button id="retry">Try again</button>';if(!ok&&!state.mistakes.includes(m.id))state.mistakes.push(m.id);if(ok)state.mistakes=state.mistakes.filter(x=>x!==m.id);save();updateDashboard();if($("#retry"))$("#retry").onclick=()=>fb.className="feedback hidden"}
function nextLesson(){let i=state.modules.findIndex(x=>x.id===state.current.id);openLesson(state.modules[(i+1)%state.modules.length].id)}
function closeModal(){$("#modal").classList.remove("show")}
function startPractice(){let pool=state.modules.filter(m=>state.currentFilter==="All"||skill(m)===state.currentFilter),chosen=[...pool].sort(()=>Math.random()-.5).slice(0,Math.min(8,pool.length));if(!chosen.length)return;state.test={items:chosen,index:0,score:0,answered:false};$("#practiceModal").classList.add("show");renderTest()}
function renderTest(){let t=state.test,m=t.items[t.index];$("#practiceBody").innerHTML=`<div class="modal-head"><div><span class="badge">Practice ${t.index+1}/${t.items.length}</span><h2>${esc(m.title)}</h2></div><button class="icon-btn" id="closePractice">×</button></div><div class="timer-note">Self-paced practice • focus on accuracy first</div><div class="exercise"><h4>${esc(m.exercise.question)}</h4><div class="options">${m.exercise.options.map((o,i)=>`<button class="option" data-test-opt="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("")}</div><div id="testFeedback" class="feedback hidden"></div></div>`;$("#closePractice").onclick=()=>$("#practiceModal").classList.remove("show");$$("[data-test-opt]").forEach(b=>b.onclick=()=>answerTest(+b.dataset.testOpt))}
function answerTest(choice){let t=state.test,m=t.items[t.index];if(t.answered)return;t.answered=true;let ok=choice===m.exercise.answer;if(ok)t.score++;if(!ok&&!state.mistakes.includes(m.id))state.mistakes.push(m.id);save();updateDashboard();let f=$("#testFeedback");f.className="feedback "+(ok?"correct":"wrong");f.textContent=ok?"Correct — nice work.":"Review the explanation, then continue.";setTimeout(()=>{t.index++;t.answered=false;t.index<t.items.length?renderTest():showResult()},650)}
function showResult(){let t=state.test,p=Math.round(t.score/t.items.length*100);$("#practiceBody").innerHTML=`<div class="result"><div class="result-ring">${p}%</div><h2>Practice complete</h2><p>You answered ${t.score} of ${t.items.length} correctly.</p><button class="primary" id="again">Practice again</button><button class="secondary" id="closeResult">Back to lessons</button></div>`;$("#again").onclick=startPractice;$("#closeResult").onclick=()=>$("#practiceModal").classList.remove("show")}
function randomLesson(){openLesson(state.modules[Math.floor(Math.random()*state.modules.length)].id)}
function toggleBookmark(id){if(!isLessonAllowed(id))return;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];save();renderLessons();updateDashboard()}
function showFiltered(ids,label){ids=new Set([...ids].filter(id=>isLessonAllowed(id)));$("#search").value="";state.query="";let list=state.modules.filter(m=>ids.has(m.id));$("#lessonGrid").innerHTML=list.map(m=>`<article class="lesson-card"><div class="card-top"><span class="badge">${esc(skill(m))}</span></div><h3>${esc(m.title)}</h3><p>${esc(label)}</p><div class="card-bottom"><span>${label}</span><button class="primary small" data-open="${esc(m.id)}">Open</button></div></article>`).join("");$("#lessonCount").textContent=`${list.length} item${list.length===1?"":"s"}`}
function bind(){$("#search").oninput=e=>{state.query=e.target.value;renderLessons()};$("#skillTabs").onclick=e=>{let b=e.target.closest("[data-skill]");if(!b)return;state.currentFilter=b.dataset.skill;renderSkills();renderLessons()};$("#lessonGrid").onclick=e=>{let o=e.target.closest("[data-open]"),b=e.target.closest("[data-bookmark]");if(o)openLesson(o.dataset.open);if(b)toggleBookmark(b.dataset.bookmark)};$("#startPractice").onclick=startPractice;$("#randomLesson").onclick=randomLesson;$("#showMistakes").onclick=()=>showFiltered(new Set(state.mistakes),"Review from your mistake log.");$("#showBookmarks").onclick=()=>showFiltered(new Set(state.bookmarks),"Saved for quick access.")}
/* ==================== BUYE Phase 2I account + theme ==================== */
(function(){
  const themeKey="buye_theme";
  if(localStorage.getItem(themeKey)==="dark")document.body.classList.add("dark");

  const toggle=document.querySelector("#themeToggle");
  const userEl=document.querySelector("#authUser");
  const loginBtn=document.querySelector("#loginBtn");
  const modal=document.querySelector("#authModal");
  const form=document.querySelector("#authForm");
  const status=document.querySelector("#authStatus");

  let mode="login";
  let pendingEmail="";

  function refreshUser(){
    const u=getSession();
    if(u){
      userEl.textContent=`Hi, ${u.name||"Learner"}`;
      loginBtn.textContent="Logout";
    }else{
      userEl.textContent="";
      loginBtn.textContent="Login";
    }
  }

  function draw(){
    if(mode==="login"){
      form.innerHTML=`<p>Enter the email address you used to register for IELTS access.</p>
      <p class="auth-note">After your registration is approved, the verification code will be sent to the BUYE administrator at <strong>info@buye.online</strong> and shared with you manually.</p>
      <label>Email<input name="email" type="email" required placeholder="you@example.com"></label>
      <button class="primary" type="submit">Request verification code</button>
      <p class="auth-note">Need help? WhatsApp <strong>+91 99958 63184</strong></p>`;
    }else if(mode==="register"){
      form.innerHTML=`<p>Register your details for IELTS access. Your registration will be reviewed by the BUYE administrator before login access is approved.</p>
      <label>Name<input name="name" required placeholder="Your name"></label>
      <label>Email<input name="email" type="email" required placeholder="you@example.com"></label>
      <label>Phone<input name="phone" required placeholder="Phone number"></label>
      <button class="primary" type="submit">Register for IELTS access</button>
      <p class="auth-note">Need help? WhatsApp <strong>+91 99958 63184</strong></p>`;
    }else{
      form.innerHTML=`<p>Enter the 6-digit verification code shared with you by BUYE-Online.</p>
      <label>Verification code<input name="code" inputmode="numeric" maxlength="6" required placeholder="6-digit code"></label>
      <button class="primary" type="submit">Verify & continue</button>
      <p class="auth-note">The code is provided manually after administrator approval. Need help? WhatsApp <strong>+91 99958 63184</strong></p>`;
    }
  }

  function openAuth(){
    modal.classList.add("show");
    mode="login";
    status.textContent="";
    document.querySelectorAll(".auth-tab").forEach(x=>x.style.display="");
    draw();
  }

  function closeAuth(){
    modal.classList.remove("show");
  }

  toggle?.addEventListener("click",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem(
      themeKey,
      document.body.classList.contains("dark")?"dark":"light"
    );
    toggle.textContent=document.body.classList.contains("dark")?"☀️":"🌙";
  });

  if(document.body.classList.contains("dark")&&toggle){
    toggle.textContent="☀️";
  }

  loginBtn?.addEventListener("click",async ()=>{
    if(getSession()){
      const session=getSession();
      await api("logout",{token:session?.token||""});
      clearSession();
      refreshUser();
      lockIELTS();
    }else{
      openAuth();
    }
  });

  document.querySelector("#closeAuth")?.addEventListener("click",closeAuth);

  document.querySelectorAll(".auth-tab").forEach(b=>b.addEventListener("click",()=>{
    mode=b.dataset.auth;
    document.querySelectorAll(".auth-tab")
      .forEach(x=>x.classList.toggle("active",x===b));
    status.textContent="";
    draw();
  }));

  form?.addEventListener("submit",async e=>{
    e.preventDefault();

    status.textContent="Working…";

    const fd=new FormData(form);
    const v=Object.fromEntries(fd.entries());

    if(mode==="register"){
      const r=await api("register",{
        name:v.name,
        email:v.email,
        phone:v.phone,
        role:"student"
      });

      if(!r.ok){
        status.textContent=r.error;
        return;
      }

      setRegisteredEmail(v.email);
      status.textContent="Registration received. You now have access to Lessons 1-7. Please wait for administrator approval for full IELTS access.";
      return;
    }

    if(mode==="login"){
      const r=await api("login",{email:v.email});

      if(!r.ok){
        status.textContent=r.error;
        return;
      }

      pendingEmail=v.email;
      mode="verify";

      document.querySelectorAll(".auth-tab")
        .forEach(x=>x.style.display="none");

      status.textContent="Your OTP request has been received. The BUYE administrator will receive the OTP at info@buye.online and share it with you after approval.";

      draw();
      return;
    }

    const r=await api("verifyOtp",{
      email:pendingEmail,
      code:v.code
    });

    if(!r.ok){
      status.textContent=r.error;
      return;
    }

    setSession({
      token:r.token,
      name:r.name||"Learner",
      email:pendingEmail,
      role:r.role||"student",
      expiresAt:r.expiresAt||""
    });

    status.textContent="Login successful.";
    refreshUser();
    await load();
  });

  document.querySelector("#leadForm")?.addEventListener("submit",async e=>{
    e.preventDefault();

    const f=new FormData(e.currentTarget);
    const v=Object.fromEntries(f.entries());
    const s=document.querySelector("#leadStatus");

    s.textContent="Sending…";

    const r=await api("saveLead",{
      name:v.name,
      phone:v.phone,
      email:v.email,
      goal:v.goal,
      source:"BUYE IELTS website"
    });

    s.textContent=r.ok
      ?"Thanks — your enquiry has been received."
      :r.error;

    if(r.ok)e.currentTarget.reset();
  });

  refreshUser();
})();

/* Initial IELTS page load */
load();
