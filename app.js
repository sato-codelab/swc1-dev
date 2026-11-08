/* Diagnosis controller. Future spectator controller owns a separate state/session. */
(function () {
  'use strict';
  const core = AppCore, modelData = AppModels, profiles = AppProfile;
  const store = AppStore.create({core,adapter:AppStore.localStorageAdapter(AppStore.KEYS.diagnosis)});
  const settings = AppStore.createSettings(AppStore.localStorageAdapter(AppStore.KEYS.settings));
  const view = AppView.create(document), scene = AppScene.create(document);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 'start', generation = 0, selectedModelId = null;
  function transition(next) { generation++; scene.reset(); phase = next; }
  function renderQuestion(focus = false) {
    const q = store.question(), placement = store.placement(q.id);
    scene.setTheme(q.sceneTheme); view.renderQuestion(AppPresenter.question(q,store.index,store.total),{focus});
    const left = core.findOption(q,placement.left), right = core.findOption(q,placement.right);
    view.renderChoices({left:AppPresenter.choice(left),right:AppPresenter.choice(right)});
    scene.setTargets({left:left.code,right:right.code});
  }
  function showQuestion() { transition('question'); view.hideResult(); view.hideStart(); renderQuestion(true); }
  function showStart() {
    transition('start'); view.hideResult(); renderQuestion();
    view.showStart(AppPresenter.start({answered:Object.keys(store.answers).length,total:store.total,nextIndex:store.index,completed:store.isComplete(),
      notice:store.restoreNotice || (!store.storageAvailable ? 'このブラウザでは保存できません。再読み込みすると回答が失われます。' : '')}));
  }
  function summaryVM() { return AppPresenter.summary({core,profiles,modelData,answers:store.answers,models:modelData.MOCK_AI_MODELS,selectedModelId}); }
  function showSummary() { transition('summary'); view.hideStart(); view.showResult(summaryVM()); }
  function restart() { store.reset(); selectedModelId = null; showQuestion(); }
  view.setInstructions(core.COMMON_INSTRUCTIONS);
  view.onStart(() => { if (store.isComplete()) showSummary(); else showQuestion(); });
  view.onStartRestart(restart);
  view.onChoose(({optionId,position}) => {
    if (phase !== 'question') return;
    const answer = store.answer(optionId,position); if (!answer) return;
    phase = 'animating'; const token = generation;
    view.lockChoices(optionId);
    scene.playChoice(position,() => {
      if (generation !== token || phase !== 'animating') return;
      phase = 'confirmation';
      view.showResult(AppPresenter.questionResult({core,question:store.question(),answer,isLast:store.isLast(),storageAvailable:store.storageAvailable}));
    },{instant:settings.skipAnimation || reducedMotion.matches});
  });
  view.onSkip(() => { if (phase === 'animating') scene.skip(); });
  view.onNext(() => { if (phase !== 'confirmation') return; if (store.advance()) showQuestion(); else if (store.isComplete()) showSummary(); });
  view.onRestart(restart);
  // Returning home is navigation, not deletion; explicit restart resets the diagnosis.
  view.onHome(showStart);
  view.onModelSelect(id => { if (phase !== 'summary') return; selectedModelId = id; view.updateSummary(summaryVM()); });
  view.bindOptions(() => ({skipAnimation:settings.skipAnimation}),on => settings.set('skipAnimation',on));
  const completed = store.restore(); renderQuestion();
  if (completed) showSummary(); else showStart();
})();
