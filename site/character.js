const $ = id => document.getElementById(id);
const catalog = JSON.parse($('catalog').textContent);
let result = null;
let portraitCharacter = null;
function updateCharacterPortrait(name) {
  if (portraitCharacter === name) return;
  portraitCharacter = name;
  const image = $('character-display-image');
  image.onerror = () => {
    image.onerror = null;
    image.src = 'assets/characters/default.gif';
    image.alt = name + ' 的預設人物';
  };
  image.alt = name + ' 的人物';
  image.src = 'assets/characters/' + encodeURIComponent(name) + '/stand1.gif';
}
for (const value of [...new Set(catalog.map(m=>m.category).filter(Boolean))].sort()) $('category').add(new Option(value,value));
function createCategoryChart(character) {
  const categories = new Map(catalog.map(m => [String(m.id), m.category || '未分類']));
  const groups = new Map();
  for (const medal of character.medals) {
    const category = categories.get(String(medal.id)) || '未分類';
    if (!groups.has(category)) groups.set(category, {owned:0, missing:0});
    groups.get(category)[medal.owned ? 'owned' : 'missing']++;
  }
  const chart = document.createElement('section');
  chart.className = 'category-chart';
  chart.setAttribute('aria-label', '各分類勳章統計');
  chart.tabIndex = 0;
  const maximum = Math.max(1,...[...groups.values()].map(g=>g.owned+g.missing));
  for (const [category,group] of [...groups].sort((a,b)=>(b[1].owned+b[1].missing)-(a[1].owned+a[1].missing)||a[0].localeCompare(b[0],'zh-Hant'))) {
    const row = document.createElement('div'); row.className = 'category-chart-row'+(group.missing===0&&group.owned>0?' category-complete':'');
    const label = document.createElement('span'); label.className='category-chart-label';label.textContent=category;
    const track = document.createElement('div'); track.className='category-chart-track';track.setAttribute('role','img');
    track.setAttribute('aria-label',`${category}：已擁有 ${group.owned}，未擁有 ${group.missing}`);
    for (const kind of ['owned','missing']) {
      const segment = document.createElement('span');segment.className='category-chart-segment '+kind;segment.style.width=(group[kind]/maximum*100)+'%';
      segment.title=(kind==='owned'?'已擁有 ':'未擁有 ')+group[kind];track.append(segment);
    }
    const counts = document.createElement('span');counts.className='category-chart-counts';
    for (const kind of ['owned','missing']) {
      if(kind==='missing')counts.append(document.createTextNode(' / '));
      const value=document.createElement('span');value.className=kind;value.textContent=group[kind];counts.append(value);
    }
    row.append(label,track,counts);chart.append(row);
  }
  if (!groups.size) { const empty=document.createElement('p');empty.textContent='尚無分類統計資料';chart.append(empty); }
  return chart;
}
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
  $('character-display-name').textContent=result.character;
  updateCharacterPortrait(result.character);
  $('character-portrait').hidden=false;
  $('character-overview').classList.add('has-character');
  const totalLabel=document.createElement('span'); totalLabel.textContent=`總數 ${total}`; summary.append(totalLabel);
  const bar=document.createElement('div');bar.className='collection-bar';bar.setAttribute('role','img');
  bar.setAttribute('aria-label',`已擁有 ${owned} (${ownedPercent.toFixed(1)}%)，未擁有 ${missing} (${missingPercent.toFixed(1)}%)，總數 ${total}`);
  const legend=document.createElement('div');legend.className='collection-legend';legend.hidden=ownedPercent>=20&&missingPercent>=20;
  for(const [kind,count,percent,label] of [['owned',owned,ownedPercent,'已擁有'],['missing',missing,missingPercent,'未擁有']]){
    const segment=document.createElement('div');segment.className=`collection-segment ${kind}`;segment.style.width=`${percent}%`;
    const text=document.createElement('span');text.textContent=`${label} ${count} (${percent.toFixed(1)}%)`;text.hidden=percent<20;segment.append(text);bar.append(segment);
    const caption=document.createElement('span');caption.className=kind;caption.textContent=text.textContent;legend.append(caption);
  }
  $('stats').tabIndex=0;
  $('stats').setAttribute('aria-label','勳章總計；移入滑鼠或聚焦可查看各分類統計');
  $('stats').replaceChildren(summary,bar,legend,createCategoryChart(result));
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
  result=null; portraitCharacter=null; $('character-portrait').hidden=true; $('character-display-name').textContent=''; $('character-overview').classList.remove('has-character'); $('results').replaceChildren(); $('stats').replaceChildren(); $('count').textContent='';
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

// Ranking links open this page with a character selected for immediate lookup.
const linkedCharacter = new URLSearchParams(location.search).get('name');
if (linkedCharacter && linkedCharacter.trim() && linkedCharacter.trim().length <= 40 && !/[\x00-\x1f]/.test(linkedCharacter)) {
  $('character').value = linkedCharacter.trim();
  $('query').requestSubmit();
}
