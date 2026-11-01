/* نسخة الطباعة: تحوّل بيانات الاختبار (QUIZ أو EXAM) إلى ورقة A4 جاهزة للطباعة، مع نسخة إجابات لولي الأمر */
(function(){
const ar = n => Number(n).toLocaleString("ar-EG");
const LET = ["أ","ب","جـ","د","هـ","و","ز","ح"];
const ORD = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"];
const TAGS = {mcq:"اختر الإجابة الصحيحة", tf:"ضع (صحيحة) أو (خطأ)", order:"رتّب بكتابة الرقم في المربع", match:"صِل بكتابة الحرف المناسب في المربع", fill:"أكمل الفراغ من بنك الكلمات"};
const shuffle = a => { a = a.slice(); for (let k = a.length-1; k > 0; k--) { const j = Math.floor(Math.random()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; };
const marksTxt = m => m===1 ? "درجة واحدة" : m===2 ? "درجتان" : `${ar(m)} درجات`;
const lines = n => `<div class="wlines">${'<span></span>'.repeat(n)}</div>`;

/* ---- building blocks ---- */
function mcqBlock(q, o, a){
  return `<div class="pstem">${q}</div><div class="popts">${o.map((x,j)=>`<span class="po${j===a?' correct':''}"><i>${LET[j]}</i>${x}</span>`).join("")}</div>`;
}
function tfBlock(q, a, fix, withFixLine){
  return `<div class="ptf"><div class="pstem">${q}</div><span class="paren">(<span class="ans">${a?'صحيحة':'خطأ'}</span>)</span></div>
    ${withFixLine && !a ? `<div class="ansblock">التصحيح: ${fix||""}</div>` : ""}`;
}
function orderBlock(items){
  const sh = shuffle(items);
  return `<div class="pord">${sh.map(t=>`<div class="pordi"><span class="box"><span class="ans">${ar(items.indexOf(t)+1)}</span></span>${t}</div>`).join("")}</div>`;
}
function matchBlock(pairs){
  const right = shuffle([...new Set(pairs.map(p=>p[1]))]);
  return `<div class="pmatch"><div class="pcol">${pairs.map((p,k)=>`<div class="pmi"><span class="num">${ar(k+1)}</span><span class="pmt">${p[0]}</span><span class="box"><span class="ans">${LET[right.indexOf(p[1])]}</span></span></div>`).join("")}</div>
    <div class="pcol">${right.map((r,j)=>`<div class="pmi"><span class="num">${LET[j]}</span><span class="pmt">${r}</span></div>`).join("")}</div></div>`;
}
function bankBlock(words){ return `<div class="pbank">${words.map(w=>`<span>${w}</span>`).join("")}</div>`; }
function blankSentence(s, a){ return s.replace("___", `<span class="pblank"><span class="ans">${a}</span></span>`); }

/* ---- page shell ---- */
function shell(data, total, minutes, body){
  return `<div class="ptools noprint">
    <a class="back" href="./${location.pathname.split('/').pop()}">← رجوع للحل الإلكتروني</a>
    <div class="ptoolrow">
      <label class="keyt"><input type="checkbox" id="keyT"> نسخة ولي الأمر (مع الإجابات)</label>
      <button class="btn" id="doPrint">اطبع / احفظ PDF</button>
    </div>
    <p class="hint">من الجوال: اضغط «اطبع» واختر الطابعة أو «حفظ كـ PDF». كل مرة تفتح النسخة، يتغيّر ترتيب أسئلة التوصيل والترتيب.</p>
  </div>
  <article class="paper" id="paper">
    <header class="phead">
      <h1>${data.title}</h1>
      <div class="keybanner">نموذج الإجابة – لولي الأمر</div>
      <div class="pfields">
        <span>الاسم: <i></i></span><span>التاريخ: <i></i></span>
        <span class="pscore">الدرجة: <i></i> / ${ar(total)}</span>${minutes?`<span>الزمن: ${ar(minutes)} دقيقة</span>`:""}
      </div>
    </header>
    ${body}
    <footer class="pfoot">الأسئلة من ${data.source || "كتاب العلوم"} – وزارة التربية، الكويت (طبعة ٢٠٢٦/٢٠٢٧)</footer>
  </article>`;
}

/* ---- practice quiz (10 questions) ---- */
function quizBody(Z){
  return `<ol class="pqlist">${Z.questions.map(q=>{
    let inner = "";
    if (q.t==="mcq") inner = mcqBlock(q.q, q.o, q.a);
    else if (q.t==="tf") inner = tfBlock(q.q, q.a, q.e, false) + (q.a ? "" : `<div class="ansblock">${q.e||""}</div>`);
    else if (q.t==="order") inner = `<div class="pstem">${q.q}</div>` + orderBlock(q.items);
    else if (q.t==="match") inner = `<div class="pstem">${q.q}</div>` + matchBlock(q.pairs);
    else if (q.t==="fill") inner = bankBlock(q.bank) + `<div class="pstem">${blankSentence(q.s, q.a)}</div>`;
    return `<li class="pq"><span class="ptag">${TAGS[q.t]}</span>${inner}</li>`;
  }).join("")}</ol>`;
}

/* ---- full exam ---- */
function examBody(X){
  return X.sections.map((s,si)=>{
    const m = s.marks != null ? s.marks : s.items.length*s.each;
    let inner = "";
    if (s.type==="mcq") inner = `<ol class="pitems">${s.items.map(it=>`<li class="pq">${mcqBlock(it.q,it.o,it.a)}</li>`).join("")}</ol>`;
    else if (s.type==="tf") inner = `<ol class="pitems">${s.items.map(it=>`<li class="pq">${tfBlock(it.q,it.a,it.fix,true)}</li>`).join("")}</ol>`;
    else if (s.type==="fill") inner = bankBlock(s.bank) + `<ol class="pitems">${s.items.map(it=>`<li class="pq"><div class="pstem">${blankSentence(it.q,it.a)}</div></li>`).join("")}</ol>`;
    else if (s.type==="match") inner = matchBlock(s.items.map(it=>[it.q,it.a]));
    else if (s.type==="order") inner = orderBlock(s.items);
    else if (s.type==="compare") inner = `<table class="ptable"><thead><tr><th>وجه المقارنة</th>${s.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>
      ${s.rows.map(r=>`<tr><th>${r.label}</th>${r.answers.map(a=>`<td><span class="ans">${a}</span></td>`).join("")}</tr>`).join("")}</tbody></table>`;
    else if (s.type==="written") inner = `<ol class="pitems">${s.items.map(it=>`<li class="pq"><div class="pstem">${it.q}</div>${lines(2)}<div class="ansblock">${it.model}</div></li>`).join("")}</ol>`;
    return `<section class="psec"><div class="psech"><h2>السؤال ${ORD[si]}</h2><span>(${marksTxt(m)})</span></div><p class="pprompt">${s.prompt}</p>${inner}</section>`;
  }).join("");
}

window.PrintView = {
  render(data, kind){
    document.body.classList.add("printmode");
    const isExam = kind === "exam";
    const total = isExam ? data.total : data.questions.length;
    document.getElementById("app").innerHTML = shell(data, total, isExam ? data.minutes : 0, isExam ? examBody(data) : quizBody(data));
    const paper = document.getElementById("paper");
    document.getElementById("keyT").onchange = e => { paper.classList.toggle("key", e.target.checked); document.title = (e.target.checked ? "نموذج إجابة – " : "") + data.title; };
    document.getElementById("doPrint").onclick = () => window.print();
    document.title = data.title;
  }
};
window.addEventListener("hashchange", () => location.reload());
})();
