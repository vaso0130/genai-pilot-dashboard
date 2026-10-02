function render(){
  syncDerived(data);
  renderDashboard();
  renderWbs();
  bindEditable();
  populateSettings();
  updateChrome();
  document.body.classList.toggle('editing',editing);
  document.getElementById('editNotice').hidden=!editing;
  document.getElementById('conflictNotice').hidden=!draftConflict;
}

function bind(path,text,tag='span',cls=''){return `<${tag} class="${cls}" data-edit-path="${path}">${esc(text)}</${tag}>`;}

function renderDashboard(){
  const w=weeks();
  const workdays=w.reduce((s,x)=>s+x.work,0);
  const timeline=w.map(x=>{
    const pct=Math.max(20,Math.round(x.work/5*100));
    const mt=x.meeting?`<div class="meetlab">會議 ${shortDate(x.meeting.date)}</div>`:'';
    return `<div class="week ${x.meeting?'meeting':''} ${x.lock?'lock':''}">
      <div class="version ${x.version===`v${data.project.versionCount}`?'final':''} ${!x.version?'empty':''}">${x.version?esc(x.version+(x.version===`v${data.project.versionCount}`?' 最終':'')):'&nbsp;'}</div>
      <div class="bar"><div class="fill p${x.phase}" style="height:${pct}%"></div>${x.hol?`<div class="holiday">${esc(x.hol.label)}</div>`:''}<div class="days">${x.work}</div></div>
      <div class="wlab">W${x.n}</div><div class="wdate">${shortDate(x.start)}<br>${shortDate(x.end)}</div>${mt}</div>`;
  }).join('');
  const meetingCards=data.meetings.map((m,i)=>`<div class="card meeting"><div class="meta">第 ${i+1} 次</div><h3>${shortDate(m.date)}　${weekday(m.date)}</h3>${bind(`meetings.${i}.body`,m.body,'p')}${bind(`meetings.${i}.after`,m.after,'p','after')}</div>`).join('');
  const weeklyRows=w.map(x=>{
    let task='持續使用與修改',out='累積回饋、觀察數據與版本變化';
    if(x.n===1){task='開工，各中心確定開發者與使用者名單';out='分工確定，題目挑選原則發下去';}
    if(x.n===2){task='提出 2–3 個候選題目，量測現況工時';out='一件平均幾分鐘、一個月幾件';}
    if(x.n===3){task='題目定案、資料使用規定定案、備妥十題固定考題';out='連同標準答案存檔，之後不再更動';}
    if(x.n===4){task='開發者自行試用，確認流程可行';out='第一版能運作即可，不要求好用';}
    if(x.n===5){task='開放同組同事，2–3 人';out='回報開始累積';}
    if(x.n===7){task='開放整個中心，5–10 人';out='擴大實際業務使用';}
    if(x.n===12){task='完成最終版';out='準備鎖版，不再新增功能';}
    if(x.n===13){task='鎖版後只使用、不修改；整理成果數據';out='與第一段基線逐項對比';}
    if(x.n===14){task='成果報告與局內展示';out='完成結案與後續擴大建議';}
    return `<div class="row ${x.meeting?'meeting':''} ${x.lock?'lock':''}"><div class="w">W${x.n}</div><div class="dt">${shortDate(x.start)}–${shortDate(x.end)}${x.hol?`<br><span style="color:var(--warn)">${esc(x.hol.label)}</span>`:''}</div><div class="v">${esc(x.version||'—')}</div><div class="task">${esc(task)}</div><div class="out">${esc(out)}${x.meeting?`<br><b style="color:var(--flag)">${esc(x.meeting.title)} ${shortDate(x.meeting.date)}</b>`:''}</div></div>`;
  }).join('');
  const metrics=data.metrics.map((m,i)=>`<div class="metric"><h4>${bind(`metrics.${i}.name`,m.name)}</h4><b>${bind(`metrics.${i}.direction`,m.direction)}</b>${bind(`metrics.${i}.desc`,m.desc,'p')}</div>`).join('');
  document.getElementById('dashboardView').innerHTML=`
    <div class="tags"><span class="tag on">${shortDate(data.project.startDate)} ～ ${shortDate(data.project.endDate)}</span>${data.project.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="facts"><div class="fact"><small>推動週數</small><strong>${w.length}</strong> 週</div><div class="fact"><small>可用工作日</small><strong>${workdays}</strong> 日</div><div class="fact"><small>版本數</small><strong>${data.project.versionCount}</strong> 版</div><div class="fact"><small>進度會議</small><strong>${data.meetings.length}</strong> 次</div><div class="fact"><small>參與中心</small><strong>${data.project.centers}</strong> 個</div></div>
    <section class="section"><h2>十四週、九個版本、四次會議<span>所有日期由專案設定連動</span></h2><div class="timeline">${timeline}</div></section>
    <section class="section"><h2>進度會議<span>修改日期後，WBS 的會議節點同步更新</span></h2><div class="cards">${meetingCards}</div></section>
    <section class="section"><h2>每次會議各中心要報的四個數據</h2><div class="metrics">${metrics}</div></section>
    <section class="section"><h2>每週在做什麼</h2><div class="rows">${weeklyRows}</div></section>`;
}

function renderWbs(){
  const groups=data.groups.map((g,gi)=>`<div class="wbs-group"><div class="group-head"><div class="code">${esc(g.code)}</div><h3>${bind(`groups.${gi}.title`,g.title)}</h3><div class="period">${esc(g.period)}</div></div><div class="node-list">${g.items.map((it,ii)=>`<div class="node ${it.gate?'gate':''}"><div class="code">${esc(it.code)}</div><h4>${bind(`groups.${gi}.items.${ii}.title`,it.title)}</h4>${bind(`groups.${gi}.items.${ii}.desc`,it.desc,'p')}${it.chips?.length?`<div class="chips">${it.chips.map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div>`:''}</div>`).join('')}</div></div>`).join('');
  const rows=data.groups.flatMap((g,gi)=>g.items.map((it,ii)=>`<tr class="${it.gate?'gate':''}"><td>${esc(it.code)}</td><td>${esc(it.time)}</td><td>${bind(`groups.${gi}.items.${ii}.title`,it.title)}</td><td>${bind(`groups.${gi}.items.${ii}.desc`,it.desc)}</td></tr>`)).join('');
  document.getElementById('wbsView').innerHTML=`<div class="wbs-root"><div class="rootbox"><h2>${bind('project.title',data.project.title)}</h2><p>${data.project.centers} 個中心 ・ 14 週 ・ ${data.project.versionCount} 個版本 ・ ${data.meetings.length} 次進度會議</p></div></div><div class="wbs-cols">${groups}</div><section class="section"><h2>項目索引<span>上方 WBS 與此索引共用同一批資料</span></h2><table class="index-table"><thead><tr><th>編號</th><th>時間</th><th>項目</th><th>產出或判準</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function bindEditable(){
  document.querySelectorAll('[data-edit-path]').forEach(el=>{
    el.contentEditable=editing&&isAdmin?'true':'false';
    el.onblur=()=>{
      if(!editing||!isAdmin)return;
      setByPath(data,el.dataset.editPath,el.textContent.trim());
      markDraft();
      render();
    };
    el.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.blur();}};
  });
}

function populateSettings(){
  const f=document.getElementById('settingsForm');
  ['title','startDate','endDate','centers','versionCount','meetingCount','lockDate','approvalDate','demoDate','closeDate','bufferStart'].forEach(k=>{if(f.elements[k])f.elements[k].value=data.project[k]??'';});
  const mi=document.getElementById('meetingInputs');
  mi.innerHTML=data.meetings.map((m,i)=>`<div class="grid2"><label>第 ${i+1} 次日期<input type="date" data-meeting-date="${i}" value="${m.date}"></label><label>名稱<input type="text" data-meeting-title="${i}" value="${esc(m.title)}"></label></div>`).join('');
  mi.querySelectorAll('input').forEach(inp=>inp.onchange=()=>{
    if(!isAdmin)return;
    const i=Number(inp.dataset.meetingDate??inp.dataset.meetingTitle);
    if(inp.dataset.meetingDate!=null)data.meetings[i].date=inp.value;else data.meetings[i].title=inp.value;
    markDraft();render();
  });
  f.querySelectorAll('input').forEach(i=>i.disabled=!isAdmin && i.name!=='meetingCount');
}

function updateChrome(){
  document.querySelector('h1').textContent=data.project.title;
  const editBtn=document.getElementById('editToggle');
  const publishBtn=document.getElementById('publishBtn');
  const settingsBtn=document.getElementById('settingsToggle');
  const authBtn=document.getElementById('authBtn');
  editBtn.hidden=!isAdmin;publishBtn.hidden=!isAdmin;settingsBtn.hidden=!isAdmin;
  editBtn.textContent=editing?'✓ 完成編輯':'✎ 編輯模式';
  publishBtn.disabled=!draftDirty||draftConflict||!backendConfigured;
  authBtn.textContent=session?(isAdmin?'登出管理者':'登出'):'管理者登入';
  document.getElementById('footerVersion').textContent=serverVersion?`線上版本 v${serverVersion}`:'線上版本 —';
  document.getElementById('lastUpdated').textContent=serverUpdatedAt?`最後發布：${fmtDateTime(serverUpdatedAt)}${draftDirty?' · 有未發布草稿':''}`:(draftDirty?'有未發布草稿':'');
}

function openDrawer(open=true){
  if(open&&!isAdmin){toast('只有管理者可以修改專案設定。');return;}
  document.getElementById('settingsDrawer').classList.toggle('open',open);
  document.getElementById('settingsDrawer').setAttribute('aria-hidden',String(!open));
  document.getElementById('backdrop').hidden=!open;
}
function openAuth(open=true){document.getElementById('authModal').hidden=!open;if(open)setTimeout(()=>document.getElementById('authEmail').focus(),50);}

function markDraft(){
  if(!isAdmin)return;
  syncDerived(data);
  draftDirty=true;
  try{localStorage.setItem(DRAFT_KEY,JSON.stringify({baseVersion:serverVersion,savedAt:new Date().toISOString(),data}));}catch{}
  updateChrome();
  setSync('已儲存本機草稿，尚未發布','warn');
}
function clearDraft(){draftDirty=false;draftConflict=false;try{localStorage.removeItem(DRAFT_KEY);}catch{}}
function readDraft(){try{const raw=localStorage.getItem(DRAFT_KEY);return raw?JSON.parse(raw):null;}catch{return null;}}
function restoreDraftIfPossible(){
  if(!isAdmin)return;
  const draft=readDraft();if(!draft?.data)return;
  if(Number(draft.baseVersion)!==Number(serverVersion)){
    draftDirty=true;draftConflict=true;
    setSync('發現舊草稿，但線上版本已更新','warn');
    return;
  }
  data=normalizeData(draft.data);draftDirty=true;draftConflict=false;
  setSync('已載入你的未發布草稿','warn');
}
