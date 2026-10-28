/* محرك الاختبارات التدريبية: mcq, tf, order, match, fill */
(function(){
const Z = window.QUIZ, Q = Z.questions;
const ar = n => Number(n).toLocaleString("ar-EG");
const shuffle = a => { a = a.slice(); for (let k = a.length-1; k > 0; k--) { const j = Math.floor(Math.random()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; };
const esc = s => String(s).replace(/"/g,"&quot;");
const strip = s => String(s).replace(/<[^>]+>/g,"");
const app = document.getElementById("app");
const TAGS = {mcq:"اختر الإجابة", tf:"صح أو خطأ", order:"رتّب", match:"صِل", fill:"أكمل الفراغ"};

app.innerHTML = `<div class="wrap">
  <a class="back" href="../">← كل الاختبارات</a>
  <header><div class="eyebrow">${Z.eyebrow}</div><h1>${Z.title}</h1></header>
  <div class="progress" id="progress"></div>
  <div class="meta"><span id="qnum"></span><span id="scoreLive"></span></div>
  <main id="stage"></main>
  <footer>الأسئلة من كتاب العلوم – وزارة التربية، الكويت (طبعة ٢٠٢٦/٢٠٢٧)</footer>
</div>`;
const $ = id => document.getElementById(id);

let i = 0, score = 0, results = [];

function drawProgress(){
  $("progress").innerHTML = Q.map((_,k) => `<span class="${results[k]===true?'ok':results[k]===false?'no':k===i?'cur':''}"></span>`).join("");
  $("qnum").textContent = i < Q.length ? `سؤال ${ar(i+1)} من ${ar(Q.length)}` : "النتيجة";
  $("scoreLive").textContent = `الدرجة: ${ar(score)}`;
}
function fb(ok, text){
  return `<div class="feedback ${ok?'good':'bad'}"><b>${ok?'برافو! إجابة صحيحة 👏':'لا، مو صح'}</b>${text||""}</div>`;
}
function finish(ok, q){
  results[i] = ok; if (ok) score++;
  drawProgress();
  const last = i === Q.length-1;
  $("fb").innerHTML = fb(ok, q.e) + `<button class="btn" id="next">${last?'شوف النتيجة':'السؤال اللي بعده'}</button>`;
  const n = $("next"); n.focus({preventScroll:true}); n.scrollIntoView({behavior:"smooth",block:"nearest"});
  n.onclick = () => { i++; render(); window.scrollTo({top:0,behavior:"smooth"}); };
}

function render(){
  drawProgress();
  if (i >= Q.length) return result();
  const q = Q[i], s = $("stage");
  let h = `<section class="card"><span class="tag">${q.tag||TAGS[q.t]}</span>`;
  if (q.t !== "fill") h += `<p class="q">${q.q}</p>`;

  if (q.t === "mcq"){
    const order = shuffle(q.o.map((_,k)=>k));
    h += `<div class="opts">${order.map(k=>`<button class="opt" data-k="${k}">${q.o[k]}</button>`).join("")}</div>`;
  } else if (q.t === "tf"){
    h += `<div class="row"><button class="opt" data-v="1" style="text-align:center">✔️ صح</button><button class="opt" data-v="0" style="text-align:center">✖️ خطأ</button></div>`;
  } else if (q.t === "order"){
    h += `<p class="hint">${q.hint||"اضغط على العناصر بالترتيب الصحيح."}</p>
      <div class="chips">${shuffle(q.items).map(t=>`<button class="chip" data-t="${esc(t)}">${t}</button>`).join("")}</div>
      <ol class="ladder" id="ladder"></ol>
      <div class="row"><button class="btn ghost" id="reset">امسح</button><button class="btn" id="check" disabled>تحقق</button></div>`;
  } else if (q.t === "match"){
    const opts = shuffle([...new Set(q.pairs.map(p=>p[1]))]);
    h += `<div class="pairs">${q.pairs.map((p,k)=>`<div class="pair" id="p${k}"><span class="l">${p[0]}</span>
      <select id="s${k}" aria-label="${esc(strip(p[0]))}"><option value="">اختر…</option>${opts.map(o=>`<option value="${esc(o)}">${o}</option>`).join("")}</select></div>`).join("")}</div>
      <button class="btn" id="check" disabled>تحقق</button>`;
  } else if (q.t === "fill"){
    h += `<p class="sentence">${q.s.replace("___",'<span class="blank" id="blank">؟</span>')}</p>
      <p class="hint">اختر الكلمة المناسبة:</p>
      <div class="chips">${shuffle(q.bank).map(t=>`<button class="chip" data-t="${esc(t)}">${t}</button>`).join("")}</div>
      <button class="btn" id="check" disabled>تحقق</button>`;
  }
  s.innerHTML = h + `<div id="fb"></div></section>`;

  if (q.t === "mcq"){
    s.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      const ok = +b.dataset.k === q.a;
      s.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      finish(ok, q);
    });
  } else if (q.t === "tf"){
    s.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === "1") === q.a;
      s.querySelectorAll(".opt").forEach(x => { x.disabled = true; if ((x.dataset.v === "1") === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      finish(ok, q);
    });
  } else if (q.t === "order"){
    let picked = [];
    const draw = () => { $("ladder").innerHTML = picked.map((t,k)=>`<li><span class="n">${ar(k+1)}</span>${t}</li>`).join(""); $("check").disabled = picked.length !== q.items.length; };
    s.querySelectorAll(".chip").forEach(c => c.onclick = () => { picked.push(c.dataset.t); c.disabled = true; draw(); });
    $("reset").onclick = () => { picked = []; s.querySelectorAll(".chip").forEach(c=>c.disabled=false); draw(); };
    $("check").onclick = () => {
      const ok = picked.every((t,k)=>t===q.items[k]);
      $("ladder").innerHTML = picked.map((t,k)=>{ const r = t===q.items[k]; return `<li class="${r?'right':'wrong'}"><span class="n">${ar(k+1)}</span>${t}${r?'':`<span class="fix">الصح: ${q.items[k]}</span>`}</li>`; }).join("");
      $("check").disabled = true; $("reset").disabled = true; s.querySelectorAll(".chip").forEach(c=>c.disabled=true);
      finish(ok, q);
    };
  } else if (q.t === "match"){
    const sels = q.pairs.map((_,k)=>$("s"+k));
    sels.forEach(x => x.onchange = () => { $("check").disabled = sels.some(y=>!y.value); });
    $("check").onclick = () => {
      let ok = true;
      q.pairs.forEach((p,k) => { const r = sels[k].value === p[1]; ok = ok && r; sels[k].disabled = true;
        const el = $("p"+k); el.classList.add(r?"right":"wrong"); if (!r) el.insertAdjacentHTML("beforeend", `<span class="fix">الصح: ${p[1]}</span>`); });
      $("check").disabled = true; finish(ok, q);
    };
  } else if (q.t === "fill"){
    let pick = null;
    s.querySelectorAll(".chip").forEach(c => c.onclick = () => {
      pick = c.dataset.t; s.querySelectorAll(".chip").forEach(x=>x.classList.toggle("sel", x===c));
      $("blank").textContent = pick; $("check").disabled = false;
    });
    $("check").onclick = () => {
      const ok = pick === q.a; const b = $("blank");
      b.classList.add(ok?"right":"wrong"); if (!ok) b.textContent = `${pick} ← ${q.a}`;
      s.querySelectorAll(".chip").forEach(x=>x.disabled=true); $("check").disabled = true; finish(ok, q);
    };
  }
}

function result(){
  const pct = score / Q.length;
  const verdict = pct===1 ? "ممتاز! فاهم الدرس ١٠٠٪ 🌟" : pct>=.8 ? "شغل حلو! باقي شوي ونوصل للكامل" : pct>=.5 ? "مو شين، بس نحتاج نراجع الدرس مرة ثانية" : "خلنا نقرا الدرس من الكتاب ونرجع نجرب";
  const key = "best:" + location.pathname; let best = score;
  try { best = Math.max(score, +(localStorage.getItem(key)||0)); localStorage.setItem(key, best); } catch(e){}
  const wrong = Q.map((q,k) => results[k] ? null : `<div><b>${strip(q.q||q.s.replace("___","____"))}</b><br>${q.e||""}</div>`).filter(Boolean);
  $("stage").innerHTML = `<section class="card result">
    <span class="tag" style="align-self:center">النتيجة النهائية</span>
    <div class="score">${ar(score)} / ${ar(Q.length)}</div>
    <p class="verdict">${verdict}</p>
    <p class="hint">أعلى درجة على هالجهاز: ${ar(best)}</p>
    ${wrong.length ? `<div class="review"><b>راجع هالأسئلة:</b>${wrong.join("")}</div>` : ""}
    <div class="row"><button class="btn" id="again">أعد الاختبار</button><a class="btn ghost" href="../" style="text-align:center;text-decoration:none">كل الاختبارات</a></div>
  </section>`;
  $("again").onclick = () => { i = 0; score = 0; results = []; render(); window.scrollTo({top:0}); };
}
render();
})();
