const $ = id => document.getElementById(id);
const catalog = JSON.parse($('catalog').textContent);
let result = null;
for (const value of [...new Set(catalog.map(m=>m.category).filter(Boolean))].sort()) $('category').add(new Option(value,value));
function render() {
  if (!result) return;
  const live = new Map(result.medals.map(m=>[m.id,m]));
  const known = new Set(catalog.map(m=>m.id));
  const medals = [...catalog.map(m=>({...m,owned:live.has(m.id)?live.get(m.id).owned:null})),
    ...result.medals.filter(m=>!known.has(m.id)).map(m=>({...m,method:'Excel 尚無此勳章資料',category:'未分類',difficulty:'',stats:''}))];
  const owned = result.medals.filter(m=>m.owned).length;
  const total=result.medals.length, missing=total-owned;
  const ownedPercent=total?owned/total*100:0, missingPercent=total?missing/total*100:0;
  const summary=document.createElement('div'); summary.className='collection-summary';
  const name=document.createElement('span'); name.textContent=result.character;
  const totalLabel=document.createElement('span'); totalLabel.textContent=`總數 ${total}`; summary.append(name,totalLabel);
  const bar=document.createElement('div');bar.className='collection-bar';bar.setAttribute('role','img');
  bar.setAttribute('aria-label',`已擁有 ${owned} (${ownedPercent.toFixed(1)}%)，未擁有 ${missing} (${missingPercent.toFixed(1)}%)，總數 ${total}`);
  const legend=document.createElement('div');legend.className='collection-legend';legend.hidden=ownedPercent>=20&&missingPercent>=20;
  for(const [kind,count,percent,label] of [['owned',owned,ownedPercent,'已擁有'],['missing',missing,missingPercent,'未擁有']]){
    const segment=document.createElement('div');segment.className=`collection-segment ${kind}`;segment.style.width=`${percent}%`;
    const text=document.createElement('span');text.textContent=`${label} ${count} (${percent.toFixed(1)}%)`;text.hidden=percent<20;segment.append(text);bar.append(segment);
    const caption=document.createElement('span');caption.className=kind;caption.textContent=text.textContent;legend.append(caption);
  }
  $('stats').replaceChildren(summary,bar,legend);
  const q = $('search').value.trim().toLowerCase();
  const selected = medals.filter(m=>(!q||`${m.name} ${m.method}`.toLowerCase().includes(q))&&
    (!$('owned').value||String(m.owned)===$('owned').value)&&(!$('category').value||m.category===$('category').value)&&
    (!$('difficulty').value||m.difficulty===$('difficulty').value)&&
    (!$('all-stats').value||m.allStatsBonus===Number($('all-stats').value)));
  const fragment = document.createDocumentFragment();
  for (const m of selected) {
    const tr = document.createElement('tr');
    const picture = document.createElement('td'); picture.className='medal-picture';
    if (known.has(m.id)) {
      const img=document.createElement('img'); img.src=`assets/medals/${m.id}.png`; img.alt=m.name; img.loading='lazy'; picture.append(img);
    } else picture.textContent='—';
    tr.append(picture);
    for (const [index,value] of [m.name,m.owned===null?'官網未提供':m.owned?'已擁有':'未擁有',m.method,m.category,m.difficulty,m.stats].entries()) {
      const td = document.createElement('td');
      if(index===5&&value){
        for(const line of value.split('\n')){
          const item=document.createElement('span'); item.className='stat-line';
          if(/^全能力\+[23]$/.test(line)) item.classList.add('ability-bonus');
          item.textContent=line;td.append(item);
        }
      }else td.textContent=value||'—';
      tr.append(td);
    }
    fragment.append(tr);
  }
  $('results').replaceChildren(fragment);
  $('count').textContent=`符合篩選 ${selected.length} 枚`;
}
for (const id of ['search','owned','category','difficulty','all-stats']) $(id).addEventListener('input',render);
$('query').addEventListener('submit',async event=>{
  event.preventDefault();
  const name=$('character').value.trim();
  if (!name) { $('message').textContent='請輸入角色名稱。'; return; }
  $('submit').disabled=true; $('message').textContent=`正在查詢 ${name}…`;
  result=null; $('results').replaceChildren(); $('stats').replaceChildren(); $('count').textContent='';
  try {
    const response=await fetch(window.medalsApi(`/api/character?name=${encodeURIComponent(name)}`),{signal:AbortSignal.timeout(35000),cache:'no-store'});
    const body=await response.json();
    if(!response.ok) throw new Error(body.error||'查詢失敗，請重試。');
    result=body; render();
    $('message').textContent='';
  } catch(error) {
    const local=location.protocol==='file:'||['127.0.0.1','localhost'].includes(location.hostname);
    $('message').textContent=error.name==='TypeError'?(local?'無法連線至本機查詢服務，請先執行「啟動勳章系統.cmd」。':'暫時無法查詢，請確認網路後重試。'):error.name==='TimeoutError'?'查詢逾時，請稍後重試。':error.message;
  } finally { $('submit').disabled=false; }
});
