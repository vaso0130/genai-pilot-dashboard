// UI enhancements: milestone labels, editable WBS structure, font-size controls.
(function(){
  const FONT_KEY='genai-pilot-font-size';
  const FONT_CLASSES=['font-sm','font-md','font-lg','font-xl'];

  // WBS 項目改為完全手動維護。
  // 原本 syncDerived() 會在每次 render 時強制覆寫黃色 gate 節點的時間/標題，
  // 導致使用者看似能編輯、實際上馬上又被還原。
  if(typeof syncDerived==='function'){
    syncDerived=function(target=data){
      if(!target||typeof target!=='object')return;
      if(target.project)target.project.meetingCount=Array.isArray(target.meetings)?target.meetings.length:0;
      const groups=Array.isArray(target.groups)?target.groups:[];
      if(groups[1]&&target.project?.startDate){
        groups[1].period=`W1–W3　${shortDate(target.project.startDate)}–${shortDate(addDays(target.project.startDate,20))}`;
      }
      if(groups[2]&&target.project?.startDate){
        groups[2].period=`W4–W12　${shortDate(addDays(target.project.startDate,21))}–${shortDate(addDays(target.project.startDate,83))}`;
      }
      if(groups[3]&&target.project?.lockDate&&target.project?.endDate){
        groups[3].period=`W13–W14　${shortDate(target.project.lockDate)}–${shortDate(target.project.endDate)}`;
      }
    };
  }

  function setText(el,text){if(el && el.textContent!==text)el.textContent=text;}

  function setByPathSafe(path,value){
    if(typeof setByPath==='function')setByPath(data,path,value);
  }

  function enhanceScheduleCards(){
    document.querySelectorAll('#dashboardView .card.meeting').forEach((card,i)=>{
      const m=data?.meetings?.[i];if(!m)return;
      setText(card.querySelector('.meta'),m.title||`重要時程 ${i+1}`);
      const h3=card.querySelector('h3');
      if(h3){const label=m.dateLabel?m.dateLabel:(m.date?`${shortDate(m.date)}　${weekday(m.date)}`:'日期待確認');setText(h3,label);}
    });
  }

  function bindInlineEditable(el,path){
    if(!el||el.dataset.enhancedEditable==='1')return;
    el.dataset.enhancedEditable='1';
    el.dataset.editPath=path;
    el.classList.add(path.endsWith('.code')?'editable-code':'editable-time');
    el.onblur=()=>{
      if(!editing||!isAdmin)return;
      setByPathSafe(path,el.textContent.trim());
      markDraft();render();
    };
    el.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.blur();}};
  }

  function enhanceWbsStructure(){
    document.querySelectorAll('#wbsView .wbs-group').forEach((groupEl,gi)=>{
      const g=data?.groups?.[gi];if(!g)return;
      const groupCode=groupEl.querySelector('.group-head .code');
      if(groupCode)bindInlineEditable(groupCode,`groups.${gi}.code`);

      groupEl.querySelectorAll('.node').forEach((nodeEl,ii)=>{
        const item=g.items?.[ii];if(!item)return;
        const codeEl=nodeEl.querySelector('.code');
        if(codeEl)bindInlineEditable(codeEl,`groups.${gi}.items.${ii}.code`);
        if(!nodeEl.querySelector('.delete-node')){
          const btn=document.createElement('button');
          btn.type='button';btn.className='delete-node';btn.title='刪除此項目';btn.setAttribute('aria-label','刪除此項目');btn.textContent='×';
          btn.onclick=e=>{e.preventDefault();e.stopPropagation();if(!editing||!isAdmin)return;if(!confirm(`刪除「${item.code} ${item.title}」？`))return;data.groups[gi].items.splice(ii,1);markDraft();render();};
          nodeEl.appendChild(btn);
        }
      });

      if(!groupEl.querySelector('.add-node')){
        const addBtn=document.createElement('button');
        addBtn.type='button';addBtn.className='add-node';addBtn.textContent='＋ 新增項目';
        addBtn.onclick=()=>{
          if(!editing||!isAdmin)return;
          const next=(g.items?.length||0)+1;
          g.items.push({code:`${g.code}.${next}`,time:'未設定',title:'新增項目',desc:'請輸入內容'});
          markDraft();render();
        };
        groupEl.appendChild(addBtn);
      }
    });

    document.querySelectorAll('#wbsView .index-table tbody tr').forEach((tr,rowIndex)=>{
      let counter=0,targetGi=-1,targetIi=-1;
      outer:for(let gi=0;gi<(data.groups?.length||0);gi++){
        for(let ii=0;ii<(data.groups[gi].items?.length||0);ii++){
          if(counter===rowIndex){targetGi=gi;targetIi=ii;break outer;}counter++;
        }
      }
      if(targetGi<0)return;
      const cells=tr.querySelectorAll('td');
      if(cells[0])bindInlineEditable(cells[0],`groups.${targetGi}.items.${targetIi}.code`);
      if(cells[1])bindInlineEditable(cells[1],`groups.${targetGi}.items.${targetIi}.time`);
    });
  }

  function applyFontSize(size){
    const s=FONT_CLASSES.includes(`font-${size}`)?size:'lg';
    FONT_CLASSES.forEach(c=>document.body.classList.remove(c));
    document.body.classList.add(`font-${s}`);
    try{localStorage.setItem(FONT_KEY,s);}catch{}
    const sel=document.getElementById('fontSizeSelect');if(sel&&sel.value!==s)sel.value=s;
  }

  function ensureFontControl(){
    const toolbar=document.querySelector('.toolbar');if(!toolbar||document.getElementById('fontSizeSelect'))return;
    const wrap=document.createElement('div');wrap.className='font-size-control';
    wrap.innerHTML='<label for="fontSizeSelect">字體</label><select id="fontSizeSelect" aria-label="字體大小"><option value="sm">小</option><option value="md">中</option><option value="lg">大</option><option value="xl">特大</option></select>';
    toolbar.insertBefore(wrap,toolbar.firstChild);
    const sel=wrap.querySelector('select');
    sel.onchange=()=>applyFontSize(sel.value);
    let saved='lg';try{saved=localStorage.getItem(FONT_KEY)||'lg';}catch{}
    applyFontSize(saved);
  }

  function enhance(){enhanceScheduleCards();enhanceWbsStructure();ensureFontControl();}
  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',enhance);
  setTimeout(enhance,0);
})();
