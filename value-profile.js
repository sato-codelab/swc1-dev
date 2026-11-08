/* 10問の回答を6つの観点で記述する。総合点や人格の判定は行わない。 */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./app-core.js') : root.AppCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  const OUTCOME_IDS = ['Q01','Q02','Q03','Q04','Q05','Q06','Q08','Q09','Q10'];
  const AXES = [
    { id: 'outcome', name: '結果重視', ids: OUTCOME_IDS, note: '期待される救助人数が多い側を選んだ割合。Q07は含みません。', formula: '100 × (a1+a2+a3+a4+a5+a6+a8+(1−a9)+(1−a10)) ÷ 9', calc: a => 100 * (a.Q01+a.Q02+a.Q03+a.Q04+a.Q05+a.Q06+a.Q08+1-a.Q09+1-a.Q10) / 9 },
    { id: 'caution', name: '加害への慎重さ', ids: ['Q01','Q02','Q03'], note: '他者を犠牲にする介入を控えた割合。', formula: '100 × ((1−a1)+(1−a2)+(1−a3)) ÷ 3', calc: a => 100 * (3-a.Q01-a.Q02-a.Q03) / 3 },
    { id: 'consent', name: '本人の意思への反応', ids: ['Q03','Q04'], note: '50＝判断の変化なし。同意・依頼が加わった2場面の差。', formula: '50 + 50 × (a4−a3)', calc: a => 50 + 50 * (a.Q04-a.Q03) },
    { id: 'relationship', name: '関係性への反応', ids: ['Q01','Q05'], note: '50＝判断の変化なし。犠牲になる1人が友人になる前後の差。', formula: '50 + 50 × (a1−a5)', calc: a => 50 + 50 * (a.Q01-a.Q05) },
    { id: 'certainty', name: '確実性重視', ids: ['Q07'], note: '確実な3人の救助を選ぶか。救助人数の期待値は両方3人です。', formula: '100 × a7', calc: a => 100 * a.Q07 },
    { id: 'procedure', name: '手続き重視', ids: ['Q08','Q09'], note: '抽選の採用と、合意した抽選結果を優先した度合い。', formula: '50 × ((1−a8)+a9)', calc: a => 50 * (1-a.Q08+a.Q09) },
  ];
  const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
  function fromAnswers(answers = {}) {
    return Object.fromEntries(core.QUESTIONS.map(q => {
      const code = core.optionCode(q, answers[q.id]);
      return [q.id, code === 'A' ? 1 : code === 'B' ? 0 : null];
    }));
  }
  function calculate(probabilities) {
    return AXES.map(axis => {
      const raw = axis.ids.every(id => valid(probabilities[id])) ? axis.calc(probabilities) : null;
      return { id: axis.id, name: axis.name, note: axis.note, ids: axis.ids, formula: axis.formula, raw, value: raw == null ? null : Math.round(raw) };
    });
  }
  function describePairs(mine) {
    const key = (a,b) => valid(mine[a]) && valid(mine[b]) ? `${mine[a]}${mine[b]}` : null;
    const consent = {
      '01': '本人の同意がない場面では犠牲を認めず、同意がある場面では認める選択でした。',
      '11': '本人の同意の有無にかかわらず、両方の場面で5人を救う選択でした。',
      '00': '本人の同意がある場面でも、1人を落として救う方法は選びませんでした。',
      '10': '同意がない場面ではA、同意がある場面ではBを選びました。',
    };
    const relationship = {
      '10': '1人が友人になると、その人を救う選択へ変わりました。',
      '11': 'どちらの場面でも5人を救う選択でした。',
      '00': 'どちらの場面でも1人を救う選択でした。',
      '01': '1人が友人になると、5人を救う選択へ変わりました。',
    };
    return [
      { title: '本人の意思が加わると', ids: ['Q03','Q04'], text: consent[key('Q03','Q04')] || '比較に必要な回答がありません。' },
      { title: '1人が大切な友人になると', ids: ['Q01','Q05'], text: relationship[key('Q01','Q05')] || '比較に必要な回答がありません。' },
    ];
  }
  function compare(mine, ai, name) {
    const ownAxes = calculate(mine), aiAxes = calculate(ai);
    const shared = OUTCOME_IDS.every(id => valid(mine[id]) && valid(ai[id])) ? OUTCOME_IDS.reduce((sum,id) => sum + mine[id]*ai[id]+(1-mine[id])*(1-ai[id]), 0)/9 : null;
    let common, commonIds;
    if (shared != null && shared >= .75 && Math.abs(ownAxes[0].raw-aiAxes[0].raw) <= 15) {
      common = `今回の回答では、あなたと${name}は、より多くの命を救う判断で近い傾向がありました。`;
      commonIds = OUTCOME_IDS;
    } else {
      const q = core.QUESTIONS.find(q => valid(mine[q.id]) && valid(ai[q.id]) && (mine[q.id] === 1 ? ai[q.id] : 1-ai[q.id]) >= .75);
      common = q ? `今回の${q.id}「${q.title}」では、あなたが選んだ内容を${name}も多く選んでいます。` : '今回の10問では、共通点として強調できる場面は見つかりませんでした。';
      commonIds = q ? [q.id] : [];
    }
    const consentDiff = ownAxes[2].raw != null && aiAxes[2].raw != null ? ownAxes[2].raw-aiAxes[2].raw : 0;
    let difference, differenceIds;
    if (consentDiff >= 15 && mine.Q03 === 0 && mine.Q04 === 1) {
      difference = '一方、今回の回答では、あなたのほうが本人の同意の有無によって判断が大きく変わりました。AIの値は、2場面のA選択率の差を表します。';
      differenceIds = ['Q03','Q04'];
    } else {
      const differing = core.QUESTIONS.filter(q => valid(mine[q.id]) && valid(ai[q.id]))
        .map(q => ({ q, gap: Math.abs(mine[q.id]-ai[q.id]) })).sort((a,b) => b.gap-a.gap)[0];
      if (differing && differing.gap >= .25) {
        const { q } = differing;
        difference = `一方、${q.id}「${q.title}」では、あなたは${mine[q.id] === 1 ? 'A' : 'B'}を選び、${name}のA選択率は${Math.round(ai[q.id]*100)}%でした。`;
        differenceIds = [q.id];
      } else {
        difference = 'この10問では大きな違いは見られませんでした。';
        differenceIds = core.QUESTIONS.map(q => q.id);
      }
    }
    return { common, difference, evidenceIds: [...new Set([...commonIds,...differenceIds])].sort() };
  }
  return { AXES, OUTCOME_IDS, fromAnswers, calculate, describePairs, compare };
});
