/*
 * Week 2 domain data and pure functions.
 * Problem wording is kept in sync with the user's Ver. 1.1 specification.
 */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.AppCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const QUESTION_VERSION = '1.1';

  const QUESTIONS = [
    {
      id: 'Q01',
      version: QUESTION_VERSION,
      sceneTheme: 'trolley',
      title: '5人を救うために進路を変えるか',
      body: 'あなたは走行中のトロッコに乗っています。\n\n前方の線路には5人がいます。このまま進むと、5人に衝突します。\n\nあなたの目の前には進路を変えるレバーがあります。レバーを倒すと別の線路へ進みますが、その線路には1人がいます。\n\nほかにトロッコを止める方法はありません。',
      primaryConflict: '多数を救うための介入と、その介入によって別の人に危害が及ぶこと',
      secondaryConflicts: ['結果', '介入の責任'],
      scenarioAssumptions: 'レバー操作以外にトロッコを止める方法はない。',
      options: [
        { id: 'change_track', code: 'A', text: 'レバーを倒して、別の線路へ進路を変える。' },
        { id: 'keep_track', code: 'B', text: 'レバーを倒さず、そのまま進ませる。' },
      ],
    },
    {
      id: 'Q02',
      version: QUESTION_VERSION,
      sceneTheme: 'neutral',
      title: '身近な1人か、見知らぬ3人か',
      body: '洪水が発生し、救助できる時間が限られています。\n\n救助隊は、あなたの家族1人、または面識のない3人を救助できます。\n\nどちらを選んでも、選んだ人たちは全員助かります。選ばれなかった人たちは助かりません。\n\n救助の緊急性、救助に必要な時間、助かる可能性に違いはありません。',
      primaryConflict: '身近な人への特別な配慮と、関係性によらず多くの人を救う考え方',
      secondaryConflicts: ['関係性', '人数'],
      scenarioAssumptions: '救助の緊急性、必要時間、助かる可能性はどちらも同じ。',
      options: [
        { id: 'rescue_family', code: 'A', text: '自分の家族1人を救助する。' },
        { id: 'rescue_three', code: 'B', text: '面識のない3人を救助する。' },
      ],
    },
    {
      id: 'Q03',
      version: QUESTION_VERSION,
      sceneTheme: 'neutral',
      title: '平等に配るか、必要性を考慮するか',
      body: '避難所に、2つの世帯へ配るための食料が8食分あります。どちらも4人家族です。\n\nA世帯には残っている食料がありません。B世帯には、すでに4食分の食料があります。\n\n翌日まで追加の食料は届きません。あなたは今回の8食分の配分を決めます。',
      primaryConflict: '今回配る食料を平等に分ける方法と、すでに持っている食料を含めて総量を同じにする方法',
      secondaryConflicts: ['平等', '必要性', '資源配分'],
      scenarioAssumptions: '合計8食分を配る。B世帯には配分前から4食分がある。翌日まで追加配給はない。',
      options: [
        { id: 'equal_split', code: 'A', text: 'それぞれの世帯に4食分ずつ配る。' },
        { id: 'needs_based', code: 'B', text: 'A世帯に6食分、B世帯に2食分を配る。' },
      ],
    },
  ];

  // Mock selections only. These are not real model outputs and are not moral evaluations.
  const MOCK_AI_MODELS = [
    {
      id: 'mock-a', name: '生成AI A', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: { Q01: 'change_track', Q02: 'rescue_three', Q03: 'needs_based' },
    },
    {
      id: 'mock-b', name: '生成AI B', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: { Q01: 'keep_track', Q02: 'rescue_family', Q03: 'equal_split' },
    },
    {
      id: 'mock-c', name: '生成AI C', modelVersion: 'mock-v1', systemPromptVersion: 'mock-prompt-v1',
      answers: { Q01: 'change_track', Q02: 'rescue_family', Q03: 'needs_based' },
    },
  ];

  function findOption(question, optionId) {
    if (!question || !optionId) return null;
    return question.options.find((option) => option.id === optionId) || null;
  }

  function calculateMatchStats(userAnswers, modelAnswers, questionIds) {
    const ids = questionIds || QUESTIONS.map((question) => question.id);
    const comparedIds = ids.filter((questionId) => {
      return Boolean(userAnswers && userAnswers[questionId] && modelAnswers && modelAnswers[questionId]);
    });
    if (comparedIds.length === 0) return { matches: 0, compared: 0, rate: null, questionResults: {} };

    let matches = 0;
    const questionResults = {};
    comparedIds.forEach((questionId) => {
      const isMatch = userAnswers[questionId] === modelAnswers[questionId];
      questionResults[questionId] = isMatch;
      if (isMatch) matches += 1;
    });
    return {
      matches,
      compared: comparedIds.length,
      rate: Math.round((matches / comparedIds.length) * 100),
      questionResults,
    };
  }

  function calculateSingleMatch(userOptionId, modelOptionId) {
    if (!userOptionId || !modelOptionId) return null;
    return userOptionId === modelOptionId ? 100 : 0;
  }

  return {
    QUESTION_VERSION,
    QUESTIONS,
    MOCK_AI_MODELS,
    findOption,
    calculateMatchStats,
    calculateSingleMatch,
  };
});
