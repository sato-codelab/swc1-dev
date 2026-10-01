const QUESTION = {
  id: 1,
  question:
    'あなたは走行中のトロッコに乗っています。左へ進めば線路が途切れます。右へ進めば、1人がいる線路に入ります。あなたなら、どちらへトロッコを傾けますか？',
  leftOption: '左へ傾ける',
  rightOption: '右へ傾ける',
  theme: '自己関与と他者への影響',
};

const MOCK_AI_ANSWERS = [
  { modelId: 'mock-a', modelName: '生成AI A', answer: 'left' },
  { modelId: 'mock-b', modelName: '生成AI B', answer: 'right' },
  { modelId: 'mock-c', modelName: '生成AI C', answer: 'left' },
];

const state = {
  answered: false,
  selected: null,
  isAnimating: false,
};

const trolleyStage = document.getElementById('trolleyStage');
const impactEffect = document.getElementById('impactEffect');
const sceneStatus = document.getElementById('sceneStatus');
const choices = [...document.querySelectorAll('.choice')];
const sparkLeft = document.getElementById('sparkLeft');
const sparkRight = document.getElementById('sparkRight');
const resultOverlay = document.getElementById('resultOverlay');
const resultSelected = document.getElementById('resultSelected');
const comparisonList = document.getElementById('comparisonList');
const restartButton = document.getElementById('restartButton');

function calculateMatchRate(userAnswer, aiAnswer) {
  if (userAnswer == null || aiAnswer == null) return null;
  return userAnswer === aiAnswer ? 100 : 0;
}

function labelFor(answer) {
  return answer === 'left' ? QUESTION.leftOption : QUESTION.rightOption;
}

function createSparkles(target, direction) {
  target.innerHTML = '';
  for (let i = 0; i < 4; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    if (direction === 'right') {
      spark.style.transform = 'scaleX(-1)';
    }
    target.appendChild(spark);
  }
}

function resetScene() {
  state.answered = false;
  state.selected = null;
  state.isAnimating = false;

  choices.forEach((button) => {
    button.disabled = false;
    button.classList.remove('is-selected');
    button.setAttribute('aria-pressed', 'false');
  });

  trolleyStage.classList.remove('tilt-left', 'tilt-right', 'drive-left', 'drive-right');
  sparkLeft.classList.remove('animate-sparks');
  sparkRight.classList.remove('animate-sparks');
  impactEffect.classList.remove('active');
  sceneStatus.textContent = '左右どちらかを選択してください';
  sceneStatus.style.opacity = '1';

  resultOverlay.classList.remove('is-visible');
  resultOverlay.setAttribute('aria-hidden', 'true');
}

function buildResult() {
  resultSelected.textContent = `あなたの回答：${labelFor(state.selected)}`;
  comparisonList.innerHTML = '';

  MOCK_AI_ANSWERS.forEach((ai) => {
    const row = document.createElement('div');
    row.className = 'comparison-row';

    const meta = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'ai-name';
    name.textContent = ai.modelName;

    const answer = document.createElement('div');
    answer.className = 'ai-answer';
    answer.textContent = `回答：${labelFor(ai.answer)}`;

    meta.append(name, answer);

    const match = document.createElement('div');
    match.className = 'ai-match';
    match.textContent = `${calculateMatchRate(state.selected, ai.answer)}%`;
    match.setAttribute('aria-label', `${ai.modelName}との回答一致率 ${match.textContent}`);

    row.append(meta, match);
    comparisonList.appendChild(row);
  });
}

function showResult() {
  buildResult();
  resultOverlay.classList.add('is-visible');
  resultOverlay.setAttribute('aria-hidden', 'false');
  restartButton.focus();
}

function runChoiceAnimation(choice) {
  if (state.isAnimating || state.answered) return;

  state.isAnimating = true;
  state.selected = choice;
  state.answered = true;

  choices.forEach((button) => {
    button.disabled = true;
    button.classList.toggle('is-selected', button.dataset.choice === choice);
    button.setAttribute('aria-pressed', button.dataset.choice === choice ? 'true' : 'false');
  });

  sceneStatus.textContent = `${labelFor(choice)} を選択しました`;

  trolleyStage.classList.remove('tilt-left', 'tilt-right', 'drive-left', 'drive-right');
  impactEffect.classList.remove('active');
  sparkLeft.classList.remove('animate-sparks');
  sparkRight.classList.remove('animate-sparks');

  void trolleyStage.offsetWidth;

  trolleyStage.classList.add(choice === 'left' ? 'tilt-left' : 'tilt-right');
  (choice === 'left' ? sparkLeft : sparkRight).classList.add('animate-sparks');

  window.setTimeout(() => {
    trolleyStage.classList.remove('tilt-left', 'tilt-right');
    trolleyStage.classList.add(choice === 'left' ? 'drive-left' : 'drive-right');
    sceneStatus.textContent = `${labelFor(choice)} の方向へ進んでいます`;
  }, 720);

  window.setTimeout(() => {
    impactEffect.classList.remove('active');
    void impactEffect.offsetWidth;
    impactEffect.classList.add('active');
    sceneStatus.textContent = 'ダメージエフェクト';
  }, 1420);

  window.setTimeout(() => {
    trolleyStage.classList.remove('drive-left', 'drive-right');
    sceneStatus.textContent = '中央の線路へ戻りました';
  }, 2030);

  window.setTimeout(() => {
    sceneStatus.style.opacity = '0';
  }, 2260);

  window.setTimeout(() => {
    showResult();
    state.isAnimating = false;
  }, 2420);
}

choices.forEach((button) => {
  button.addEventListener('click', () => runChoiceAnimation(button.dataset.choice));
});

restartButton.addEventListener('click', resetScene);

createSparkles(sparkLeft, 'left');
createSparkles(sparkRight, 'right');
resetScene();

// 第1週のMVPではサーバー保存を行わない。
// 将来の週でこの部分をPOST /answers などのAPI呼び出しへ置き換える。
