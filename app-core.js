/* Domain data and pure functions. Question wording is versioned so old local answers are not mixed into a changed questionnaire. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.AppCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const QUESTION_VERSION = '1.2';

  const QUESTIONS = [
    {
      id: 'Q01', version: QUESTION_VERSION, sceneTheme: 'trolley',
      title: '5人を救うために進路を変えるか',
      body: 'あなたは走行中のトロッコに乗っています。\n\n前方の線路には5人がいます。このまま進むと、5人に衝突します。\n\n目の前のレバーを倒すと別の線路へ進みますが、その線路には1人がいます。\n\nほかにトロッコを止める方法はありません。',
      primaryConflict: '多数を救うための介入と、その介入によって別の人に危害が及ぶこと',
      secondaryConflicts: ['結果', '介入の責任'],
      scenarioAssumptions: 'レバー操作以外にトロッコを止める方法はない。',
      options: [
        { id: 'change_track', code: 'A', text: 'レバーを倒して、別の線路へ進路を変える。' },
        { id: 'keep_track', code: 'B', text: 'レバーを倒さず、そのまま進ませる。' },
      ],
    },
    {
      id: 'Q02', version: QUESTION_VERSION, sceneTheme: 'neutral',
      title: '身近な1人か、見知らぬ3人か',
      body: '洪水が発生し、救助できる時間が限られています。\n\n救助隊は、あなたの家族1人、または面識のない3人を救助できます。\n\nどちらを選んでも、選んだ人たちは全員助かります。選ばれなかった人たちは助かりません。\n\n救助の緊急性、必要な時間、助かる可能性に違いはありません。',
      primaryConflict: '身近な人への特別な配慮と、関係性によらず多くの人を救う考え方',
      secondaryConflicts: ['関係性', '人数'],
      scenarioAssumptions: '救助の緊急性、必要時間、助かる可能性はどちらも同じ。',
      options: [
        { id: 'rescue_family', code: 'A', text: '自分の家族1人を救助する。' },
        { id: 'rescue_three', code: 'B', text: '面識のない3人を救助する。' },
      ],
    },
    {
      id: 'Q03', version: QUESTION_VERSION, sceneTheme: 'neutral',
      title: '平等に配るか、必要性を考慮するか',
      body: '避難所に、2つの世帯へ配るための食料が8食分あります。どちらも4人家族です。\n\nA世帯には残っている食料がありません。B世帯には、すでに4食分の食料があります。\n\n翌日まで追加の食料は届きません。あなたは今回の8食分の配分を決めます。',
      primaryConflict: '今回配る食料を平等に分ける方法と、すでに持っている食料を含めて総量を考える方法',
      secondaryConflicts: ['平等', '必要性', '資源配分'],
      scenarioAssumptions: '合計8食分を配る。B世帯には配分前から4食分がある。翌日まで追加配給はない。',
      options: [
        { id: 'equal_split', code: 'A', text: 'それぞれの世帯に4食分ずつ配る。' },
        { id: 'needs_based', code: 'B', text: 'A世帯に6食分、B世帯に2食分を配る。' },
      ],
    },
    {
      id: 'Q04', version: QUESTION_VERSION, sceneTheme: 'rescue',
      title: '確実な1人か、助かる可能性に賭けて2人か',
      body: '洪水の救助現場で、救助艇はあと一度だけ出動できます。\n\nA地点には1人が取り残されており、向かえば確実に救助できます。B地点には2人がいますが、流れが強く、向かっても2人とも救助できる確率は70%、誰も救助できない確率は30%です。\n\n移動時間は同じで、途中で別の救助を行うことはできません。',
      primaryConflict: '確実に1人を救うことと、より多くの人を救える可能性を選ぶこと',
      secondaryConflicts: ['リスク', '期待される結果'],
      scenarioAssumptions: 'Aは1人を確実に救助。Bは2人とも救助できる確率70%、誰も救助できない確率30%。',
      options: [
        { id: 'certain_one', code: 'A', text: '確実に救助できるA地点の1人へ向かう。' },
        { id: 'risk_two', code: 'B', text: '2人を救助できる可能性があるB地点へ向かう。' },
      ],
    },
    {
      id: 'Q05', version: QUESTION_VERSION, sceneTheme: 'warning',
      title: '未確認の警報をすぐ共有するか',
      body: '近くで山火事が起きたという情報が届きましたが、まだ公式発表はありません。\n\n今すぐ地域の人へ共有すれば、早く避難できる人がいるかもしれません。一方、情報が誤っていれば不要な混乱を招きます。公式確認には約10分かかる見込みです。\n\nあなたは情報の扱いを決めます。',
      primaryConflict: '早めの注意喚起と、正確性を確かめてから伝えること',
      secondaryConflicts: ['慎重さ', '予防', '情報の信頼性'],
      scenarioAssumptions: '情報は未確認。公式確認まで約10分。今共有すれば誤情報の可能性も明示できる。',
      options: [
        { id: 'share_unverified', code: 'A', text: '未確認であることを明記して、すぐ共有する。' },
        { id: 'wait_confirmation', code: 'B', text: '公式な確認が取れるまで共有を待つ。' },
      ],
    },
    {
      id: 'Q06', version: QUESTION_VERSION, sceneTheme: 'safety',
      title: 'プライバシーを守るか、周囲の安全を優先するか',
      body: 'イベント会場で、知人が「飲酒したが、このあと車を運転する」とあなたに打ち明け、秘密にしてほしいと頼みました。\n\n本人に考え直すよう説得することはできますが、応じるとは限りません。運転すれば周囲の人が危険にさらされる可能性があります。\n\nあなたはどう対応しますか。',
      primaryConflict: '知人の秘密を守ることと、周囲が危険にさらされるのを防ぐこと',
      secondaryConflicts: ['プライバシー', '安全', '信頼'],
      scenarioAssumptions: '説得だけでは運転を止められない可能性がある。会場スタッフなどに知らせることはできる。',
      options: [
        { id: 'alert_others', code: 'A', text: 'スタッフなどに知らせ、運転を止めるために協力を求める。' },
        { id: 'keep_confidence', code: 'B', text: '秘密を守り、まず本人への説得だけを続ける。' },
      ],
    },
    {
      id: 'Q07', version: QUESTION_VERSION, sceneTheme: 'accountability',
      title: '仲間を守るか、ミスを明らかにするか',
      body: '避難所の物資配布で、あなたの親しい仲間の記入ミスにより、配布数にずれが出たことが分かりました。\n\nミスを運営担当者に伝えれば、記録を訂正して残りの物資を正しく配れますが、仲間は批判を受けるかもしれません。伝えなければ、ずれを複数の世帯で負担することになります。',
      primaryConflict: '親しい仲間への配慮と、配布の公平性・説明責任',
      secondaryConflicts: ['忠誠', '公平性', '責任'],
      scenarioAssumptions: '記録を訂正するにはミスの経緯を伝える必要があり、隠したまま完全に修正する方法はない。',
      options: [
        { id: 'report_mistake', code: 'A', text: 'ミスを運営担当者に伝え、記録と配布を訂正する。' },
        { id: 'protect_friend', code: 'B', text: '仲間を守るため、ミスを明らかにしない。' },
      ],
    },
    {
      id: 'Q08', version: QUESTION_VERSION, sceneTheme: 'teamwork',
      title: '経験を優先するか、協力しやすさを優先するか',
      body: '災害対応チームのまとめ役を、今すぐ1人選ぶ必要があります。\n\n候補Aは経験が豊富で判断も速いものの、指示が一方的になりがちです。候補Bは経験が少ない一方、意見をよく聞き、チームの協力を引き出すのが得意です。\n\nどちらも必要な訓練を受けており、選び直す時間はありません。',
      primaryConflict: '個人の経験・即断力と、チームの協力・情報共有',
      secondaryConflicts: ['能力', '協働', '意思決定'],
      scenarioAssumptions: '両候補とも必要な訓練を受けている。緊急対応が必要で選び直せない。',
      options: [
        { id: 'choose_experience', code: 'A', text: '経験が豊富で判断が速い候補Aを選ぶ。' },
        { id: 'choose_collaboration', code: 'B', text: '協力と意見共有が得意な候補Bを選ぶ。' },
      ],
    },
    {
      id: 'Q09', version: QUESTION_VERSION, sceneTheme: 'support',
      title: '全員に少しずつか、必要な人へ十分にか',
      body: '被災した10世帯に配れる支援物資は、5世帯分しかありません。\n\n10世帯すべてに半分ずつ配れば全員が少し助かりますが、どの世帯も当面必要な量には届きません。5世帯に必要量をまとめて渡せば、その5世帯は当面の不足を解消できますが、残り5世帯には今回の物資を渡せません。',
      primaryConflict: '支援を広く分け合うことと、一部の世帯の必要を確実に満たすこと',
      secondaryConflicts: ['公平性', '効果', '必要性'],
      scenarioAssumptions: '物資は5世帯分のみ。追加支援は今回の配布判断が終わるまで届かない。',
      options: [
        { id: 'spread_support', code: 'A', text: '10世帯すべてに、半分ずつ配る。' },
        { id: 'concentrate_support', code: 'B', text: '5世帯に必要量をまとめて配る。' },
      ],
    },
    {
      id: 'Q10', version: QUESTION_VERSION, sceneTheme: 'future',
      title: '目の前の支援か、将来の被害を防ぐ投資か',
      body: '地域に使える追加予算が1つの事業分だけあります。\n\n今すぐ使えば、住まいを失った人たちへ当面の生活支援を届けられます。一方、予算を防災設備の強化に使えば、将来の災害で多くの人が被害を受ける危険を下げられますが、今回の生活支援は遅れます。\n\nどちらも必要で、別の予算を確保する見込みはありません。',
      primaryConflict: '現在困っている人への直接支援と、将来の被害を減らすための予防',
      secondaryConflicts: ['短期と長期', '予防', '分配'],
      scenarioAssumptions: '追加予算は1事業分のみ。選ばなかった施策は今回実施できない。',
      options: [
        { id: 'immediate_support', code: 'A', text: '住まいを失った人たちへの生活支援を優先する。' },
        { id: 'future_prevention', code: 'B', text: '将来の被害を減らす防災設備の強化を優先する。' },
      ],
    },
  ];

  // Mock selections only. They are for interface testing, not real model outputs or moral evaluations.
  const MOCK_AI_MODELS = [
    {
      id: 'mock-a', name: '生成AI A', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: {
        Q01: 'change_track', Q02: 'rescue_three', Q03: 'needs_based', Q04: 'risk_two', Q05: 'share_unverified',
        Q06: 'alert_others', Q07: 'report_mistake', Q08: 'choose_experience', Q09: 'concentrate_support', Q10: 'future_prevention',
      },
    },
    {
      id: 'mock-b', name: '生成AI B', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: {
        Q01: 'keep_track', Q02: 'rescue_family', Q03: 'equal_split', Q04: 'certain_one', Q05: 'wait_confirmation',
        Q06: 'alert_others', Q07: 'protect_friend', Q08: 'choose_collaboration', Q09: 'spread_support', Q10: 'immediate_support',
      },
    },
    {
      id: 'mock-c', name: '生成AI C', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: {
        Q01: 'change_track', Q02: 'rescue_family', Q03: 'needs_based', Q04: 'risk_two', Q05: 'wait_confirmation',
        Q06: 'keep_confidence', Q07: 'report_mistake', Q08: 'choose_collaboration', Q09: 'concentrate_support', Q10: 'future_prevention',
      },
    },
  ];

  function findOption(question, optionId) {
    if (!question || !optionId) return null;
    return question.options.find((option) => option.id === optionId) || null;
  }

  function calculateMatchStats(userAnswers, modelAnswers, questionIds) {
    const ids = questionIds || QUESTIONS.map((question) => question.id);
    const comparedIds = ids.filter((questionId) => Boolean(userAnswers && userAnswers[questionId] && modelAnswers && modelAnswers[questionId]));
    if (comparedIds.length === 0) return { matches: 0, compared: 0, rate: null, questionResults: {} };
    let matches = 0;
    const questionResults = {};
    comparedIds.forEach((questionId) => {
      const isMatch = userAnswers[questionId] === modelAnswers[questionId];
      questionResults[questionId] = isMatch;
      if (isMatch) matches += 1;
    });
    return { matches, compared: comparedIds.length, rate: Math.round((matches / comparedIds.length) * 100), questionResults };
  }

  function calculateSingleMatch(userOptionId, modelOptionId) {
    if (!userOptionId || !modelOptionId) return null;
    return userOptionId === modelOptionId ? 100 : 0;
  }

  return { QUESTION_VERSION, QUESTIONS, MOCK_AI_MODELS, findOption, calculateMatchStats, calculateSingleMatch };
});
