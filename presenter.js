/* Pure view-model builders: domain data -> plain objects (text, numbers). No DOM, no state. */
(function (root) {
  'use strict';

  const SEP = '　・　';
  const optionLabel = (core, question, id) => {
    const o = core.findOption(question, id);
    return o ? o.text : '未回答';
  };

  function question(q, index, total) {
    return {
      progress: `QUESTION ${index + 1} / ${total}`,
      progressLabel: `全${total}問中${index + 1}問目`,
      number: `${q.id}｜倫理的ジレンマ`,
      title: q.title,
      body: q.body,
      note: '正解・不正解はありません。あなた自身ならどちらを選ぶか答えてください。',
    };
  }

  function choice(option) {
    return { optionId: option.id, code: option.code, text: option.text };
  }

  function questionResult({ core, question: q, answer, models, isLast }) {
    return {
      kicker: `QUESTION RESULT · ${q.id}`,
      title: '今回の回答',
      selected: `あなたの回答：${optionLabel(core, q, answer.selected_option_id)}`,
      comparisonTitle: 'AIの回答との比較',
      comparisonNote: 'モックデータ',
      rows: models.map((m) => {
        const id = m.answers[q.id];
        const rate = core.calculateSingleMatch(answer.selected_option_id, id);
        return {
          name: m.name,
          answer: `回答：${optionLabel(core, q, id)}`,
          detail: rate === 100 ? '今回の回答は一致' : '今回の回答は不一致',
          rate,
        };
      }),
      disclaimer: '一致率は今回の問題に対する回答の一致割合です。価値観全般や倫理的な優劣を示すものではありません。AIの回答は動作確認用のモックデータです。',
      primaryLabel: isLast ? '3問の比較結果を見る' : '次の問題へ',
      restartLabel: '診断を最初からやり直す',
      isSummary: false,
    };
  }

  function summary({ core, answers, models }) {
    const ids = core.QUESTIONS.map((q) => q.id);
    const mine = Object.fromEntries(ids.map((id) => [id, answers[id] && answers[id].selected_option_id]));
    return {
      kicker: 'DIAGNOSIS SUMMARY',
      title: '3問の比較結果',
      selected: `${ids.length}問すべてに回答しました。`,
      comparisonTitle: 'AI別の回答一致率',
      comparisonNote: '今回の3問の集計',
      rows: models.map((m) => {
        const s = core.calculateMatchStats(mine, m.answers, ids);
        const r = s.questionResults;
        return {
          name: m.name,
          answer: `一致した問題：${s.matches} / ${s.compared}問`,
          detail: ids.map((id) => `${id}：${r[id] === undefined ? '未比較' : r[id] ? '一致' : '不一致'}`).join(SEP),
          rate: s.rate,
        };
      }),
      disclaimer: 'この一致率は、今回実装した3問の回答パターンの類似度です。価値観全般の一致率や、AI・利用者の倫理的な優劣を示しません。問題セットは心理学的に検証済みの診断尺度ではありません。',
      primaryLabel: null,
      restartLabel: '診断を最初からやり直す',
      isSummary: true,
    };
  }

  root.AppPresenter = { question, choice, questionResult, summary };
})(window);
