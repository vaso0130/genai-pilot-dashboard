const DRAFT_KEY = 'tcg-genai-pilot-draft-v3';
const CONFIG = window.APP_CONFIG || {};

const DEFAULT_DATA = {
  project: {
    title: '生成式 AI 公務應用試辦',
    startDate: '2026-09-14', endDate: '2026-12-18', centers: 5,
    versionCount: 9, meetingCount: 4, lockDate: '2026-12-07',
    approvalDate: '2026-10-02', demoDate: '2026-12-17', closeDate: '2026-12-18', bufferStart: '2026-12-21',
    tags: ['地端部署','Open WebUI','Gemma 4 31B','局級成果展示']
  },
  meetings: [
    {date:'2026-10-08', title:'會議一', body:'確認 v1 各中心都跑得動；核定「產出由誰複核、複核什麼、可以用在哪」。', after:'會後：W5 開放同組同事，2–3 人'},
    {date:'2026-10-29', title:'會議二', body:'確認帳號權限分級、紀錄留存期限與抽查機制已完成；檢視前三週的回報量與版本變化。', after:'會後：開放整個中心，5–10 人'},
    {date:'2026-11-19', title:'會議三', body:'中期檢視。各中心報四個數據，並提出哪些題目走不下去、要不要改成簡報說明。', after:'會後：繼續跑到 12/06'},
    {date:'2026-12-10', title:'會議四', body:'確認 12/07 已鎖版；數據定稿，逐項核對是否回推得到基線；分配 12/17 展示的順序與分工。', after:'會後：準備 12/17 局內展示'}
  ],
  holidays: [
    {date:'2026-09-25', label:'中秋'}, {date:'2026-09-28', label:'教師節'},
    {date:'2026-10-09', label:'國慶補假'}, {date:'2026-10-26', label:'光復節補假'}
  ],
  metrics: [
    {name:'可用比例', direction:'應往上', desc:'產出可直接使用或小幅修改即可使用的比例。'},
    {name:'修改逾十五分鐘的比例', direction:'應往下', desc:'與第一段量出的現況工時對比，這是節省時間的主線。'},
    {name:'使用次數', direction:'應持平或上升', desc:'明顯下降需追原因，通常代表大家不想用了。'},
    {name:'十題固定考題', direction:'不得退步', desc:'有題目較前一版變差，須說明原因與處理方式。'}
  ],
  groups: [
    {code:'0', title:'共用規定', period:'全期適用', items:[
      {code:'0.1',time:'全期',title:'每週一發版',desc:'五中心同日發版，註明改了什麼、哪些回報還沒處理'},
      {code:'0.2',time:'全期',title:'十題固定考題',desc:'每版上線前跑過一次，不得比前一版退步'},
      {code:'0.3',time:'每三週',title:'四個數據',desc:'可用比例、改逾 15 分鐘比例、使用次數、十題結果'},
      {code:'0.4',time:'12/07',title:'全體鎖版',desc:'五中心同時停止修改，否則數據基礎不一致'},
      {code:'0.5',time:'全期',title:'對外產出須人核閱',desc:'公文、法規函釋、民眾答覆一律具名核閱後發出'}
    ]},
    {code:'1', title:'第一段　備齊', period:'W1–W3　09/14–10/04', items:[
      {code:'1.1',time:'W1',title:'分工確定',desc:'各中心開發者與使用者名單'},
      {code:'1.2',time:'W2–W3',title:'題目定案',desc:'候選 2–3 個，W3 收斂為一個'},
      {code:'1.3',time:'W2–W3',title:'現況工時',desc:'單件耗時、月均件數、投入人力、退件率',chips:['至少取樣 10 件']},
      {code:'1.4',time:'W3',title:'資料使用規定',desc:'可輸入與禁止輸入的類別、去識別化要求',chips:['法制與資安會簽']},
      {code:'1.5',time:'W3',title:'十題固定考題',desc:'實際案例十則，附標準答案，之後不再更動'},
      {code:'1.6',time:'W3',title:'填報表定稿',desc:'九個欄位填齊'},
      {code:'1.7',time:'10/02 五',title:'10/02 核定',desc:'1.2、1.3、1.4 缺一項不進入第二段',gate:true}
    ]},
    {code:'2', title:'第二段　持續使用與修改', period:'W4–W12　10/05–12/06', items:[
      {code:'2.1',time:'W4–W12',title:'版本發布',desc:'v1 至 v9，每週一',chips:['v1 W4','v2 W5','v3 W6','v4 W7','v5 W8','v6 W9','v7 W10','v8 W11','v9 W12 最終版']},
      {code:'2.2',time:'W4–W12',title:'開放節奏',desc:'1 人 → 2–3 人 → 5–10 人',chips:['W4 開發者自用','W5–W6 同組 2–3 人','W7–W12 全中心 5–10 人']},
      {code:'2.3',time:'W4',title:'產出複核機制',desc:'誰複核、複核什麼、產出可用範圍'},
      {code:'2.4',time:'W6',title:'權限與紀錄留存',desc:'帳號分級、紀錄留存期限與位置、抽查負責人'},
      {code:'2.5',time:'10/08 四',title:'10/08 會議一',desc:'確認 v1 可運作、核定 2.3。通過後開放同組',gate:true, meetingIndex:0},
      {code:'2.6',time:'10/29 四',title:'10/29 會議二',desc:'核定 2.4。通過後開放整個中心',gate:true, meetingIndex:1},
      {code:'2.7',time:'11/19 四',title:'11/19 會議三',desc:'中期檢視，決定哪些題目降級為簡報說明',gate:true, meetingIndex:2}
    ]},
    {code:'3', title:'第三段　鎖版收尾', period:'W13–W14　12/07–12/18', items:[
      {code:'3.1',time:'12/07',title:'12/07 鎖版',desc:'只使用不修改，後續建議一律記錄不動手'},
      {code:'3.2',time:'W13',title:'數據整理',desc:'四條線與 1.3 現況基線逐項對比',chips:['無法佐證者不列入']},
      {code:'3.3',time:'12/10 四',title:'12/10 會議四',desc:'數據定稿、分配展示順序與分工',gate:true, meetingIndex:3},
      {code:'3.4',time:'W14',title:'成果報告',desc:'五中心彙整，含明年度擴大建議'},
      {code:'3.5',time:'12/17 四',title:'12/17 局內展示',desc:'每中心十分鐘，實機操作與數據說明',gate:true},
      {code:'3.6',time:'12/18 五',title:'12/18 結案',desc:'報告提交。12/21–12/24 緩衝與核銷'}
    ]}
  ]
};

let data = clone(DEFAULT_DATA);
let publishedData = clone(DEFAULT_DATA);
let editing = false;
let draftDirty = false;
let draftConflict = false;
let serverVersion = 0;
let serverUpdatedAt = null;
let session = null;
let isAdmin = false;
let realtimeChannel = null;
let supabaseClient = null;
const backendConfigured = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase?.createClient);

function clone(v){return JSON.parse(JSON.stringify(v));}
function normalizeData(input){
  const base=clone(DEFAULT_DATA);
  if(!input || typeof input!=='object' || Array.isArray(input) || !Object.keys(input).length) return base;
  return {
    ...base,
    ...input,
    project:{...base.project,...(input.project||{})},
    meetings:Array.isArray(input.meetings)?input.meetings:base.meetings,
    holidays:Array.isArray(input.holidays)?input.holidays:base.holidays,
    metrics:Array.isArray(input.metrics)?input.metrics:base.metrics,
    groups:Array.isArray(input.groups)?input.groups:base.groups
  };
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function shortDate(iso){if(!iso)return'';const d=new Date(iso+'T00:00:00');return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;}
function addDays(iso,n){const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function diffDays(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000)+1;}
function weekday(iso){return ['日','一','二','三','四','五','六'][new Date(iso+'T00:00:00').getDay()];}
function isBetween(d,a,b){return d>=a&&d<=b;}
function setByPath(obj,path,value){const keys=path.split('.');let cur=obj;for(let i=0;i<keys.length-1;i++)cur=cur[keys[i]];cur=cur||obj;cur[keys.at(-1)]=value;}
function fmtDateTime(iso){if(!iso)return'';try{return new Intl.DateTimeFormat('zh-TW',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));}catch{return iso;}}

function setSync(message,state='ok'){
  document.getElementById('syncStatus').textContent=message;
  const dot=document.getElementById('syncDot');
  dot.className=`sync-dot ${state}`;
}
function toast(message){
  const el=document.getElementById('backendNotice');
  el.textContent=message;el.hidden=false;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>{if(backendConfigured)el.hidden=true;},5000);
}

function weeks(){
  const result=[]; const start=data.project.startDate; const end=data.project.endDate;
  for(let i=0;i<14;i++){
    const s=addDays(start,i*7); if(s>end)break; const e=i===13?end:addDays(s,6);
    const hol=data.holidays.find(h=>isBetween(h.date,s,e));
    let work=5-(hol?1:0); if(i===13)work=Math.min(work,diffDays(s,end));
    const meeting=data.meetings.find(m=>isBetween(m.date,s,e));
    let version=''; if(i>=3 && i<3+Math.min(9,data.project.versionCount)) version='v'+(i-2);
    const phase=i<3?1:(i<12?2:3);
    result.push({n:i+1,start:s,end:e,work,hol,meeting,version,phase,lock:isBetween(data.project.lockDate,s,e)});
  }
  return result;
}

function syncDerived(target=data){
  target.project.meetingCount=target.meetings.length;
  const g1=target.groups[1],g2=target.groups[2],g3=target.groups[3];
  if(g1){
    g1.period=`W1–W3　${shortDate(target.project.startDate)}–${shortDate(addDays(target.project.startDate,20))}`;
    const it=g1.items.find(x=>x.code==='1.7');
    if(it){it.time=`${shortDate(target.project.approvalDate)} ${weekday(target.project.approvalDate)}`;it.title=`${shortDate(target.project.approvalDate)} 核定`;}
  }
  if(g2){
    g2.period=`W4–W12　${shortDate(addDays(target.project.startDate,21))}–${shortDate(addDays(target.project.startDate,83))}`;
    const vitem=g2.items.find(x=>x.code==='2.1');
    if(vitem){
      vitem.desc=`v1 至 v${target.project.versionCount}，每週一`;
      vitem.chips=Array.from({length:Math.min(9,target.project.versionCount)},(_,i)=>`v${i+1} W${i+4}${i+1===target.project.versionCount?' 最終版':''}`);
    }
    g2.items.filter(x=>x.meetingIndex!=null).forEach(x=>{const m=target.meetings[x.meetingIndex];if(m){x.time=`${shortDate(m.date)} ${weekday(m.date)}`;x.title=`${shortDate(m.date)} ${m.title}`;}});
  }
  if(g3){
    g3.period=`W13–W14　${shortDate(target.project.lockDate)}–${shortDate(target.project.endDate)}`;
    const lock=g3.items.find(x=>x.code==='3.1');if(lock){lock.time=shortDate(target.project.lockDate);lock.title=`${shortDate(target.project.lockDate)} 鎖版`;}
    const m4=g3.items.find(x=>x.code==='3.3');if(m4&&target.meetings[3]){m4.time=`${shortDate(target.meetings[3].date)} ${weekday(target.meetings[3].date)}`;m4.title=`${shortDate(target.meetings[3].date)} ${target.meetings[3].title}`;}
    const demo=g3.items.find(x=>x.code==='3.5');if(demo){demo.time=`${shortDate(target.project.demoDate)} ${weekday(target.project.demoDate)}`;demo.title=`${shortDate(target.project.demoDate)} 局內展示`;}
    const close=g3.items.find(x=>x.code==='3.6');if(close){close.time=`${shortDate(target.project.closeDate)} ${weekday(target.project.closeDate)}`;close.title=`${shortDate(target.project.closeDate)} 結案`;close.desc=`報告提交。${shortDate(target.project.bufferStart)} 起為緩衝與核銷`;}
  }
}
