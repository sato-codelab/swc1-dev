/* 記録済みの代表回答を閲覧する。診断ストアの更新機能は受け取らない。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./playback-clock'):root.AppPlaybackClock);if(typeof module==='object'&&module.exports)module.exports=api;else root.AppSpectator=api;})(typeof globalThis!=='undefined'?globalThis:this,function(clocks){
  'use strict';
  const FILTERS={all:'すべて',match:'自分と一致',different:'自分と不一致',split:'AI間で判断が分かれた問題',unanimous:'選択したAI全員が一致した問題'};
  const TIMINGS={intro:700,result:1800,fast:3500};
  function settings(input,models){const s=input||{};return {modelIds:Array.isArray(s.modelIds)?models.filter(m=>s.modelIds.includes(m.id)).map(m=>m.id):models.map(m=>m.id),mode:s.mode==='fast'?'fast':'normal',order:s.order==='model'?'model':'question',filter:Object.hasOwn(FILTERS,s.filter)?s.filter:'all',autoplay:s.autoplay!==false};}
  function buildPlan({core,modelData,models,snapshot,config,scopeIds=null}) {
    const selection=models.filter(m=>config.modelIds.includes(m.id));
    const mine={};
    if(snapshot&&snapshot.questionVersion===core.QUESTION_VERSION)core.QUESTIONS.forEach(q=>{const a=snapshot.answers&&snapshot.answers[q.id];if(a&&a.question_version===q.version&&core.findOption(q,a.selected_option_id))mine[q.id]=a.selected_option_id;});
    const answered=Object.keys(mine).length;
    let reason=selection.length?'':'AIを1つ以上選んでください。';
    if(['match','different'].includes(config.filter)&&!answered)reason='自分との比較には、先に診断で回答してください。';
    if(['split','unanimous'].includes(config.filter)&&selection.length<2)reason='AI同士の比較には、2つ以上選んでください。';
    let entries=[];const questionRows={};
    core.QUESTIONS.filter(q=>!scopeIds||scopeIds.includes(q.id)).forEach(q=>{
      const rows=selection.map(m=>{const data=modelData.getAnswer(m,q),id=data.representativeOptionId;return {questionId:q.id,modelId:m.id,modelName:m.name,optionId:id,match:id&&mine[q.id]?id===mine[q.id]:null,status:data.status,counts:data.counts,reason:m.answerMetadata?.[q.id]?.reasonSummary||null};});
      questionRows[q.id]=rows;
      const valid=rows.filter(r=>core.findOption(q,r.optionId)),distinct=new Set(valid.map(r=>r.optionId));
      let accepted=valid;
      if(config.filter==='match')accepted=valid.filter(r=>r.match===true);
      if(config.filter==='different')accepted=valid.filter(r=>r.match===false);
      if(config.filter==='split'&&distinct.size<2)accepted=[];
      if(config.filter==='unanimous'&&(valid.length!==selection.length||distinct.size!==1))accepted=[];
      entries.push(...accepted);
    });
    if(reason)entries=[];
    if(config.order==='model'&&config.mode!=='fast')entries.sort((a,b)=>config.modelIds.indexOf(a.modelId)-config.modelIds.indexOf(b.modelId));
    const questionIds=core.QUESTIONS.filter(q=>entries.some(e=>e.questionId===q.id)).map(q=>q.id);
    const queue=config.mode==='fast'?questionIds.map(id=>({questionId:id,entries:entries.filter(e=>e.questionId===id)})):entries.map(e=>({...e,entries:[e]}));
    if(!queue.length&&!reason)reason=config.filter==='all'?'再生できる代表回答がありません。':'この条件に当てはまる回答がありません。';
    return {selection,mine,answered,entries,queue,questionIds,questionRows,reason,config};
  }
  function create({core,modelData,models,scene,readSnapshot,adapter,emit,clock=clocks.create()}) {
    let config=settings(adapter.load(),models),plan=null,index=0,state='idle',phase='intro',generation=0;
    const seen=new Map();
    const frame=()=>emit({type:'frame',plan,index,state,phase,entry:plan.queue[index],seenQuestionIds:[...new Set([...seen.values()].map(e=>e.questionId))]});
    function clear(){generation++;clock.cancel();scene.reset();}
    function complete(){clear();state='completed';emit({type:'complete',plan,seen:[...seen.values()]});}
    function result(){phase='result';plan.queue[index].entries.forEach(e=>seen.set(`${e.questionId}/${e.modelId}`,e));state=config.autoplay?'playing':'ready';frame();if(config.autoplay)clock.later(next,config.mode==='fast'?TIMINGS.fast:Math.max(TIMINGS.result, Array.from(plan.queue[index].reason||'').length*35+1500));}
    function animate(){phase='animation';frame();const token=generation;const item=plan.queue[index];scene.playChoice(core.positionFor(core.createPlacement(core.QUESTIONS.find(q=>q.id===item.questionId)),item.optionId),()=>{if(token===generation&&state==='playing')result();});}
    function display(run){clear();scene.setTheme(core.QUESTIONS.find(q=>q.id===plan.queue[index].questionId).sceneTheme);phase='intro';state=run?'playing':'ready';frame();if(config.mode==='fast'){result();return;}if(run)clock.later(animate,TIMINGS.intro);}
    function next(){if(!plan||state==='completed'||state==='idle')return;if(index+1>=plan.queue.length){complete();return;}index++;display(true);}
    return {
      get config(){return {...config,modelIds:[...config.modelIds]};},
      preview(value,{questionIds=null}={}){return buildPlan({core,modelData,models,snapshot:readSnapshot(),config:settings(value,models),scopeIds:questionIds});},
      start(value,{questionIds=null,persist=true}={}){const nextConfig=settings(value,models),candidate=buildPlan({core,modelData,models,snapshot:readSnapshot(),config:nextConfig,scopeIds:questionIds});if(!candidate.queue.length)return candidate;clear();config=nextConfig;plan=candidate;index=0;seen.clear();if(persist)adapter.save(config);display(config.autoplay);return plan;},
      pause(){if(state!=='playing')return;clock.pause();scene.pause();state='paused';frame();},
      play(){if(!plan||state==='completed')return;if(state==='paused'){state='playing';scene.resume();clock.resume();frame();}else if(state==='ready'){if(phase==='result')next();else{state='playing';frame();clock.later(animate,TIMINGS.intro);}}},
      toggle(){if(state==='playing')this.pause();else this.play();},
      next,
      jumpToQuestion(ordinal){if(!plan||!Number.isInteger(ordinal)||!plan.questionIds[ordinal])return;index=plan.queue.findIndex(e=>e.questionId===plan.questionIds[ordinal]);display(true);},
      previous(){if(!plan||!index||state==='completed')return;index--;display(true);},
      skip(){if(!plan||config.mode==='fast'||phase==='result'||state==='completed')return;clock.cancel();scene.reset();state='playing';result();},
      end(){if(plan&&state!=='completed')complete();},
      stop(){clear();state='idle';plan=null;seen.clear();},
    };
  }
  function summary(plan,seen){return {questionCount:new Set(seen.map(e=>e.questionId)).size,answerCount:seen.length,rows:plan.selection.map(m=>{
    const entries=seen.filter(e=>e.modelId===m.id),compared=entries.filter(e=>e.match!==null),matches=compared.filter(e=>e.match).length;
    return {id:m.id,name:m.name,answer:`閲覧した回答：${entries.length}問`,detail:compared.length?`あなたと一致：${matches} / ${compared.length}問`:'あなたとの比較：未比較',rate:compared.length?Math.round(100*matches/compared.length):null};
  })};}
  return {FILTERS,TIMINGS,settings,buildPlan,create,summary};
});
