(() => {
  const count = document.getElementById('visitor-count');
  if(count){
    const cloud=!!window.MEDALS_API_BASE;
    async function updateCount(){
      let method='POST',visitorId,last=0;
      if(cloud){
        try{visitorId=localStorage.getItem('medals-visitor-id');last=Number(localStorage.getItem('medals-visitor-seen')||0);}catch{}
        if(!/^[a-f0-9]{32}$/.test(visitorId||'')){visitorId=crypto.randomUUID().replaceAll('-','');try{localStorage.setItem('medals-visitor-id',visitorId);}catch{}}
        if(Date.now()-last<86400000)method='GET';
      }
      const options={method,signal:AbortSignal.timeout(8000)};
      if(cloud&&method==='POST'){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify({visitorId});}
      if(!cloud)options.credentials='same-origin';
      const response=await fetch(window.medalsApi('/api/visits'),options);if(!response.ok)throw Error('Unavailable');
      const data=await response.json();if(!Number.isSafeInteger(data.visitors))throw Error('Invalid count');count.textContent=data.visitors.toLocaleString('zh-TW');
      if(cloud&&method==='POST')try{localStorage.setItem('medals-visitor-seen',String(Date.now()));}catch{}
    }
    if(location.protocol==='file:')count.textContent='請透過本機服務查看';
    else updateCount().catch(()=>{count.textContent='暫時無法取得';});
  }
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cursor = document.createElement('img');
  cursor.className='site-cursor'; cursor.alt=''; cursor.setAttribute('aria-hidden','true');
  cursor.src='assets/UI/Basic.png'; cursor.hidden=true; document.body.append(cursor);
  const basic=new Image(),reactor=new Image(); basic.src='assets/UI/Basic.png'; reactor.src='assets/UI/Reactor.gif';
  let ready=false;
  Promise.all([basic.decode(),reactor.decode()]).then(()=>{ready=true;document.documentElement.classList.add('custom-cursor-enabled')}).catch(()=>cursor.remove());
  function update(event){
    if (!ready || event.pointerType==='touch') return;
    const control=event.target.closest('a[href],button,select,summary,label[for],input[type="submit"],input[type="button"],[role="button"]');
    const active=control&&!control.matches(':disabled,[aria-disabled="true"]');
    const src=active?'assets/UI/Reactor.gif':'assets/UI/Basic.png';
    if (cursor.getAttribute('src')!==src) cursor.src=src;
    cursor.style.transform=`translate3d(${event.clientX-2}px,${event.clientY-2}px,0)`;cursor.hidden=false;
  }
  document.addEventListener('pointermove',update,{passive:true});
  document.addEventListener('pointerover',update,{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{cursor.hidden=true});
  window.addEventListener('blur',()=>{cursor.hidden=true});
})();
