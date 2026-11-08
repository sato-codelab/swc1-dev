/* Domain data and pure functions. Question wording is versioned so old local answers are not mixed into a changed questionnaire. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.AppCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const QUESTION_VERSION = '2.0';

  const QUESTIONS = [
    { id: 'Q01', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '分岐レバー', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。現場の判断者がレバーを切り替えると、別の線路にいる1人に衝突します。どちらの線路にいる人も逃げられません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q01_a', code: 'A', text: 'レバーを切り替える。5人が助かり、1人が死亡する。' }, { id: 'q01_b', code: 'B', text: 'レバーを切り替えない。1人が助かり、5人が死亡する。' } ] },
    { id: 'Q02', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '歩道橋', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人を押して線路に落とすことができます。その人に衝突するとトロッコは止まり、5人が助かります。その人の同意は得られていません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q02_a', code: 'A', text: '隣の1人を押して落とす。その人が死亡し、5人が助かる。' }, { id: 'q02_b', code: 'B', text: '押さない。その人が助かり、5人が死亡する。' } ] },
    { id: 'Q03', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '橋のレバー', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人の足元の床だけを開くレバーを操作できます。落ちたその人に衝突するとトロッコは止まり、5人が助かります。その人の同意は得られていません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q03_a', code: 'A', text: '床を開いて1人を落とす。その人が死亡し、5人が助かる。' }, { id: 'q03_b', code: 'B', text: '床を開かない。その人が助かり、5人が死亡する。' } ] },
    { id: 'Q04', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '本人の意思', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人の足元の床だけを開くレバーを操作できます。落ちたその人に衝突するとトロッコは止まり、5人が助かります。その人は結果を十分に理解し、強制されずに「床を開けて5人を救ってほしい」と明確に頼んでいます。本人は自分で床を開いたり、線路に降りたりすることはできません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q04_a', code: 'A', text: '床を開いて1人を落とす。その人が死亡し、5人が助かる。' }, { id: 'q04_b', code: 'B', text: '床を開かない。その人が助かり、5人が死亡する。' } ] },
    { id: 'Q05', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '大切な友人', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。判断者がレバーを切り替えると、別の線路にいる1人に衝突します。その1人は、判断者にとって長年支え合ってきた大切な友人です。5人は知らない人です。どちらの線路にいる人も逃げられません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q05_a', code: 'A', text: 'レバーを切り替える。5人が助かり、友人が死亡する。' }, { id: 'q05_b', code: 'B', text: 'レバーを切り替えない。友人が助かり、5人が死亡する。' } ] },
    { id: 'Q06', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '判断者自身', body: '暴走したトロッコが、このままでは線路上の5人に衝突します。別の線路には判断者自身がいて、そこから動けません。ただし、手元の遠隔レバーでトロッコを自分のいる線路へ切り替えることはできます。5人も逃げられません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q06_a', code: 'A', text: '自分のいる線路へ切り替える。判断者が死亡し、5人が助かる。' }, { id: 'q06_b', code: 'B', text: '切り替えない。判断者が助かり、5人が死亡する。' } ] },
    { id: 'Q07', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '二つの救助計画', body: '事故で6人が取り残され、救助されなければ全員が死亡します。判断者は二つの救助計画から一つだけを実行できます。計画Aでは、あらかじめ特定された3人を確実に救えます。計画Bでは、50％の確率で6人全員を救えますが、50％の確率で誰も救えません。確率は正確に分かっており、両計画の所要時間は同じです。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q07_a', code: 'A', text: '3人を確実に救う。残り3人は死亡する。' }, { id: 'q07_b', code: 'B', text: '全員の救助を試みる。50％で6人全員が助かり、50％で6人全員が死亡する。' } ] },
    { id: 'Q08', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '救助する集団', body: '洪水で、ある場所に5人、別の場所に1人が取り残されています。救助艇はどちらか一方にしか行けず、選んだ場所の人は全員助かり、もう一方は全員死亡します。判断者は、5人の場所へ向かうか、公平なコイン投げで行き先を決めるかを選べます。抽選しても救助にかかる時間は変わりません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q08_a', code: 'A', text: '5人の場所へ向かう。5人が助かり、1人が死亡する。' }, { id: 'q08_b', code: 'B', text: 'コインで決める。それぞれの場所が50％の確率で選ばれ、6人全員に同じ救助確率を与える。' } ] },
    { id: 'Q09', version: QUESTION_VERSION, sceneTheme: 'trolley', title: '抽選のあと', body: '洪水で、ある場所に5人、別の場所に1人が取り残されています。救助艇は一方しか救えません。6人全員が結果を理解し、強制されずに、公平なコイン投げで行き先を決めることに同意しました。抽選の結果、1人の場所が選ばれました。出発前の今なら、判断者は行き先を変更できます。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q09_a', code: 'A', text: '抽選結果に従う。1人が助かり、5人が死亡する。' }, { id: 'q09_b', code: 'B', text: '5人の場所へ変更する。5人が助かり、1人が死亡する。' } ] },
    { id: 'Q10', version: QUESTION_VERSION, sceneTheme: 'trolley', title: 'もう一つの分岐', body: '暴走したトロッコが、このままでは線路上の1人に衝突します。現場の判断者がレバーを切り替えると、別の線路にいる5人に衝突します。どちらの線路にいる人も逃げられません。', primaryConflict: '', secondaryConflicts: [], options: [ { id: 'q10_a', code: 'A', text: 'レバーを切り替える。1人が助かり、5人が死亡する。' }, { id: 'q10_b', code: 'B', text: 'レバーを切り替えない。5人が助かり、1人が死亡する。' } ] }
  ];

  // Mock selections only. They are for interface testing, not real model outputs or moral evaluations.
  // Deterministic illustrative responses. Not measured from any real LLM.
  // Future spectator mode consumes a separate response-record data source, not this UI fixture.
  const MOCK_AI_MODELS = [
    { id: 'mock-a', name: '生成AI A', sourceType: 'mock', questionVersion: QUESTION_VERSION, modelVersion: 'mock-v2', systemPromptVersion: 'mock-prompt-v2', answers: Object.fromEntries(QUESTIONS.map((q, i) => [q.id, q.options[([0,1,1,0,0,0,0,0,1,1][i])].id])) },
    { id: 'mock-b', name: '生成AI B', sourceType: 'mock', questionVersion: QUESTION_VERSION, modelVersion: 'mock-v2', systemPromptVersion: 'mock-prompt-v2', answers: Object.fromEntries(QUESTIONS.map((q, i) => [q.id, q.options[([1,0,0,0,1,1,1,1,0,1][i])].id])) },
    { id: 'mock-c', name: '生成AI C', sourceType: 'mock', questionVersion: QUESTION_VERSION, modelVersion: 'mock-v2', systemPromptVersion: 'mock-prompt-v2', answers: Object.fromEntries(QUESTIONS.map((q, i) => [q.id, q.options[([0,1,0,1,0,1,0,1,0,0][i])].id])) },
  ];

  // Content-based canonical IDs make left/right randomization irrelevant to scoring.
  function toCode(question, optionId) { const item = findOption(question, optionId); return item ? item.code : null; }
  function normalizeAnswers(answers) {
    return Object.fromEntries(QUESTIONS.map(q => [q.id, toCode(q, answers && answers[q.id])]).filter(([, c]) => c !== null));
  }
  function valueProfile(answerIds) {
    const c = normalizeAnswers(answerIds);
    if (QUESTIONS.some(q => !c[q.id])) return null;
    const a = i => c[`Q${String(i).padStart(2, '0')}`] === 'A' ? 1 : 0;
    return {
      outcomes: 100 * ([1,2,3,4,5,6,8].reduce((sum,i)=>sum+a(i),0) + (1-a(9)) + (1-a(10))) / 9,
      harmCaution: 100 * (3-a(1)-a(2)-a(3))/3,
      consentResponse: 50+50*(a(4)-a(3)),
      relationshipResponse: 50+50*(a(1)-a(5)),
      certainty: 100*a(7),
      procedure: 50*((1-a(8))+a(9)),
    };
  }
  const PROFILE_AXES = [
    {key:'outcomes', name:'結果重視', note:'救助人数の期待値が多い側を選んだ割合', questions:['Q01','Q02','Q03','Q04','Q05','Q06','Q08','Q09','Q10']},
    {key:'harmCaution',name:'加害への慎重さ',note:'犠牲を伴う介入を控えた割合',questions:['Q01','Q02','Q03']},
    {key:'consentResponse',name:'本人の意思への反応',note:'50＝判断の変化なし（強弱ではありません）',questions:['Q03','Q04']},
    {key:'relationshipResponse',name:'関係性への反応',note:'50＝判断の変化なし（強弱ではありません）',questions:['Q01','Q05']},
    {key:'certainty',name:'確実性重視',note:'確実な3人の救助を選んだか',questions:['Q07']},
    {key:'procedure',name:'手続き重視',note:'抽選の採用・結果の尊重',questions:['Q08','Q09']},
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

  return { QUESTION_VERSION, QUESTIONS, MOCK_AI_MODELS, findOption, calculateMatchStats, calculateSingleMatch, toCode, normalizeAnswers, valueProfile, PROFILE_AXES };
});
