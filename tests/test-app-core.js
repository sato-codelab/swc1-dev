'use strict';
const assert = require('node:assert/strict');
const core = require('../app-core.js');

test('診断にはQ01〜Q10の10問が定義されている', () => {
  assert.equal(core.QUESTIONS.length, 10);
  assert.deepEqual(core.QUESTIONS.map((q) => q.id), Array.from({ length: 10 }, (_, i) => `Q${String(i + 1).padStart(2, '0')}`));
});

test('各問題に異なる2つの選択肢がある', () => {
  for (const q of core.QUESTIONS) {
    assert.ok(q.title && q.body && q.primaryConflict, `${q.id} の必須データ`);
    assert.equal(q.options.length, 2, `${q.id} の選択肢数`);
    assert.notEqual(q.options[0].id, q.options[1].id, `${q.id} の選択肢ID`);
    assert.equal(q.version, core.QUESTION_VERSION);
  }
});

test('3つのモックAIに10問すべての有効な回答がある', () => {
  assert.equal(core.MOCK_AI_MODELS.length, 3);
  for (const model of core.MOCK_AI_MODELS) {
    assert.equal(Object.keys(model.answers).length, 10, `${model.name} の回答数`);
    for (const q of core.QUESTIONS) {
      assert.ok(core.findOption(q, model.answers[q.id]), `${model.name} / ${q.id} の回答が選択肢に存在する`);
    }
  }
});

test('10問すべて一致なら一致率100%', () => {
  const answers = Object.fromEntries(core.QUESTIONS.map((q) => [q.id, core.MOCK_AI_MODELS[0].answers[q.id]]));
  const stats = core.calculateMatchStats(answers, core.MOCK_AI_MODELS[0].answers);
  assert.deepEqual({ matches: stats.matches, compared: stats.compared, rate: stats.rate }, { matches: 10, compared: 10, rate: 100 });
});

test('10問中5問一致なら一致率50%', () => {
  const modelAnswers = core.MOCK_AI_MODELS[0].answers;
  const userAnswers = {};
  core.QUESTIONS.forEach((q, i) => {
    const selected = modelAnswers[q.id];
    userAnswers[q.id] = i < 5 ? selected : q.options.find((o) => o.id !== selected).id;
  });
  const stats = core.calculateMatchStats(userAnswers, modelAnswers);
  assert.deepEqual({ matches: stats.matches, compared: stats.compared, rate: stats.rate }, { matches: 5, compared: 10, rate: 50 });
});

test('未回答の問題は比較対象から除外する', () => {
  const stats = core.calculateMatchStats({ Q01: 'change_track' }, { Q01: 'change_track', Q02: 'rescue_three' });
  assert.deepEqual({ matches: stats.matches, compared: stats.compared, rate: stats.rate }, { matches: 1, compared: 1, rate: 100 });
});

test('回答がない場合は一致率をnullにする', () => {
  assert.deepEqual(core.calculateMatchStats({}, {}), { matches: 0, compared: 0, rate: null, questionResults: {} });
});

test('結果画面は10問に対応した見出しと集計を表示する', () => {
  global.window = global;
  require('../presenter.js');
  const model = core.MOCK_AI_MODELS[0];
  const answers = Object.fromEntries(core.QUESTIONS.map((q) => [q.id, { selected_option_id: model.answers[q.id] }]));
  const summary = global.AppPresenter.summary({ core, answers, models: core.MOCK_AI_MODELS });
  assert.equal(summary.title, '10問の比較結果');
  assert.equal(summary.comparisonNote, '今回の10問の集計');
  assert.equal(summary.rows[0].rate, 100);
  const lastQuestionResult = global.AppPresenter.questionResult({
    core, question: core.QUESTIONS[9], answer: answers.Q10, models: core.MOCK_AI_MODELS, isLast: true,
  });
  assert.equal(lastQuestionResult.primaryLabel, '10問の比較結果を見る');
});

function test(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (err) { process.stderr.write(`✗ ${name}\n${err.stack}\n`); process.exitCode = 1; }
}
