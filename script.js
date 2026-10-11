'use strict';

const { QUESTIONS, QUESTION_VERSION, MOCK_AI_MODELS, findOption, calculateMatchStats, calculateSingleMatch } = window.AppCore;
const STORAGE_KEY = 'value-judgment-ai-matching-week2-v1';

const state = {
  currentIndex: 0,
  answers: {},
  answered: false,
  selectedOptionId: null,
  selectedDisplayPosition: null,
  displayedOptions: { left: null, right: null },
  animationTimers: [],
  resultMode: 'question',
};

const scene = document.getElementById('scene');
const trolleyStage = document.getElementById('trolleyStage');
const impactEffect = document.getElementById('impactEffect');
const sceneStatus = document.getElementById('sceneStatus');
const choices = [...document.querySelectorAll('.choice')];
const sparkLeft = document.getElementById('sparkLeft');
const sparkRight = document.getElementById('sparkRight');
const resultOverlay = document.getElementById('resultOverlay');
const resultKicker = document.getElementById('resultKicker');
const resultTitle = document.getElementById('resultTitle');
const resultSelected = document.getElementById('resultSelected');
const comparisonTitle = document.getElementById('comparisonTitle');
const comparisonNote = document.getElementById('comparisonNote');
const comparisonList = document.getElementById('comparisonList');
const resultDisclaimer = document.getElementById('resultDisclaimer');
const nextButton = document.getElementById('nextButton');
const restartButton = document.getElementById('restartButton');
const progressPill = document.getElementById('progressPill');
const questionNumber = document.getElementById('questionNumber');
const questionTitle = document.getElementById('questionTitle');
const questionBody = document.getElementById('questionBody');
const questionNote = document.getElementById('questionNote');

function currentQuestion() {
  return QUESTIONS[state.currentIndex];
}

function currentOption(optionId) {
  return findOption(currentQuestion(), optionId);
}

function labelFor(question, optionId) {
  const option = findOption(question, optionId);
  return option ? `${option.text}` : '未回答';
}

function saveSession() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      questionVersion: QUESTION_VERSION,
      answers: state.answers,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    // Private browsing/storage-disabled contexts can still use the full diagnosis in memory.
    console.warn('回答のローカル保存を利用できません。現在のタブ内では続行できます。', error);
  }
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || saved.questionVersion !== QUESTION_VERSION || !saved.answers || typeof saved.answers !== 'object') {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    QUESTIONS.forEach((question) => {
      const savedAnswer = saved.answers[question.id];
      if (!savedAnswer) return;
      const validOption = findOption(question, savedAnswer.selected_option_id);
      const validPosition = savedAnswer.display_position === 'left' || savedAnswer.display_position === 'right';
      if (validOption && validPosition) state.answers[question.id] = savedAnswer;
    });
    const firstUnanswered = QUESTIONS.findIndex((question) => !state.answers[question.id]);
    if (firstUnanswered === -1) {
      state.currentIndex = QUESTIONS.length - 1;
      return true;
    }
    state.currentIndex = firstUnanswered;
    return false;
  } catch (error) {
    console.warn('保存済みの回答を読み込めませんでした。新しい診断を開始します。', error);
    return false;
  }
}

function shuffleOptions(options) {
  // Fisher–Yates shuffle means the screen side is randomized independently of semantic IDs.
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderChoiceButton(button, option, position) {
  button.dataset.optionId = option.id;
  button.dataset.position = position;
  button.classList.remove('is-selected');
  button.disabled = false;
  button.setAttribute('aria-pressed', 'false');
  button.querySelector('.choice-arrow').textContent = position === 'left' ? '←' : '→';
  button.querySelector('.choice-copy strong').textContent = option.text;
  button.querySelector('.choice-copy small').textContent = `選択肢 ${option.code}`;
  button.setAttribute('aria-label', `画面${position === 'left' ? '左' : '右'}側、選択肢${option.code}：${option.text}`);
}

function renderQuestion() {
  const question = currentQuestion();
  const questionIndex = state.currentIndex + 1;
  progressPill.textContent = `QUESTION ${questionIndex} / ${QUESTIONS.length}`;
  progressPill.setAttribute('aria-label', `全${QUESTIONS.length}問中${questionIndex}問目`);
  questionNumber.textContent = `${question.id}｜倫理的ジレンマ`;
  questionTitle.textContent = question.title;
  questionBody.textContent = question.body;
  questionNote.textContent = '正解・不正解はありません。あなた自身ならどちらを選ぶか答えてください。';

  const shuffled = shuffleOptions(question.options);
  state.displayedOptions = { left: shuffled[0], right: shuffled[1] };
  renderChoiceButton(choices.find((button) => button.dataset.position === 'left') || choices[0], state.displayedOptions.left, 'left');
  renderChoiceButton(choices.find((button) => button.dataset.position === 'right') || choices[1], state.displayedOptions.right, 'right');

  // Only Q01 has trolley-specific people in the horizon. Q02 and Q03 keep the meadow ride as a neutral visual theme.
  scene.classList.toggle('question-type-trolley', question.id === 'Q01');
  scene.classList.toggle('question-type-social', question.id !== 'Q01');
}

function createSparkles(target, direction) {
  target.replaceChildren();
  for (let i = 0; i < 4; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    if (direction === 'right') spark.style.transform = 'scaleX(-1)';
    target.appendChild(spark);
  }
}

function schedule(callback, delay) {
  const timer = window.setTimeout(callback, delay);
  state.animationTimers.push(timer);
  return timer;
}

function clearAnimationTimers() {
  state.animationTimers.forEach((timer) => window.clearTimeout(timer));
  state.animationTimers = [];
}

function resetSceneState() {
  clearAnimationTimers();
  state.answered = false;
  state.selectedOptionId = null;
  state.selectedDisplayPosition = null;

  scene.classList.remove('is-choice-left', 'is-choice-right', 'is-sprinting', 'is-impact');
  scene.classList.add('is-running');
  trolleyStage.classList.remove('tilt-left', 'tilt-right');
  sparkLeft.classList.remove('animate-sparks');
  sparkRight.classList.remove('animate-sparks');
  impactEffect.classList.remove('active');

  choices.forEach((button) => {
    button.disabled = false;
    button.classList.remove('is-selected');
    button.setAttribute('aria-pressed', 'false');
  });
  sceneStatus.textContent = 'ガタン、ゴトン……トロッコは原っぱを進んでいます';
}

function appendComparisonRow(model, answerText, matchText, detailText, isSummary = false) {
  const row = document.createElement('div');
  row.className = `comparison-row${isSummary ? ' comparison-row-summary' : ''}`;

  const meta = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'ai-name';
  name.textContent = model.name;
  const answer = document.createElement('div');
  answer.className = 'ai-answer';
  answer.textContent = answerText;
  meta.append(name, answer);
  if (detailText) {
    const detail = document.createElement('div');
    detail.className = 'ai-detail';
    detail.textContent = detailText;
    meta.append(detail);
  }

  const match = document.createElement('div');
  match.className = 'ai-match';
  match.textContent = matchText;
  row.append(meta, match);
  comparisonList.append(row);
}

function showQuestionResult() {
  const question = currentQuestion();
  const answer = state.answers[question.id];
  resultKicker.textContent = `QUESTION RESULT · ${question.id}`;
  resultTitle.textContent = '今回の回答';
  resultSelected.textContent = `あなたの回答：${labelFor(question, answer.selected_option_id)}`;
  comparisonTitle.textContent = 'AIの回答との比較';
  comparisonNote.textContent = 'モックデータ';
  comparisonList.replaceChildren();

  MOCK_AI_MODELS.forEach((model) => {
    const aiOptionId = model.answers[question.id];
    const aiText = labelFor(question, aiOptionId);
    const rate = calculateSingleMatch(answer.selected_option_id, aiOptionId);
    appendComparisonRow(
      model,
      `回答：${aiText}`,
      `${rate}%`,
      rate === 100 ? '今回の回答は一致' : '今回の回答は不一致',
    );
  });

  resultDisclaimer.textContent = '一致率は今回の問題に対する回答の一致割合です。価値観全般や倫理的な優劣を示すものではありません。AIの回答は動作確認用のモックデータです。';
  nextButton.hidden = false;
  nextButton.disabled = false;
  nextButton.textContent = state.currentIndex < QUESTIONS.length - 1 ? '次の問題へ' : '3問の比較結果を見る';
  restartButton.textContent = '診断を最初からやり直す';
  state.resultMode = 'question';
  resultOverlay.classList.add('is-visible');
  resultOverlay.setAttribute('aria-hidden', 'false');
  nextButton.focus({ preventScroll: true });
}

function showSummary() {
  resultKicker.textContent = 'DIAGNOSIS SUMMARY';
  resultTitle.textContent = '3問の比較結果';
  resultSelected.textContent = `${QUESTIONS.length}問すべてに回答しました。`;
  comparisonTitle.textContent = 'AI別の回答一致率';
  comparisonNote.textContent = '今回の3問の集計';
  comparisonList.replaceChildren();

  MOCK_AI_MODELS.forEach((model) => {
    const modelAnswers = model.answers;
    const stats = calculateMatchStats(
      Object.fromEntries(QUESTIONS.map((question) => [question.id, state.answers[question.id]?.selected_option_id])),
      modelAnswers,
      QUESTIONS.map((question) => question.id),
    );
    const detail = QUESTIONS.map((question) => {
      const userAnswer = state.answers[question.id]?.selected_option_id;
      const modelAnswer = model.answers[question.id];
      const matches = userAnswer && modelAnswer && userAnswer === modelAnswer;
      return `${question.id}：${matches ? '一致' : '不一致'}`;
    }).join('　・　');
    appendComparisonRow(model, `一致した問題：${stats.matches} / ${stats.compared}問`, `${stats.rate}%`, detail, true);
  });

  resultDisclaimer.textContent = 'この一致率は、今回実装した3問の回答パターンの類似度です。価値観全般の一致率や、AI・利用者の倫理的な優劣を示しません。問題セットは心理学的に検証済みの診断尺度ではありません。';
  nextButton.hidden = true;
  restartButton.textContent = '診断を最初からやり直す';
  state.resultMode = 'summary';
  resultOverlay.classList.add('is-visible');
  resultOverlay.setAttribute('aria-hidden', 'false');
  restartButton.focus({ preventScroll: true });
}

function advanceFromResult() {
  if (state.resultMode === 'summary') return;
  if (state.currentIndex < QUESTIONS.length - 1) {
    state.currentIndex += 1;
    resultOverlay.classList.remove('is-visible');
    resultOverlay.setAttribute('aria-hidden', 'true');
    resetSceneState();
    renderQuestion();
    return;
  }
  showSummary();
}

function restartDiagnosis() {
  clearAnimationTimers();
  try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn('保存済みデータを削除できませんでした。', error); }
  state.currentIndex = 0;
  state.answers = {};
  state.resultMode = 'question';
  resultOverlay.classList.remove('is-visible');
  resultOverlay.setAttribute('aria-hidden', 'true');
  resetSceneState();
  renderQuestion();
}

function runChoiceAnimation(displayPosition, optionId) {
  if (state.answered) return;
  const question = currentQuestion();
  if (!findOption(question, optionId)) return;

  state.answered = true;
  state.selectedOptionId = optionId;
  state.selectedDisplayPosition = displayPosition;
  const answerRecord = {
    question_id: question.id,
    question_version: question.version,
    selected_option_id: optionId,
    display_position: displayPosition,
    response_timestamp: new Date().toISOString(),
  };
  state.answers[question.id] = answerRecord;
  saveSession();

  choices.forEach((button) => {
    button.disabled = true;
    const selected = button.dataset.optionId === optionId;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });

  // Keep the trolley in the viewport. The visible side is animation metadata only;
  // the saved answer remains the semantic option ID.
  const positionClass = displayPosition === 'left' ? 'is-choice-left' : 'is-choice-right';
  scene.classList.add(positionClass, 'is-sprinting');
  trolleyStage.classList.add(displayPosition === 'left' ? 'tilt-left' : 'tilt-right');
  const sparks = displayPosition === 'left' ? sparkLeft : sparkRight;
  sparks.classList.remove('animate-sparks');
  void sparks.offsetWidth;
  sparks.classList.add('animate-sparks');
  sceneStatus.textContent = '選択を受けて、草原と線路が揺れています';

  schedule(() => {
    scene.classList.add('is-impact');
    impactEffect.classList.remove('active');
    void impactEffect.offsetWidth;
    impactEffect.classList.add('active');
    sceneStatus.textContent = 'ガタンッ！ 大きな揺れを越えました';
  }, 760);

  schedule(() => {
    scene.classList.remove('is-choice-left', 'is-choice-right', 'is-sprinting', 'is-impact');
    trolleyStage.classList.remove('tilt-left', 'tilt-right');
    impactEffect.classList.remove('active');
    sparkLeft.classList.remove('animate-sparks');
    sparkRight.classList.remove('animate-sparks');
    sceneStatus.textContent = '揺れが収まりました';
  }, 1580);

  schedule(showQuestionResult, 2080);
}

choices.forEach((button) => {
  button.addEventListener('click', () => runChoiceAnimation(button.dataset.position, button.dataset.optionId));
});
nextButton.addEventListener('click', advanceFromResult);
restartButton.addEventListener('click', restartDiagnosis);

createSparkles(sparkLeft, 'left');
createSparkles(sparkRight, 'right');
const completedOnLoad = restoreSession();
renderQuestion();
resetSceneState();
if (completedOnLoad) showSummary();
