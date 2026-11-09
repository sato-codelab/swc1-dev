/* 診断と観戦を接続する。モードの入口はスタート画面に集約する。 */
(function () {
  'use strict';
  const core=AppCore,modelData=AppModels,profiles=AppProfile;
  const settings=AppStore.createSettings(AppStore.localStorageAdapter(AppStore.KEYS.settings));
  const store=AppStore.create({core,adapter:AppStore.localStorageAdapter(AppStore.KEYS.diagnosis),randomQuestions:settings.randomQuestions});
  const view=AppView.create(document),scene=AppScene.create(document);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let phase='start',generation=0,selectedModelId=null,configOrigin='start',questionWatch=false;
  const player=AppSpectator.create({core,modelData,models:modelData.MOCK_AI_MODELS,scene,readSnapshot:()=>store.snapshot(),adapter:AppStore.localStorageAdapter(AppStore.KEYS.spectator),emit:event=>{
    if(event.type==='frame')spectatorView.frame(event);
    else if(questionWatch){questionWatch=false;nextQuestion();}
    else {
      phase='spectator-summary';spectatorView.active(false);
      const result=AppSpectator.summary(event.plan,event.seen);
      view.showResult({kicker:'観戦の結果',title:'AIの選択を振り返る',selected:`対象${event.plan.questionIds.length}問のうち、${result.questionCount}問・${result.answerCount}回答を閲覧しました。`,
        rows:result.rows,profile:null,isSummary:true,isSpectator:true,showHome:true,comparisonTitle:'閲覧した回答とあなたとの一致',comparisonNote:'代表回答どうしの比較',
        source:event.plan.selection.some(m=>m.sourceType==='mock')?'AIの回答は架空のサンプルです。実在するAIの測定結果ではありません。':'記録済みのAI回答を表示しています。',
        disclaimer:'閲覧を完了した回答だけを集計しています。一致率は人格全体や倫理的な優劣を示しません。',primaryLabel:null,restartLabel:null});
    }
  }});
  const spectatorView=AppSpectatorView.create({doc:document,view,core,models:modelData.MOCK_AI_MODELS,modelData,preview:value=>player.preview(value)});
  function leaveSpectator(){player.stop();spectatorView.active(false);spectatorView.close();questionWatch=false;}
  function beginSpectator(config,onlyThisQuestion=false){
    if(reducedMotion.matches)config={...config,mode:'fast'};
    if(!player.preview(config,{questionIds:onlyThisQuestion?[store.question().id]:null}).queue.length)return;
    generation++;phase='spectating';questionWatch=onlyThisQuestion;spectatorView.close();view.hideResult();view.hideStart();spectatorView.active(true,{scoped:onlyThisQuestion,number:store.index+1});
    scene.setTargets({left:'A',right:'B'});
    player.start(config,{questionIds:onlyThisQuestion?[store.question().id]:null,persist:!onlyThisQuestion});spectatorView.focus();
  }
  function openSpectator(){
    if(phase!=='start'&&phase!=='spectating')return;
    configOrigin=phase;if(phase==='spectating')player.pause();
    const config=player.config;if(reducedMotion.matches)config.mode='fast';spectatorView.open(config);
  }
  spectatorView.bind({begin:config=>beginSpectator(config),close:()=>{spectatorView.close();if(configOrigin==='spectating')spectatorView.focus();},diagnose:showStart,
    toggle:()=>player.toggle(),previous:()=>player.previous(),next:()=>player.next(),skip:()=>player.skip(),configure:openSpectator,end:()=>player.end()});
  view.onWatch(openSpectator);
  view.onWatchQuestion(()=>{if(phase==='confirmation')beginSpectator({...player.config,modelIds:modelData.MOCK_AI_MODELS.map(m=>m.id),mode:'normal',filter:'all',order:'question',autoplay:true},true);});
  view.onOptionsOpen(()=>{if(phase==='spectating')player.pause();});
  function transition(next){generation++;scene.reset();phase=next;}
  function progress(){view.renderProgress({index:store.index,answered:store.order.map(id=>Boolean(store.answers[id]))});}
  function renderQuestion(focus=false){
    const q=store.question(),placement=store.placement();scene.setTheme(q.sceneTheme);
    view.renderQuestion(AppPresenter.question(q,store.index,store.total),{focus});
    const left=core.findOption(q,placement.left),right=core.findOption(q,placement.right);
    view.renderChoices({left:AppPresenter.choice(left),right:AppPresenter.choice(right)});
    view.markChoice(store.answers[q.id]?.selected_option_id||null);
    scene.setTargets({left:left.code,right:right.code});progress();
  }
  function showQuestion(){leaveSpectator();transition('question');view.hideResult();view.hideStart();renderQuestion(true);}
  function showStart(){
    leaveSpectator();transition('start');view.hideResult();renderQuestion();
    view.showStart(AppPresenter.start({answered:Object.keys(store.answers).length,total:store.total,nextIndex:store.order.findIndex(id=>!store.answers[id]),completed:store.isComplete(),
      notice:store.restoreNotice||(!store.storageAvailable?'このブラウザでは保存できません。再読み込みすると回答が失われます。':'')}));
  }
  function summaryVM(){return AppPresenter.summary({core,profiles,modelData,answers:store.answers,models:modelData.MOCK_AI_MODELS,selectedModelId});}
  function showSummary(){leaveSpectator();transition('summary');view.hideStart();view.showResult(summaryVM());}
  function restart(){store.reset();selectedModelId=null;showQuestion();}
  function nextQuestion(){if(store.advance())showQuestion();else if(store.isComplete())showSummary();}
  view.setInstructions(core.COMMON_INSTRUCTIONS);
  view.onStart(()=>{if(store.isComplete())showSummary();else {store.goTo(store.order.findIndex(id=>!store.answers[id]));showQuestion();}});
  view.onStartRestart(restart);
  view.onProgress(index=>{if(phase==='spectating'){player.jumpToQuestion(index);return;}if(['question','confirmation','animating'].includes(phase)&&store.goTo(index))showQuestion();});
  view.onBrandHome(()=>{leaveSpectator();scene.cancel();window.location.reload();});
  view.onChoose(({optionId,position})=>{
    if(phase!=='question')return;
    const answer=store.answer(optionId,position);if(!answer)return;
    phase='animating';const token=generation;view.lockChoices(optionId);progress();
    scene.playChoice(position,()=>{
      if(generation!==token||phase!=='animating')return;
      phase='confirmation';
      view.showResult(AppPresenter.questionResult({core,modelData,models:modelData.MOCK_AI_MODELS,question:store.question(),number:store.index+1,answer,isLast:store.isLast(),storageAvailable:store.storageAvailable}));
    },{instant:settings.skipAnimation||reducedMotion.matches});
  });
  view.onSkip(()=>{if(phase==='animating')scene.skip();});
  view.onNext(()=>{if(phase==='confirmation')nextQuestion();});
  view.onRestart(showStart);view.onHome(showStart);
  view.onModelSelect(id=>{if(phase==='summary'){selectedModelId=id;view.updateSummary(summaryVM());}});
  view.bindOptions(()=>({skipAnimation:settings.skipAnimation,randomQuestions:settings.randomQuestions}),on=>settings.set('skipAnimation',on),on=>{settings.set('randomQuestions',on);store.setRandomQuestions(on);});
  store.restore();showStart();
})();
