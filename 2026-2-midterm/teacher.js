(() => {
const sb=window.supabase.createClient(window.EXAM_CONFIG.url,window.EXAM_CONFIG.key);
const login=document.getElementById('loginBtn'),logout=document.getElementById('logoutBtn'),status=document.getElementById('authStatus');
const panel=document.getElementById('reportPanel'),tbody=document.getElementById('rows'),search=document.getElementById('search'),summary=document.getElementById('summary');
let records=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filtered=()=>records.filter(r=>(r.student_name+' '+r.student_class).toLocaleLowerCase().includes(search.value.toLocaleLowerCase()));
const formatSeconds=s=>Math.floor(s/60)+'분 '+(s%60)+'초';
function render(){
 const list=filtered();const avg=list.length?(list.reduce((a,r)=>a+r.score,0)/list.length).toFixed(1):'-';
 summary.textContent='응시 기록 '+list.length+'건 · 평균 '+avg+'점';
 tbody.innerHTML=list.map(r=>'<tr><td>'+new Date(r.created_at).toLocaleString('ko-KR')+'</td><td>'+esc(r.student_name)+'</td><td>'+esc(r.student_class)+'</td><td><b>'+r.score+'</b></td><td>'+r.correct_count+'/30</td><td>'+formatSeconds(r.elapsed_seconds)+'</td><td>'+esc(r.attempt_id.slice(0,8))+'</td></tr>').join('');
}
async function load(){
 const {data,error}=await sb.from('baegot_mock_attempts').select('id,attempt_id,student_name,student_class,score,correct_count,total_count,elapsed_seconds,created_at').order('created_at',{ascending:false}).limit(2000);
 if(error){status.textContent='성적표 조회 실패: '+error.message;return;}
 records=data||[];render();status.textContent='교사 인증 완료 · 성적표를 갱신했습니다.';
}
async function check(){
 const {data:{user}}=await sb.auth.getUser();
 if(!user){panel.hidden=true;document.getElementById('loginFields').hidden=false;logout.hidden=true;status.textContent='교사 계정으로 로그인해 주세요.';return;}
 const {data:approved,error}=await sb.from('baegot_mock_teachers').select('email').limit(1);
 if(error || !approved || !approved.length){panel.hidden=true;status.textContent='현재 계정은 교사용 권한이 없습니다. 관리자에게 등록을 요청하세요.';await sb.auth.signOut();document.getElementById('loginFields').hidden=false;logout.hidden=true;return;}
 document.getElementById('loginFields').hidden=true;logout.hidden=false;panel.hidden=false;await load();
}
login.addEventListener('click',async()=>{
 login.disabled=true;status.textContent='로그인 확인 중...';
 try{const {error}=await sb.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});
 if(error)throw error;await check();}catch(e){status.textContent='로그인 실패: '+e.message;}finally{login.disabled=false;}
});
logout.addEventListener('click',async()=>{await sb.auth.signOut();records=[];tbody.innerHTML='';await check();});
search.addEventListener('input',render);document.getElementById('refresh').addEventListener('click',load);
document.getElementById('download').addEventListener('click',()=>{
 const rows=[['제출일시','이름','반/구분','점수','정답수','전체문항','풀이초','응시ID'],...filtered().map(r=>[r.created_at,r.student_name,r.student_class,r.score,r.correct_count,r.total_count,r.elapsed_seconds,r.attempt_id])];
 const csv='\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""').replace(/^[=+@-]/,s=>"'"+s)+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='배곧고1_실전모의고사1회_성적표.csv';a.click();URL.revokeObjectURL(url);
});
check();
})();