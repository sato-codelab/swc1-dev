/* Controller: wires store (state) -> presenter (view-models) -> view/scene (DOM). */
(function () {
  'use strict';

  const core = window.AppCore;
  const models = core.MOCK_AI_MODELS;
  const store = AppStore.create({ core, adapter: AppStore.localStorageAdapter('value-judgment-ai-matching-week2-v1') });
  const view = AppView.create(document);
  const scene = AppScene.create(document);
  let locked = false;

  function shuffle(list, rng = Math.random) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showQuestion() {
    locked = false;
    const q = store.question();
    scene.reset();
    scene.setTheme(q.sceneTheme);
    view.hideResult();
    view.renderQuestion(AppPresenter.question(q, store.index, store.total));
    const [left, right] = shuffle(q.options);
    view.renderChoices({ left: AppPresenter.choice(left), right: AppPresenter.choice(right) });
    scene.setTargets({ left: left.code, right: right.code });
  }

  function showQuestionResult() {
    const q = store.question();
    view.showResult(AppPresenter.questionResult({ core, question: q, answer: store.answers[q.id], models, isLast: store.isLast() }));
  }

  function showSummary() {
    view.showResult(AppPresenter.summary({ core, answers: store.answers, models }));
  }

  view.onChoose(({ optionId, position }) => {
    if (locked || !store.answer(optionId, position)) return;
    locked = true;
    view.lockChoices(optionId);
    scene.playChoice(position, showQuestionResult);
  });
  view.onNext(() => { if (store.advance()) showQuestion(); else showSummary(); });
  view.onRestart(() => { store.reset(); showQuestion(); });

  const completed = store.restore();
  showQuestion();
  if (completed) showSummary();
})();
