(() => {
  const id = window.CHAPTER_ID;
  const chapter = window.EXAM_DATA && window.EXAM_DATA[id];
  if(!chapter) return;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]));
  const letter = i => ["①","②","③","④","⑤"][i] || String(i+1);

  document.title = chapter.title + " | 배곧고1 중간고사 대비";
  document.querySelector("#chapter-title").textContent = chapter.title;
  document.querySelector("#chapter-subtitle").textContent = chapter.subtitle || "";
  document.querySelector("#chapter-range").textContent = chapter.range || "";

  const sourceBox = document.querySelector("#source-box");
  if(sourceBox && chapter.sourceText){
    sourceBox.innerHTML = `
      <div class="source-head">
        <div>
          <div class="source-kicker">문제 풀이용 제시문</div>
          <h2>${esc(chapter.sourceTitle || "공통 제시문")}</h2>
          <p>${esc(chapter.sourceLabel || "")}</p>
        </div>
        <a class="btn btn-light source-jump" href="#questions">문제로 이동 ↓</a>
      </div>
      <div class="source-text">${esc(chapter.sourceText)}</div>
    `;
  }

  const key = "baegot2026mid:"+id;
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  const wrap = document.querySelector("#questions");
  const wrongWrap = document.querySelector("#wrong-list");
  const wrongEmpty = document.querySelector("#wrong-empty");
  const scoreEl = document.querySelector("#score");
  const fill = document.querySelector("#progress-fill");

  function save(){ localStorage.setItem(key, JSON.stringify(saved)); }

  function grade(qi, selected, restore=false){
    if(saved[qi] !== undefined && !restore) return;
    saved[qi] = selected; save();
    const q = chapter.questions[qi];
    const card = document.querySelector("#q-"+(qi+1));
    const inputs = card.querySelectorAll("input");
    inputs.forEach((input, idx) => {
      input.disabled = true;
      input.closest(".choice").classList.add("locked");
      if(idx === q.answer) input.closest(".choice").classList.add("correct-choice");
      if(idx === selected && selected !== q.answer) input.closest(".choice").classList.add("wrong-choice");
    });
    const fb = card.querySelector(".feedback");
    if(selected === q.answer){
      card.classList.add("correct");
      fb.className="feedback show ok";
      fb.textContent="✓ 정답입니다.";
    } else {
      card.classList.add("wrong");
      fb.className="feedback show bad";
      fb.textContent="✗ 오답입니다. 정답은 "+letter(q.answer)+"입니다. 페이지 하단 오답 해설에서 다시 확인하세요.";
    }
    updateStatus();
    renderWrong();
  }

  chapter.questions.forEach((q, qi) => {
    const card = document.createElement("section");
    card.className="question"; card.id="q-"+(qi+1);
    const choices = q.choices.map((c, ci)=>`
      <label class="choice">
        <input type="radio" name="q${qi}" value="${ci}">
        <span><b>${letter(ci)}</b> ${esc(c)}</span>
      </label>`).join("");
    card.innerHTML=`
      <div class="qnum">문제 ${qi+1} / 20</div>
      <div class="qtext">${esc(q.q)}</div>
      <div class="choices">${choices}</div>
      <div class="feedback"></div>
      <a class="source-link" href="#source-box">제시문 다시 보기 ↑</a>`;
    wrap.appendChild(card);
    card.querySelectorAll("input").forEach(input => input.addEventListener("change", e => grade(qi, Number(e.target.value))));
  });

  Object.keys(saved).forEach(k => {
    const qi=Number(k), val=Number(saved[k]);
    const input=document.querySelector(`#q-${qi+1} input[value="${val}"]`);
    if(input){ input.checked=true; grade(qi,val,true); }
  });

  function updateStatus(){
    const answered = Object.keys(saved).length;
    let correct=0;
    Object.entries(saved).forEach(([k,v]) => { if(chapter.questions[Number(k)].answer === Number(v)) correct++; });
    scoreEl.textContent = `풀이 ${answered}/20 · 정답 ${correct} · 오답 ${answered-correct}`;
    fill.style.width = (answered/20*100)+"%";
  }

  function renderWrong(){
    const wrongs = Object.entries(saved).filter(([k,v]) => chapter.questions[Number(k)].answer !== Number(v));
    wrongWrap.innerHTML="";
    wrongEmpty.style.display = wrongs.length ? "none" : "block";
    wrongs.forEach(([k,v]) => {
      const qi=Number(k), q=chapter.questions[qi], selected=Number(v);
      const div=document.createElement("div"); div.className="wrong-item";
      div.innerHTML=`
        <h3>${qi+1}번 오답</h3>
        <p><b>내 답:</b> ${letter(selected)} ${esc(q.choices[selected])}</p>
        <p><b>정답:</b> ${letter(q.answer)} ${esc(q.choices[q.answer])}</p>
        <p class="explain"><b>해설:</b> ${esc(q.exp)}</p>
        <a class="backlink" href="#q-${qi+1}">문제로 돌아가기 ↑</a>`;
      wrongWrap.appendChild(div);
    });
  }

  document.querySelector("#reset").addEventListener("click", () => {
    if(confirm("이 챕터의 풀이 기록을 모두 초기화할까요?")){
      localStorage.removeItem(key); location.reload();
    }
  });
  updateStatus(); renderWrong();
})();