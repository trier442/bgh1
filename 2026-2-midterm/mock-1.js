(() => {
const exam=window.BAEGOT_MOCK; const config=window.EXAM_CONFIG; const sb=window.supabase.createClient(config.url,config.key);
const sections=document.getElementById('examSections'),nav=document.getElementById('examNav');
const picks=Array(exam.questions.length).fill(null); const started=Date.now();
let submission=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nums=['①','②','③','④','⑤'];
for(const s of exam.sections){
 const anchor=document.createElement('a');anchor.href='#'+s.id;anchor.textContent=s.title.replace(/^.*?—\s*/,'');nav.append(anchor);
 const block=document.createElement('section');block.id=s.id;block.className='exam-section';
 const source=window.EXAM_DATA[s.sourceKey]; const qs=exam.questions.filter(q=>q.section===s.id);
 block.innerHTML='<h2>'+esc(s.title)+'</h2><p>'+esc(s.intro)+'</p>'+
 '<div class="exam-source">'+esc(source.sourceText)+'</div>'+
 qs.map(q=>'<article id="mock-q'+q.no+'" class="mock-question"><div class="qnum">문제 '+q.no+' / 30</div><div class="mock-stem">'+esc(q.stem)+'</div><div class="mock-choices">'+
 q.options.map((o,i)=>'<label class="choice"><input type="radio" name="mock'+q.no+'" data-q="'+(q.no-1)+'" value="'+i+'"><span><b>'+nums[i]+'</b> '+esc(o)+'</span></label>').join('')+
 '</div></article>').join('');
 sections.append(block);
}
function update(){const n=picks.filter(x=>x!==null).length;document.getElementById('examProgress').textContent='답안 선택 '+n+' / 30';}
sections.addEventListener('change',e=>{if(submission)return;const v=e.target;if(v.matches('input[type=radio][data-q]')){picks[Number(v.dataset.q)]=Number(v.value);update();}});
const btn=document.getElementById('submitExam'),status=document.getElementById('submitStatus');
const stored=JSON.parse(sessionStorage.getItem('baegot-mock-last')||'null');
if(stored && stored.id===exam.id){
 document.getElementById('studentName').value=stored.name||'';
 document.getElementById('studentClass').value=stored.group||'';
}
let attemptId=crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
async function submit(){
 if(submission)return;
 const name=document.getElementById('studentName').value.trim(),group=document.getElementById('studentClass').value.trim();
 if(name.length<2 || name.length>30){status.textContent='학생 이름을 2~30자로 입력해 주세요.';document.getElementById('studentName').focus();return;}
 const missing=picks.findIndex(v=>v===null);
 if(missing>=0){status.textContent='미응답 '+(missing+1)+'번 문항이 있습니다. 모두 선택해 주세요.';location.hash='#mock-q'+(missing+1);return;}
 if(!window.confirm(name+' 학생의 답안을 최종 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.'))return;
 btn.disabled=true;status.textContent='안전하게 채점하고 기록하는 중입니다. 잠시 기다려 주세요.';
 try{
 const {data:payload,error}=await sb.rpc('submit_baegot_mock',{p_attempt_id:attemptId,p_student_name:name,p_student_class:group,p_answers:picks,p_elapsed_seconds:Math.floor((Date.now()-started)/1000)});
 if(error)throw Error(error.message||'제출이 처리되지 않았습니다.');
 submission=true;
 document.querySelectorAll('.mock-choices input').forEach(x=>x.disabled=true);
 document.getElementById('studentName').disabled=true;document.getElementById('studentClass').disabled=true;
 btn.textContent='제출 완료'; status.textContent='제출이 완료되어 교사 성적표에 기록되었습니다.';
 sessionStorage.setItem('baegot-mock-last',JSON.stringify({id:exam.id,name,group}));
 document.getElementById('scoreView').textContent=payload.score+'점 · '+payload.correct_count+'/30 정답';
 document.getElementById('resultDetail').textContent='학생: '+name+' · 제출 결과는 교사용 성적 확인 화면에서 열람할 수 있습니다.';
 const wrap=document.getElementById('review');
 wrap.innerHTML=payload.review.map(item=>{
 const q=exam.questions[item.number-1];return '<article class="review-item '+(item.correct?'correct':'wrong')+'"><h4>'+item.number+'번 · '+(item.correct?'정답':'오답')+'</h4><div>'+esc(q.stem)+'</div><p>내 답: '+nums[item.selected_answer]+' '+esc(q.options[item.selected_answer])+'</p><p>정답: '+nums[item.correct_answer]+' '+esc(q.options[item.correct_answer])+'</p><p><b>해설: </b>'+esc(item.explanation)+'</p><a class="backlink" href="#mock-q'+item.number+'">문제로 돌아가기 ↑</a></article>';
 }).join('');
 document.getElementById('results').classList.add('active');location.hash='#results';
 }catch(e){status.textContent='제출 실패: '+e.message+' · 답안은 유지됩니다. 다시 시도해 주세요.';btn.disabled=false;}
}
btn.addEventListener('click',submit);
update();
})();