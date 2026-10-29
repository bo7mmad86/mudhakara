/* محرك الاختبار الشامل: أقسام بدرجات، تصحيح تلقائي + تصحيح ولي الأمر للمقالي */
(function(){
const X = window.EXAM;
const ar = n => Number(n).toLocaleString("ar-EG");
const esc = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const shuffle = a => { a = a.slice(); for (let k = a.length-1; k > 0; k--) { const j = Math.floor(Math.random()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; };
const ORD = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"];
const LET = ["أ","ب","جـ","د"];
const KEY = "exam-draft:" + location.pathname;
const app = document.getElementById("app");
if (location.hash === "#print" && window.PrintView) { window.PrintView.render(X, "exam"); return; }
window.addEventListener("hashchange", () => location.reload());
let submitted = false;
const written = []; // {id, max, got:null}

/* ---------- render ---------- */
let h = `<div class="wrap">
  <div class="toprow noprint"><a class="back" href="../">← كل الاختبارات</a><a class="mode p" href="#print">نسخة للطباعة</a></div>
  <header><div class="eyebrow">${X.eyebrow}</div><h1>${X.title}</h1></header>
  <section class="card">
    <div class="sheet-head">
      <label>اسم الطالب<input id="stName" autocomplete="off"></label>
      <label>التاريخ<input id="stDate" autocomplete="off"></label>
    </div>
    <div class="facts"><span>الدرجة الكلية: ${ar(X.total)}</span><span>الزمن: ${ar(X.minutes)} دقيقة</span><span>عدد الأسئلة: ${ar(X.sections.length)}</span></div>
    <p class="hint">${X.note}</p>
    <div class="row noprint"><button class="btn ghost" id="timerBtn">ابدأ المؤقت</button></div>
  </section>`;

X.sections.forEach((s, si) => {
  const sMarks = s.marks != null ? s.marks : s.items.length * s.each;
  h += `<section class="card" id="sec${si}"><div class="qhead"><h2>السؤال ${ORD[si]}</h2><span class="marks">(${sMarks===1?'درجة واحدة':sMarks===2?'درجتان':ar(sMarks)+' درجات'})</span></div><p class="q" style="font-size:17px">${s.prompt}</p>`;
  if (s.type === "mcq") {
    h += `<ol class="items">${s.items.map((it,k)=>`<li class="item" id="i${si}_${k}"><span class="stem">${it.q}</span><div class="mini">${it.o.map((o,j)=>`<label><input type="radio" name="r${si}_${k}" value="${j}"> ${LET[j]}. ${o}</label>`).join("")}</div></li>`).join("")}</ol>`;
  } else if (s.type === "tf") {
    h += `<ol class="items">${s.items.map((it,k)=>`<li class="item" id="i${si}_${k}"><span class="stem">${it.q}</span><div class="mini"><label><input type="radio" name="r${si}_${k}" value="1"> صحيحة</label><label><input type="radio" name="r${si}_${k}" value="0"> خطأ</label></div></li>`).join("")}</ol>`;
  } else if (s.type === "fill") {
    h += `<div class="chips" aria-label="بنك الكلمات">${s.bank.map(w=>`<span class="chip" style="cursor:default">${w}</span>`).join("")}</div>
      <ol class="items">${s.items.map((it,k)=>`<li class="item" id="i${si}_${k}"><span class="stem">${it.q.replace("___","……")}</span><select id="r${si}_${k}"><option value="">اختر الكلمة…</option>${s.bank.map(w=>`<option value="${esc(w)}">${w}</option>`).join("")}</select></li>`).join("")}</ol>`;
  } else if (s.type === "match") {
    const opts = shuffle(s.items.map(it=>it.a));
    h += `<ol class="items">${s.items.map((it,k)=>`<li class="item" id="i${si}_${k}"><span class="stem">${it.q}</span><select id="r${si}_${k}"><option value="">اختر…</option>${opts.map(o=>`<option value="${esc(o)}">${o}</option>`).join("")}</select></li>`).join("")}</ol>`;
  } else if (s.type === "order") {
    h += `<p class="hint noprint">اضغط على المراحل بالترتيب. تقدر تمسح وتعيد.</p>
      <div class="chips" id="ochips">${shuffle(s.items).map(t=>`<button class="chip" data-t="${esc(t)}">${t}</button>`).join("")}</div>
      <ol class="ladder" id="oladder"></ol>
      <div class="row noprint"><button class="btn ghost" id="oreset">امسح الترتيب</button></div>`;
  } else if (s.type === "compare") {
    h += `<div class="tablewrap"><table class="cmp"><thead><tr><th>وجه المقارنة</th>${s.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>
      ${s.rows.map((r,ri)=>`<tr><th>${r.label}</th>${r.answers.map((a,ci)=>`<td id="c${si}_${ri}_${ci}"><select id="r${si}_${ri}_${ci}" aria-label="${esc(r.label)} – ${esc(s.cols[ci])}"><option value="">اختر…</option>${r.options.map(o=>`<option value="${esc(o)}">${o}</option>`).join("")}</select></td>`).join("")}</tr>`).join("")}
      </tbody></table></div>`;
  } else if (s.type === "written") {
    h += `<ol class="items">${s.items.map((it,k)=>{ written.push({id:`${si}_${k}`, max:s.each, got:null, c:it.c}); return `<li class="item" id="i${si}_${k}"><span class="stem">${it.q}</span><textarea id="r${si}_${k}" placeholder="اكتب إجابتك هني…"></textarea><div id="m${si}_${k}"></div></li>`; }).join("")}</ol>`;
  }
  h += `<div class="got" id="g${si}"></div></section>`;
});

h += `<div id="warn"></div>
  <div class="total noprint" id="totalBar"><span id="timerTxt" class="hint"></span><button class="btn" id="submitBtn">سلّم الاختبار</button></div>
  <section class="card" id="report" hidden></section>
  <footer>الأسئلة من كتاب العلوم – وزارة التربية، الكويت (طبعة ٢٠٢٦/٢٠٢٧)</footer></div>`;
app.innerHTML = h;
const $ = id => document.getElementById(id);

/* ---------- order widget ---------- */
let picked = [];
const oSec = X.sections.findIndex(s=>s.type==="order");
function drawOrder(){
  if (oSec < 0) return;
  $("oladder").innerHTML = picked.map((t,k)=>`<li><span class="n">${ar(k+1)}</span>${t}</li>`).join("");
  document.querySelectorAll("#ochips .chip").forEach(c => c.disabled = submitted || picked.includes(c.dataset.t));
}
if (oSec >= 0){
  document.querySelectorAll("#ochips .chip").forEach(c => c.onclick = () => { if (!submitted){ picked.push(c.dataset.t); drawOrder(); save(); } });
  $("oreset").onclick = () => { if (!submitted){ picked = []; drawOrder(); save(); } };
}

/* ---------- draft save (per device) ---------- */
function fields(){ return [...app.querySelectorAll("input,select,textarea")]; }
function save(){
  if (submitted) return;
  const d = {picked, f:{}};
  fields().forEach(el => { if (el.type==="radio"){ if (el.checked) d.f[el.name] = el.value; } else if (el.id) d.f[el.id] = el.value; });
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){}
}
function load(){
  let d; try { d = JSON.parse(localStorage.getItem(KEY)||"null"); } catch(e){}
  if (!d) return;
  fields().forEach(el => { if (el.type==="radio"){ if (d.f[el.name] === el.value) el.checked = true; } else if (el.id && d.f[el.id] != null) el.value = d.f[el.id]; });
  picked = (d.picked||[]).filter(t => X.sections[oSec] && X.sections[oSec].items.includes(t));
}
load(); drawOrder();
app.addEventListener("input", save); app.addEventListener("change", save);
try { if (!$("stDate").value) $("stDate").value = new Date().toLocaleDateString("ar-KW"); } catch(e){}

/* ---------- timer ---------- */
let tLeft = X.minutes*60, tInt = null;
$("timerBtn").onclick = () => {
  if (tInt) return; $("timerBtn").disabled = true;
  const tick = () => { const m = Math.floor(Math.max(tLeft,0)/60), s = Math.max(tLeft,0)%60;
    $("timerTxt").textContent = tLeft > 0 ? `باقي ${ar(m)}:${s<10?'٠':''}${ar(s)}` : "خلص الوقت ⏰"; tLeft--; if (tLeft < -1 || submitted) clearInterval(tInt); };
  tick(); tInt = setInterval(tick, 1000);
};

/* ---------- grading ---------- */
function unanswered(){
  let n = 0;
  X.sections.forEach((s,si) => {
    if (s.type==="mcq"||s.type==="tf") s.items.forEach((_,k)=>{ if (!app.querySelector(`input[name="r${si}_${k}"]:checked`)) n++; });
    else if (s.type==="fill"||s.type==="match") s.items.forEach((_,k)=>{ if (!$(`r${si}_${k}`).value) n++; });
    else if (s.type==="order"){ if (picked.length < s.items.length) n++; }
    else if (s.type==="compare") s.rows.forEach((r,ri)=>r.answers.forEach((_,ci)=>{ if (!$(`r${si}_${ri}_${ci}`).value) n++; }));
    else if (s.type==="written") s.items.forEach((_,k)=>{ if (!$(`r${si}_${k}`).value.trim()) n++; });
  });
  return n;
}
const per = {}; // chapter -> {got,max}
const addC = (c, got, max) => { per[c] = per[c] || {got:0,max:0}; per[c].got += got; per[c].max += max; };
let autoScore = 0;

function grade(){
  submitted = true; if (tInt) clearInterval(tInt);
  X.sections.forEach((s,si) => {
    let got = 0, max = 0;
    const mark = (el, ok) => { el.classList.add(ok?"ok":"no"); };
    if (s.type==="mcq"||s.type==="tf"){
      s.items.forEach((it,k) => {
        const sel = app.querySelector(`input[name="r${si}_${k}"]:checked`);
        const correct = s.type==="mcq" ? String(it.a) : (it.a?"1":"0");
        const ok = !!sel && sel.value === correct;
        app.querySelectorAll(`input[name="r${si}_${k}"]`).forEach(r => { r.disabled = true; if (r.value===correct) r.parentElement.classList.add("right"); else if (r.checked) r.parentElement.classList.add("wrong"); });
        const li = $(`i${si}_${k}`); mark(li, ok);
        if (s.type==="tf" && !it.a && it.fix) li.insertAdjacentHTML("beforeend", `<div class="hint">التصحيح: ${it.fix}</div>`);
        if (ok) got += s.each; max += s.each; addC(it.c, ok?s.each:0, s.each);
      });
    } else if (s.type==="fill"||s.type==="match"){
      s.items.forEach((it,k) => {
        const el = $(`r${si}_${k}`); const ok = el.value === it.a; el.disabled = true;
        const li = $(`i${si}_${k}`); mark(li, ok);
        if (!ok) li.insertAdjacentHTML("beforeend", `<div class="hint">الإجابة الصحيحة: <b>${it.a}</b></div>`);
        if (ok) got += s.each; max += s.each; addC(it.c, ok?s.each:0, s.each);
      });
    } else if (s.type==="order"){
      const right = s.items.filter((t,k)=>picked[k]===t).length;
      got = Math.floor((right / s.items.length) * s.marks * 2) / 2; max = s.marks;
      $("oladder").innerHTML = s.items.map((t,k)=>{ const p = picked[k]; const ok = p===t; return `<li class="${ok?'right':'wrong'}"><span class="n">${ar(k+1)}</span>${p||"—"}${ok?'':`<span class="fix">الصح: ${t}</span>`}</li>`; }).join("");
      drawOrder(); addC(s.c, got, max);
    } else if (s.type==="compare"){
      s.rows.forEach((r,ri)=>r.answers.forEach((a,ci)=>{
        const el = $(`r${si}_${ri}_${ci}`); const ok = el.value === a; el.disabled = true;
        const td = $(`c${si}_${ri}_${ci}`); td.classList.add(ok?"right":"wrong");
        if (!ok) td.insertAdjacentHTML("beforeend", `<div class="hint">الصح: <b>${a}</b></div>`);
        if (ok) got += s.each; max += s.each; addC(s.c, ok?s.each:0, s.each);
      }));
    } else if (s.type==="written"){
      s.items.forEach((it,k) => {
        $(`r${si}_${k}`).readOnly = true;
        $(`m${si}_${k}`).innerHTML = `<div class="model"><b>نموذج الإجابة:</b> ${it.model}</div>
          <div class="grader" data-id="${si}_${k}"><span>تصحيح ولي الأمر:</span>
          <button data-v="${s.each}">✔️ كاملة</button><button data-v="${s.each/2}">نص الدرجة</button><button data-v="0">✖️ صفر</button></div>`;
        max += s.each;
      });
      return; // written graded live
    }
    autoScore += got;
    $(`g${si}`).innerHTML = `<span style="color:var(--accent)">الدرجة: ${ar(got)} من ${ar(max)}</span>`;
  });
  app.querySelectorAll(".grader button").forEach(b => b.onclick = () => {
    const g = b.parentElement, id = g.dataset.id, w = written.find(x=>x.id===id);
    w.got = +b.dataset.v; g.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b));
    report();
  });
  $("submitBtn").hidden = true; $("timerBtn").disabled = true;
  try { localStorage.removeItem(KEY); } catch(e){}
  report();
  window.scrollTo({top:0, behavior:"smooth"});
}

function report(){
  const wDone = written.filter(w=>w.got!==null), wLeft = written.length - wDone.length;
  const wGot = wDone.reduce((a,w)=>a+w.got,0);
  const total = autoScore + wGot;
  const pc = {}; Object.entries(per).forEach(([c,v])=>pc[c]={got:v.got,max:v.max});
  written.forEach(w => { pc[w.c] = pc[w.c] || {got:0,max:0}; pc[w.c].max += w.max; if (w.got!==null) pc[w.c].got += w.got; });
  X.sections.forEach((s,si)=>{ if (s.type==="written"){ const ws = written.filter(w=>w.id.startsWith(si+"_")); const g = ws.reduce((a,w)=>a+(w.got||0),0);
    $(`g${si}`).innerHTML = ws.some(w=>w.got===null) ? `<span class="hint">بانتظار تصحيح ولي الأمر</span>` : `<span style="color:var(--accent)">الدرجة: ${ar(g)} من ${ar(ws.reduce((a,w)=>a+w.max,0))}</span>`; } });
  const pct = total / X.total;
  const verdict = wLeft ? "باقي تصحيح الأسئلة المقالية" : pct>=.9 ? "ممتاز 🌟" : pct>=.75 ? "جيد جداً 👏" : pct>=.6 ? "جيد، يحتاج مراجعة بسيطة" : pct>=.5 ? "مقبول، لازم نراجع" : "يحتاج مذاكرة أكثر";
  $("totalBar").innerHTML = `<span><span class="big">${ar(total)}</span> / ${ar(X.total)}</span><span class="hint">${wLeft ? (wLeft===1 ? "باقي سؤال مقالي واحد يصححه ولي الأمر" : wLeft===2 ? "باقي سؤالين مقاليين يصححهم ولي الأمر" : `باقي ${ar(wLeft)} أسئلة مقالية يصححها ولي الأمر`) : verdict}</span>`;
  const name = $("stName").value.trim();
  const bars = X.chapters.filter(c=>pc[c.id]).map(c=>{ const v = pc[c.id]; const p = v.max ? v.got/v.max : 0;
    return `<div class="bar"><span>${c.name}</span><span class="v">${ar(v.got)} / ${ar(v.max)}</span><div class="track"><div class="fill" style="width:${Math.round(p*100)}%"></div></div></div>`; }).join("");
  const weak = X.chapters.filter(c=>pc[c.id] && pc[c.id].max && pc[c.id].got/pc[c.id].max < .7).map(c=>c.name);
  const r = $("report"); r.hidden = false;
  r.innerHTML = `<span class="tag">تقرير النتيجة${name?` – ${esc(name)}`:""}</span>
    <div class="score" style="text-align:center">${ar(total)} / ${ar(X.total)}</div>
    <p class="verdict" style="text-align:center">${verdict}</p>
    <div class="bars">${bars}</div>
    ${!wLeft && weak.length ? `<p class="hint">ركّز بالمراجعة على: <b>${weak.join("، ")}</b></p>` : ""}
    <div class="row noprint"><button class="btn ghost" id="again">اختبار جديد (مسح الإجابات)</button></div>`;
  $("again").onclick = () => { try { localStorage.removeItem(KEY); } catch(e){} location.reload(); };
}

$("submitBtn").onclick = () => {
  const n = unanswered();
  if (n === 0) return grade();
  $("warn").innerHTML = `<div class="warnbox"><b>باقي ${ar(n)} ${n===1?'سؤال ما جاوبت عليه':'أسئلة ما جاوبت عليها'}.</b>
    <div class="row"><button class="btn ghost" id="wBack">أرجع أكمل</button><button class="btn" id="wGo">سلّم على كل حال</button></div></div>`;
  $("wGo").onclick = () => { $("warn").innerHTML = ""; grade(); };
  $("wBack").onclick = () => { $("warn").innerHTML = ""; };
  $("warn").scrollIntoView({behavior:"smooth", block:"center"});
};
})();
