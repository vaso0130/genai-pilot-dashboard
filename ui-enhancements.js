// UI enhancements: readable milestone labels + deletable WBS nodes.
(function(){
  function enhanceScheduleCards(){
    document.querySelectorAll('#dashboardView .card.meeting').forEach((card,i)=>{
      const m=data?.meetings?.[i];
      if(!m)return;
      const meta=card.querySelector('.meta');
      const h3=card.querySelector('h3');
      if(meta)meta.textContent=m.title||`重要時程 ${i+1}`;
      if(h3){
        if(m.dateLabel) h3.textContent=m.dateLabel;
        else if(m.date) h3.textContent=`${shortDate(m.date)}　${weekday(m.date)}`;
      }
    });
  }

  function enhanceWbsDelete(){
    document.querySelectorAll('#wbsView .wbs-group').forEach((groupEl,gi)=>{
      groupEl.querySelectorAll('.node').forEach((nodeEl,ii)=>{
        if(nodeEl.querySelector('.delete-node'))return;
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='delete-node';
        btn.title='刪除此項目';
        btn.setAttribute('aria-label','刪除此項目');
        btn.textContent='×';
        btn.onclick=(e)=>{
          e.preventDefault();e.stopPropagation();
          if(!editing||!isAdmin)return;
          const item=data?.groups?.[gi]?.items?.[ii];
          if(!item)return;
          if(!confirm(`刪除「${item.code} ${item.title}」？`))return;
          data.groups[gi].items.splice(ii,1);
          markDraft();
          render();
        };
        nodeEl.appendChild(btn);
      });
    });
  }

  function enhance(){
    enhanceScheduleCards();
    enhanceWbsDelete();
  }

  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',enhance);
  setTimeout(enhance,0);
})();
