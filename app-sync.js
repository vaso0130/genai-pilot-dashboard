async function initBackend(){
  if(!backendConfigured){
    publishedData=clone(DEFAULT_DATA);data=clone(DEFAULT_DATA);
    const notice=document.getElementById('backendNotice');
    notice.hidden=false;
    notice.innerHTML='目前網站程式已就緒，但尚未填入 Supabase Project URL / anon key，因此暫時以內建資料唯讀顯示。完成 <code>config.js</code> 設定後會自動切換成共用資料模式。';
    setSync('Supabase 尚未完成連線設定','err');
    return;
  }
  supabaseClient=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  await loadPublished();
  await refreshAuth();
  subscribeRealtime();
  supabaseClient.auth.onAuthStateChange(async (_event,newSession)=>{
    session=newSession;
    await refreshAdmin();
    if(isAdmin)restoreDraftIfPossible();
    if(!isAdmin){editing=false;}
    render();
  });
}

async function loadPublished(){
  setSync('正在讀取共用資料…','warn');
  const {data:row,error}=await supabaseClient.from('project_state').select('data,version,updated_at').eq('id',1).single();
  if(error){
    publishedData=clone(DEFAULT_DATA);data=clone(DEFAULT_DATA);
    setSync('共用資料讀取失敗','err');
    toast(`Supabase 讀取失敗：${error.message}`);
    return;
  }
  publishedData=normalizeData(row.data);syncDerived(publishedData);
  data=clone(publishedData);serverVersion=Number(row.version||1);serverUpdatedAt=row.updated_at;
  setSync('已同步最新發布版本','ok');
}

async function refreshAuth(){
  if(!supabaseClient)return;
  const {data:{session:current}}=await supabaseClient.auth.getSession();
  session=current;await refreshAdmin();
  if(isAdmin)restoreDraftIfPossible();
}
async function refreshAdmin(){
  isAdmin=false;if(!session||!supabaseClient)return;
  const {data:allowed,error}=await supabaseClient.rpc('is_app_admin');
  if(!error)isAdmin=Boolean(allowed);
}

function subscribeRealtime(){
  if(!supabaseClient)return;
  if(realtimeChannel)supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel=supabaseClient.channel('project-state-live')
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'project_state',filter:'id=eq.1'},payload=>{
      const incomingVersion=Number(payload.new.version||0);
      if(incomingVersion<=serverVersion)return;
      const incoming=normalizeData(payload.new.data);syncDerived(incoming);
      if(draftDirty){
        serverVersion=incomingVersion;serverUpdatedAt=payload.new.updated_at;publishedData=incoming;draftConflict=true;
        setSync('線上已有新版本；你的草稿尚未覆蓋它','warn');render();
      }else{
        serverVersion=incomingVersion;serverUpdatedAt=payload.new.updated_at;publishedData=incoming;data=clone(incoming);
        setSync('已即時同步新的發布版本','ok');render();
      }
    }).subscribe();
}

async function publishDraft(){
  if(!isAdmin||!draftDirty||draftConflict||!supabaseClient)return;
  const btn=document.getElementById('publishBtn');btn.disabled=true;btn.textContent='發布中…';
  syncDerived(data);
  const {data:result,error}=await supabaseClient.rpc('publish_project_state',{expected_version:serverVersion,new_data:data});
  btn.textContent='↑ 發布變更';
  if(error){
    if(error.code==='40001'||/version conflict/i.test(error.message||'')){
      draftConflict=true;setSync('發布失敗：線上已有較新版本','warn');toast('有人比你先發布了新版本。請先重新載入線上資料再修改。');
    }else{setSync('發布失敗','err');toast(`發布失敗：${error.message}`);}
    render();return;
  }
  const row=Array.isArray(result)?result[0]:result;
  publishedData=normalizeData(row?.data||data);syncDerived(publishedData);data=clone(publishedData);
  serverVersion=Number(row?.version||serverVersion+1);serverUpdatedAt=row?.updated_at||new Date().toISOString();
  clearDraft();editing=false;setSync('已發布，所有人將看到此版本','ok');render();
}

async function sendMagicLink(email){
  const redirectTo=`${location.origin}${location.pathname}`;
  const {error}=await supabaseClient.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});
  if(error)throw error;
}

async function logout(){
  if(supabaseClient)await supabaseClient.auth.signOut();
  session=null;isAdmin=false;editing=false;openDrawer(false);clearDraft();data=clone(publishedData);setSync('已登出；目前顯示最新發布版本','ok');render();
}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  const v=btn.dataset.view;document.getElementById('dashboardView').hidden=v!=='dashboard';document.getElementById('wbsView').hidden=v!=='wbs';
}));
document.getElementById('editToggle').onclick=()=>{if(!isAdmin)return;editing=!editing;render();};
document.getElementById('publishBtn').onclick=publishDraft;
document.getElementById('settingsToggle').onclick=()=>openDrawer(true);
document.getElementById('closeDrawer').onclick=()=>openDrawer(false);
document.getElementById('backdrop').onclick=()=>openDrawer(false);
document.getElementById('settingsForm').addEventListener('change',e=>{
  if(!isAdmin)return;const el=e.target;if(!el.name||el.name==='meetingCount')return;
  let val=el.value;if(['centers','versionCount'].includes(el.name))val=Number(val);
  data.project[el.name]=val;markDraft();render();
});
document.getElementById('exportJson').onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='genai-pilot-data.json';a.click();URL.revokeObjectURL(a.href);
};
document.getElementById('importJson').onchange=async e=>{
  const f=e.target.files?.[0];if(!f||!isAdmin)return;
  try{data=normalizeData(JSON.parse(await f.text()));markDraft();render();toast('JSON 已匯入為未發布草稿。');}catch(err){toast('JSON 格式錯誤：'+err.message);}e.target.value='';
};
document.getElementById('restorePublished').onclick=()=>{
  if(!isAdmin)return;if(confirm('放棄目前未發布草稿，恢復成線上版本？')){clearDraft();data=clone(publishedData);editing=false;setSync('已恢復線上版本','ok');render();}
};
document.getElementById('loadDefaults').onclick=()=>{
  if(!isAdmin)return;if(confirm('將最初的專案資料載入成草稿？線上資料不會立刻改變，仍需按「發布變更」。')){data=clone(DEFAULT_DATA);markDraft();render();}
};
document.getElementById('reloadRemote').onclick=async()=>{if(!supabaseClient)return;clearDraft();await loadPublished();editing=false;render();};
document.getElementById('authBtn').onclick=()=>{
  if(session){logout();return;}
  if(!backendConfigured){toast('尚未設定 Supabase，管理者登入目前不可用。');return;}
  document.getElementById('authMessage').textContent='';openAuth(true);
};
document.getElementById('closeAuth').onclick=()=>openAuth(false);
document.getElementById('authModal').addEventListener('click',e=>{if(e.target===e.currentTarget)openAuth(false);});
document.getElementById('authForm').addEventListener('submit',async e=>{
  e.preventDefault();const email=document.getElementById('authEmail').value.trim();const msg=document.getElementById('authMessage');
  msg.textContent='正在寄送…';
  try{await sendMagicLink(email);msg.textContent='登入連結已寄出。請到信箱點擊後回到此頁。';}catch(err){msg.textContent=`寄送失敗：${err.message}`;}
});

(async function init(){
  await initBackend();
  render();
})();
