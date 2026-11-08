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
      note: '正解・不正解はありません。現場の判断者はどちらを選ぶべきか、あなたの考えで答えてください。',
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
      primaryLabel: isLast ? `${core.QUESTIONS.length}問の比較結果を見る` : '次の問題へ',
      restartLabel: '診断を最初からやり直す',
      isSummary: false,
    };
  }

  function start({ answered, total, nextIndex }) {
    const resume = answered > 0 && answered < total;
    return { primaryLabel: resume ? `続きから再開（Q${nextIndex + 1}）` : '診断をはじめる', canRestart: resume };
  }

  function summary({ core, answers, models }) {
    const ids = core.QUESTIONS.map((q) => q.id);
    const mine = Object.fromEntries(ids.map((id) => [id, answers[id] && answers[id].selected_option_id]));
    const rows = models.map((m) => {
        const s = core.calculateMatchStats(mine, m.answers, ids);
        const r = s.questionResults;
        return {
          name: m.name,
          answer: `一致した問題：${s.matches} / ${s.compared}問`,
          detail: ids.map((id) => `${id}：${r[id] === undefined ? '未比較' : r[id] ? '一致' : '不一致'}`).join(SEP),
          rate: s.rate,
        };
      });
    const max = Math.max(0, ...rows.map((r) => r.rate || 0));
    rows.forEach((r) => { if (max > 0 && r.rate === max) { r.badge = '最も近い'; r.top = true; } });
    const top = rows.filter((r) => r.top).map((r) => r.name).join('・');
    return {
      kicker: 'DIAGNOSIS COMPLETE',
      title: '診断が終了しました',
      selected: top ? `${ids.length}問すべてに回答しました。回答が最も近かったのは ${top}（${max}%）です。` : `${ids.length}問すべてに回答しました。`,
      comparisonTitle: 'AI別の回答一致率',
      comparisonNote: `今回の${ids.length}問の集計`,
      rows,
      disclaimer: `この一致率は、今回実装した${ids.length}問の回答パターンの類似度です。価値観全般の一致率や、AI・利用者の倫理的な優劣を示しません。問題セットは心理学的に検証済みの診断尺度ではありません。`,
      primaryLabel: '価値観プロフィールを見る',
      restartLabel: 'もう一度診断する',
      isSummary: true,
    };
  }

  function profile({ core, answers, models }) {
    const ids = core.QUESTIONS.map(q => q.id);
    const mine = Object.fromEntries(ids.map(id => [id, answers[id]?.selected_option_id]));
    const myScores = core.valueProfile(mine);
    if (!myScores) return null;
    const ranked = models.map(model => ({ model, stats: core.calculateMatchStats(mine, model.answers, ids) }))
      .filter(r => r.stats.compared === ids.length).sort((a,b) => b.stats.rate-a.stats.rate);
    const best = ranked[0] || null;
    const ties = best ? ranked.filter(r => r.stats.rate === best.stats.rate).map(r => r.model.name) : [];
    const other = best ? core.valueProfile(best.model.answers) : null;
    const axes = core.PROFILE_AXES.map(axis => ({ ...axis, mine: myScores[axis.key], ai: other ? other[axis.key] : null }));
    const common = best && ids.filter(id => best.model.answers[id] === mine[id]);
    const different = best && ids.filter(id => best.model.answers[id] !== mine[id]);
    const fmt = id => `${id}（あなた：${core.toCode(core.QUESTIONS.find(q=>q.id===id),mine[id])}／${best.model.name}：${core.toCode(core.QUESTIONS.find(q=>q.id===id),best.model.answers[id])}）`;
    return {
      title: 'あなたとAIの価値観プロフィール',
      lead: best ? `全10問で最も回答が近かったのは ${ties.join('・')}（一致率 ${best.stats.rate}%）です。` : '比較可能なモデル回答がありません。',
      nearest: best?.model.name || null, axes,
      common: common?.length ? `今回の回答が一致した例：${fmt(common[0])}` : '今回の10問では一致する回答がありませんでした。',
      difference: different?.length ? `判断が異なった例：${fmt(different[0])}` : '今回の10問では回答の違いは見られませんでした。',
      evidence: best ? ids.map(id => ({ id, title: core.QUESTIONS.find(q=>q.id===id).title, user: core.toCode(core.QUESTIONS.find(q=>q.id===id),mine[id]), model: core.toCode(core.QUESTIONS.find(q=>q.id===id),best.model.answers[id]) })) : [],
      note: 'AI A/B/Cの回答は架空のモックであり、実際のLLMの測定結果ではありません。各軸はこの10問の回答から作った記述的指標です。性格・道徳性の優劣を表さず、研究で検証済みの尺度でもありません。50は軸により意味が異なります。',
    };
  }

  root.AppPresenter = { question, choice, questionResult, start, summary, profile };
})(window);
