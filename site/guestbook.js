(() => {
  const $=id=>document.getElementById(id);
  let next=null,loading=false,replyTo=null;
  function cancelReply(){replyTo=null;$('reply-context').hidden=true;document.querySelector('#message-form button[type="submit"]').textContent='送出留言';}
  const status=text=>{$('message-status').hidden=!text;$('message-status').textContent=text;};
  function entry(message,isReply=false){
    const article=document.createElement('article');article.className='guestbook-entry';
    const header=document.createElement('header'),name=document.createElement('strong'),time=document.createElement('time'),body=document.createElement('p');
    name.textContent=message.nickname;time.dateTime=message.createdAt;
    time.textContent=new Date(message.createdAt).toLocaleString('zh-TW');body.textContent=message.content;
    header.append(name,time);article.append(header,body);
    if(!isReply){
      const actions=document.createElement('div'),reply=document.createElement('button'),toggle=document.createElement('button'),replies=document.createElement('div'),more=document.createElement('button');
      actions.className='entry-actions';replies.className='message-replies';replies.hidden=true;more.hidden=true;
      reply.type=toggle.type=more.type='button';reply.textContent='回覆';toggle.textContent=`查看回覆（${message.replyCount||0}）`;more.textContent='載入更多回覆';
      let cursor=null;
      async function loadReplies(append=false){
        toggle.disabled=more.disabled=true;
        try{
          const query=new URLSearchParams({parent:message.id});if(append&&cursor)query.set('before',cursor);
          const response=await fetch(window.medalsApi('/api/messages')+'?'+query,{signal:AbortSignal.timeout(10000)}),data=await response.json();
          if(!response.ok)throw Error(data.error||'無法讀取回覆，請稍後重試。');
          if(!append)replies.replaceChildren();replies.append(...data.messages.map(m=>entry(m,true)));cursor=data.next;more.hidden=!cursor;replies.hidden=false;
          if(!replies.children.length){const empty=document.createElement('p');empty.textContent='還沒有回覆。';replies.append(empty);}
          toggle.textContent='重新讀取回覆';
        }catch(error){status(error.message);}finally{toggle.disabled=more.disabled=false;}
      }
      reply.addEventListener('click',()=>{
        replyTo={id:message.id,loadReplies};$('reply-target').textContent=`回覆 ${message.nickname}：${message.content.slice(0,60)}${message.content.length>60?'…':''}`;
        $('reply-context').hidden=false;document.querySelector('#message-form button[type="submit"]').textContent='送出回覆';$('message-content').focus();
      });
      toggle.addEventListener('click',()=>loadReplies());more.addEventListener('click',()=>loadReplies(true));
      actions.append(reply,toggle);article.append(actions,replies,more);
    }
    return article;
  }
  async function load(append=false){
    if(loading)return;loading=true;$('refresh-messages').disabled=true;$('more-messages').disabled=true;
    try{
      const response=await fetch(window.medalsApi('/api/messages')+(append&&next?'?before='+encodeURIComponent(next):''),{signal:AbortSignal.timeout(10000)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'暫時無法讀取留言，請稍後重試。');
      if(!append)$('messages').replaceChildren();
      $('messages').append(...data.messages.map(message=>entry(message)));next=data.next;
      if(!$('messages').children.length){const p=document.createElement('p');p.textContent='還沒有留言，來留下第一則冒險紀錄吧！';$('messages').append(p);}
      $('more-messages').hidden=!next;
    }catch(error){status(error.name==='TimeoutError'?'讀取逾時，請稍後重試。':error.message);}
    finally{loading=false;$('refresh-messages').disabled=false;$('more-messages').disabled=false;}
  }
  $('message-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=event.submitter,content=$('message-content').value.trim();
    if(!content){status('請輸入留言內容。');return;}
    button.disabled=true;status('正在送出…');
    try{
      const target=replyTo;
      const response=await fetch(window.medalsApi('/api/messages'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:$('nickname').value.trim(),content,parentId:target?.id||null}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'送出失敗，請稍後重試。');
      $('message-content').value='';cancelReply();status(target?'回覆已送出！':'留言已送出，謝謝你的分享！');
      if(target)await target.loadReplies();else await load();
    }catch(error){status(error.name==='TimeoutError'?'送出逾時，請重新整理確認留言後再試。':error.message);}
    finally{button.disabled=false;}
  });
  $('cancel-reply').addEventListener('click',cancelReply);
  $('refresh-messages').addEventListener('click',()=>{status('');cancelReply();load();});
  $('more-messages').addEventListener('click',()=>load(true));load();
})();
