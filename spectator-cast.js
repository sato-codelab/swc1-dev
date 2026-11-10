/* モデルの乗車、空への移動、記録済み回答の再表示を管理する。 */
(function(root,factory){
  const common=typeof module==='object'&&module.exports;
  const api=factory(common?require('./playback-clock'):root.AppPlaybackClock,common?require('./text-replay'):root.AppTextReplay,root);
  if(common)module.exports=api;else root.AppSpectatorCast=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(clocks,replay,root){
  'use strict';
  const ARRIVAL_MS=560, GAP=8;
  function layout(width,count,page=0){
    width=Math.max(0,width);count=Math.max(0,count);
    const plain=Math.max(1,Math.floor((width+GAP)/(116+GAP)));
    const controls=count>plain?Math.max(84,64+(String(count).length*2+1)*6):0,available=Math.max(0,width-controls);
    const capacity=Math.max(1,Math.min(count||1,Math.floor((available+GAP)/(116+GAP))));
    const pages=Math.max(1,Math.ceil(count/capacity));
    return {capacity,pages,page:Math.max(0,Math.min(page,pages-1)),cardWidth:Math.max(0,Math.min(166,(available-(capacity-1)*GAP)/capacity)),controls};
  }
  function create({doc,onInspect=()=>{},clock=clocks.create(),stream=replay.create()}){
    const $=id=>doc.getElementById(id),gallery=$('modelGallery'),dock=$('modelDock'),rider=$('modelRider'),flight=$('modelFlight'),speech=$('modelSpeech'),body=$('modelSpeechText');
    const cards=new Map(),records=new Map();
    let plan=null,questionId=null,presentation=null,activeId=null,openedId=null,page=0,geometry=null;
    let resultStarted=false,phase='intro',state='idle',fast=false,animation=null,finishFlight=null,movingId=null;
    const reduced=()=>Boolean(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const record=id=>records.get(questionId)?.get(id);
    const node=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text!=null)n.textContent=text;return n;};
    function closeSpeech(focus=false){
      const old=openedId;openedId=null;speech.hidden=true;
      cards.forEach(({button})=>button.setAttribute('aria-expanded','false'));
      if(focus&&old&&cards.get(old)&&!cards.get(old).button.hidden)cards.get(old).button.focus({preventScroll:true});
    }
    function placeSpeech(){
      if(!openedId||speech.hidden)return;
      const card=cards.get(openedId)?.button;if(!card||card.hidden){closeSpeech();return;}
      const g=gallery.getBoundingClientRect(),c=card.getBoundingClientRect(),w=speech.getBoundingClientRect().width;
      const left=Math.max(0,Math.min(c.left-g.left,g.width-w));
      speech.style.left=`${left}px`;
      speech.style.setProperty('--bubble-tail',`${Math.max(18,Math.min(w-18,c.left-g.left+c.width/2-left))}px`);
    }
    function openSpeech(id,reading=false){
      const saved=record(id);if(!saved)return;
      openedId=id;speech.hidden=false;speech.classList.toggle('is-reading',reading);speech.classList.toggle('answer-a',saved.code==='A');speech.classList.toggle('answer-b',saved.code==='B');
      $('modelSpeechTitle').textContent=`${saved.modelName} · ${saved.code}`;
      body.textContent=saved.text;body.scrollTop=0;
      cards.forEach(({button},key)=>button.setAttribute('aria-expanded',String(key===id)));
      placeSpeech();
    }
    function drawCards(){
      cards.forEach(({button,choice,status},id)=>{
        const saved=record(id),riding=id===activeId&&phase!=='result';
        const included=!plan.entries||plan.entries.some(e=>e.questionId===questionId&&e.modelId===id);
        button.disabled=!saved||id===movingId;
        button.classList.toggle('is-active',id===activeId);
        button.classList.toggle('is-riding',riding);
        button.classList.toggle('has-answer',Boolean(saved));
        button.classList.toggle('answer-a',saved?.code==='A');button.classList.toggle('answer-b',saved?.code==='B');
        button.style.visibility=id===movingId?'hidden':'';
        choice.textContent=saved?.code||'';
        status.textContent=riding?'乗車中':saved?'回答を読む':included?'待機中':'対象外';
        button.setAttribute('aria-label',`${button.title}：${riding?'乗車中、':''}${saved?`${saved.code}の回答を開く`:'回答前'}`);
      });
    }
    function arrange(followId=null){
      if(!plan)return;
      geometry=layout(gallery.getBoundingClientRect().width,plan.selection.length,page);
      if(followId){const i=plan.selection.findIndex(m=>m.id===followId);if(i>=0)geometry.page=Math.floor(i/geometry.capacity);}
      page=geometry.page;
      dock.style.gridTemplateColumns=`repeat(${geometry.capacity}, minmax(0, ${geometry.cardWidth}px))`;
      plan.selection.forEach((m,i)=>{cards.get(m.id).button.hidden=Math.floor(i/geometry.capacity)!==page;});
      $('modelPages').hidden=geometry.pages===1;$('modelPages').style.width=`${geometry.controls}px`;
      $('modelPagePosition').textContent=`${page+1}/${geometry.pages}`;
      $('modelPagePrevious').disabled=page===0;$('modelPageNext').disabled=page===geometry.pages-1;
      placeSpeech();
    }
    function cancelMotion(){
      clock.cancel();if(animation)animation.cancel();animation=null;finishFlight=null;movingId=null;flight.hidden=true;
      cards.forEach(({button})=>{button.style.visibility='';});
    }
    function pauseResume(){
      if(state==='paused'){clock.pause();stream.pause();if(animation)animation.pause();}
      else {clock.resume();stream.resume();if(animation&&animation.playState==='paused')animation.play();}
    }
    function reveal(id,instant=false){
      const saved=record(id);if(!saved)return;
      openSpeech(id);
      stream.show(saved.full,text=>{
        saved.text=text;
        if(openedId===id){const bottom=body.scrollHeight-body.clientHeight-body.scrollTop<24;body.textContent=text;if(bottom)body.scrollTop=body.scrollHeight;}
      },{instant:instant||!saved.reason||reduced()});
      pauseResume();
    }
    function arrive(entry){
      const target=cards.get(entry.modelId).button;
      arrange(entry.modelId);
      const from=rider.getBoundingClientRect(),to=target.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
      rider.hidden=true;
      if(reduced()||!flight.animate||!from.width||!to.width){reveal(entry.modelId,true);return;}
      movingId=entry.modelId;drawCards();flight.hidden=false;flight.textContent=entry.modelName;
      flight.style.width=`${to.width}px`;flight.style.height=`${to.height}px`;
      const inset=$('scene').clientLeft||0,sx=from.left-scene.left-inset,sy=from.top-scene.top-inset,ex=to.left-scene.left-inset,ey=to.top-scene.top-inset;
      animation=flight.animate([
        {transform:`translate(${sx}px,${sy}px) scale(${from.width/to.width},${from.height/to.height})`},
        {transform:`translate(${(sx+ex)/2}px,${Math.max(0,ey-8)}px) scale(1)`,offset:.65},
        {transform:`translate(${ex}px,${ey}px) scale(1)`}
      ],{duration:ARRIVAL_MS,easing:'cubic-bezier(.22,.7,.3,1)',fill:'forwards'});
      finishFlight=()=>{cancelMotion();drawCards();reveal(entry.modelId);};
      clock.later(()=>finishFlight?.(),ARRIVAL_MS);pauseResume();
    }
    function build(nextPlan){
      plan=nextPlan;dock.replaceChildren();cards.clear();records.clear();page=0;
      plan.selection.forEach(m=>{
        const button=node('button','model-token'),name=node('span','model-token-name',m.name),choice=node('span','model-token-choice'),status=node('small','model-token-status','待機中');
        button.type='button';button.title=m.name;button.setAttribute('aria-controls','modelSpeech');button.setAttribute('aria-expanded','false');
        button.append(name,choice,status);dock.append(button);cards.set(m.id,{button,choice,status});
        button.addEventListener('click',()=>{if(button.disabled||!record(m.id))return;onInspect();if(openedId===m.id)closeSpeech();else openSpeech(m.id,true);});
      });
    }
    $('modelSpeechClose').addEventListener('click',()=>closeSpeech(true));
    const turn=delta=>{onInspect();if(finishFlight)finishFlight();closeSpeech();page+=delta;arrange();};
    $('modelPagePrevious').addEventListener('click',()=>turn(-1));$('modelPageNext').addEventListener('click',()=>turn(1));
    doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!gallery.hidden&&!speech.hidden&&!$('spectatorMenu').open&&!doc.body.classList.contains('modal-open')){e.preventDefault();closeSpeech(true);}});
    const resize=()=>{if(gallery.hidden)return;if(finishFlight)finishFlight();arrange(openedId||activeId);};
    if(root.ResizeObserver){const observer=new root.ResizeObserver(resize);observer.observe($('scene'));}else root.addEventListener?.('resize',resize);
    return {
      active(on){stream.cancel();cancelMotion();closeSpeech();gallery.hidden=!on;rider.hidden=true;plan=null;presentation=null;questionId=null;cards.clear();records.clear();dock.replaceChildren();},
      update(frame){
        const {entry}=frame,nextPresentation=frame.presentationId??`${frame.index}/${entry.questionId}`;
        const fresh=plan!==frame.plan||presentation!==nextPresentation;
        if(fresh){stream.cancel(true);cancelMotion();closeSpeech();if(plan!==frame.plan)build(frame.plan);presentation=nextPresentation;questionId=entry.questionId;resultStarted=false;}
        phase=frame.phase;state=frame.state;fast=frame.plan.config.mode==='fast';activeId=fast?null:entry.modelId;
        if(!records.has(questionId))records.set(questionId,new Map());
        if(fresh){arrange(activeId);rider.textContent=entry.modelName||'';rider.classList.remove('is-boarding');if(!fast){void rider.offsetWidth;rider.classList.add('is-boarding');}}
        rider.hidden=fast||phase==='result';drawCards();
        if(phase==='result'&&!resultStarted){
          resultStarted=true;
          const entries=fast?entry.entries:[entry];
          entries.forEach(item=>{const reason=typeof item.reason==='string'?item.reason:'',full=reason||'この回答の理由は記録されていません。';records.get(questionId).set(item.modelId,{modelName:item.modelName,code:frame.codeFor(item.optionId),reason,full,text:fast?full:''});});
          drawCards();
          if(fast){arrange(entries[0]?.modelId);if(entries[0])openSpeech(entries[0].modelId);}
          else {rider.hidden=false;arrive(entry);}
        }
        pauseResume();
      }
    };
  }
  return {create,layout,ARRIVAL_MS};
});
