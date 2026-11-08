/* Versioned question content and pure choice/placement functions. No DOM or storage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const QUESTION_VERSION = '2.0';
  const COMMON_INSTRUCTIONS = "これから、命に関わる架空の場面が10問出てきます。\nあなたの考えでは、現場の判断者はA・Bのどちらを選ぶべきですか。\n正解を当てるテストではありません。あなた自身の考えに近い方を選んでください。\n\n各問は独立した場面です。使える方法は、書かれた二つだけです。\n確率が書かれた問題を除き、記載された結果は確実に起きるものとします。\n記載がない限り、登場人物は互いに知らない成人で、年齢・健康状態・救助後の見通しに差はなく、誰も事故の原因を作っていません。\n書かれていない事情や、その後の社会的影響は想定せずに答えてください。";
  const QUESTIONS = [
  {
    "id": "Q01",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "分岐レバー",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。現場の判断者がレバーを切り替えると、別の線路にいる1人に衝突します。どちらの線路にいる人も逃げられません。",
    "secondaryConflicts": [
      "人数",
      "介入"
    ],
    "options": [
      {
        "id": "change_track",
        "code": "A",
        "text": "レバーを切り替える。5人が助かり、1人が死亡する。"
      },
      {
        "id": "keep_track",
        "code": "B",
        "text": "レバーを切り替えない。1人が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q02",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "歩道橋",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人を押して線路に落とすことができます。その人に衝突するとトロッコは止まり、5人が助かります。その人の同意は得られていません。",
    "secondaryConflicts": [
      "身体的介入",
      "手段"
    ],
    "options": [
      {
        "id": "push_person",
        "code": "A",
        "text": "隣の1人を押して落とす。その人が死亡し、5人が助かる。"
      },
      {
        "id": "spare_person",
        "code": "B",
        "text": "押さない。その人が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q03",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "橋のレバー",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人の足元の床だけを開くレバーを操作できます。落ちたその人に衝突するとトロッコは止まり、5人が助かります。その人の同意は得られていません。",
    "secondaryConflicts": [
      "装置による介入",
      "手段"
    ],
    "options": [
      {
        "id": "open_floor",
        "code": "A",
        "text": "床を開いて1人を落とす。その人が死亡し、5人が助かる。"
      },
      {
        "id": "keep_floor",
        "code": "B",
        "text": "床を開かない。その人が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q04",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "本人の意思",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。判断者は線路の上の橋にいて、隣の1人の足元の床だけを開くレバーを操作できます。落ちたその人に衝突するとトロッコは止まり、5人が助かります。その人は結果を十分に理解し、強制されずに「床を開けて5人を救ってほしい」と明確に頼んでいます。本人は自分で床を開いたり、線路に降りたりすることはできません。",
    "secondaryConflicts": [
      "同意",
      "依頼"
    ],
    "options": [
      {
        "id": "open_floor",
        "code": "A",
        "text": "床を開いて1人を落とす。その人が死亡し、5人が助かる。"
      },
      {
        "id": "keep_floor",
        "code": "B",
        "text": "床を開かない。その人が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q05",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "大切な友人",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。判断者がレバーを切り替えると、別の線路にいる1人に衝突します。その1人は、判断者にとって長年支え合ってきた大切な友人です。5人は知らない人です。どちらの線路にいる人も逃げられません。",
    "secondaryConflicts": [
      "関係性"
    ],
    "options": [
      {
        "id": "change_track",
        "code": "A",
        "text": "レバーを切り替える。5人が助かり、友人が死亡する。"
      },
      {
        "id": "keep_track",
        "code": "B",
        "text": "レバーを切り替えない。友人が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q06",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "判断者自身",
    "body": "暴走したトロッコが、このままでは線路上の5人に衝突します。別の線路には判断者自身がいて、そこから動けません。ただし、手元の遠隔レバーでトロッコを自分のいる線路へ切り替えることはできます。5人も逃げられません。",
    "secondaryConflicts": [
      "自己犠牲"
    ],
    "options": [
      {
        "id": "self_sacrifice",
        "code": "A",
        "text": "自分のいる線路へ切り替える。判断者が死亡し、5人が助かる。"
      },
      {
        "id": "keep_track",
        "code": "B",
        "text": "切り替えない。判断者が助かり、5人が死亡する。"
      }
    ]
  },
  {
    "id": "Q07",
    "version": "2.0",
    "sceneTheme": "rescue",
    "title": "二つの救助計画",
    "body": "事故で6人が取り残され、救助されなければ全員が死亡します。判断者は二つの救助計画から一つだけを実行できます。計画Aでは、あらかじめ特定された3人を確実に救えます。計画Bでは、50％の確率で6人全員を救えますが、50％の確率で誰も救えません。確率は正確に分かっており、両計画の所要時間は同じです。",
    "secondaryConflicts": [
      "確実性",
      "救助機会"
    ],
    "options": [
      {
        "id": "certain_three",
        "code": "A",
        "text": "3人を確実に救う。残り3人は死亡する。"
      },
      {
        "id": "attempt_all",
        "code": "B",
        "text": "全員の救助を試みる。50％で6人全員が助かり、50％で6人全員が死亡する。"
      }
    ]
  },
  {
    "id": "Q08",
    "version": "2.0",
    "sceneTheme": "rescue",
    "title": "救助する集団",
    "body": "洪水で、ある場所に5人、別の場所に1人が取り残されています。救助艇はどちらか一方にしか行けず、選んだ場所の人は全員助かり、もう一方は全員死亡します。判断者は、5人の場所へ向かうか、公平なコイン投げで行き先を決めるかを選べます。抽選しても救助にかかる時間は変わりません。",
    "secondaryConflicts": [
      "人数",
      "公平な手続き"
    ],
    "options": [
      {
        "id": "rescue_five",
        "code": "A",
        "text": "5人の場所へ向かう。5人が助かり、1人が死亡する。"
      },
      {
        "id": "fair_lottery",
        "code": "B",
        "text": "コインで決める。それぞれの場所が50％の確率で選ばれ、6人全員に同じ救助確率を与える。"
      }
    ]
  },
  {
    "id": "Q09",
    "version": "2.0",
    "sceneTheme": "rescue",
    "title": "抽選のあと",
    "body": "洪水で、ある場所に5人、別の場所に1人が取り残されています。救助艇は一方しか救えません。6人全員が結果を理解し、強制されずに、公平なコイン投げで行き先を決めることに同意しました。抽選の結果、1人の場所が選ばれました。出発前の今なら、判断者は行き先を変更できます。",
    "secondaryConflicts": [
      "合意",
      "手続き"
    ],
    "options": [
      {
        "id": "honor_lottery",
        "code": "A",
        "text": "抽選結果に従う。1人が助かり、5人が死亡する。"
      },
      {
        "id": "rescue_five",
        "code": "B",
        "text": "5人の場所へ変更する。5人が助かり、1人が死亡する。"
      }
    ]
  },
  {
    "id": "Q10",
    "version": "2.0",
    "sceneTheme": "trolley",
    "title": "もう一つの分岐",
    "body": "暴走したトロッコが、このままでは線路上の1人に衝突します。現場の判断者がレバーを切り替えると、別の線路にいる5人に衝突します。どちらの線路にいる人も逃げられません。",
    "secondaryConflicts": [
      "人数",
      "不介入"
    ],
    "options": [
      {
        "id": "change_track",
        "code": "A",
        "text": "レバーを切り替える。1人が助かり、5人が死亡する。"
      },
      {
        "id": "keep_track",
        "code": "B",
        "text": "レバーを切り替えない。5人が助かり、1人が死亡する。"
      }
    ]
  }
];

  const QUESTION_PAIRS = [['Q02','Q03'], ['Q03','Q04'], ['Q01','Q03'], ['Q01','Q05'], ['Q01','Q06'], ['Q08','Q09'], ['Q01','Q10']];
  function findOption(question, id) { return question && question.options.find(o => o.id === id) || null; }
  function optionCode(question, id) { const o = findOption(question, id); return o ? o.code : null; }
  function shuffle(list, rng = Math.random) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function createQuestionOrder(rng = Math.random) {
    // Keep Q01 first; among random orders, prefer fewer adjacent paired questions.
    const ids = QUESTIONS.slice(1).map(q => q.id);
    let best, penalty = Infinity;
    for (let attempt = 0; attempt < 40; attempt++) {
      const order = ['Q01', ...shuffle(ids, rng)];
      const score = QUESTION_PAIRS.filter(([a,b]) => Math.abs(order.indexOf(a) - order.indexOf(b)) === 1).length;
      if (score < penalty) { best = order; penalty = score; }
      if (penalty === 0) break;
    }
    return best;
  }
  function createPlacement(question) {
    const left = question.options.find(option => option.code === 'A');
    const right = question.options.find(option => option.code === 'B');
    return { left: left.id, right: right.id };
  }
  function positionFor(placement, optionId) {
    return ['left', 'right'].find(side => placement && placement[side] === optionId) || null;
  }
  function calculateMatchStats(userAnswers = {}, modelAnswers = {}, questionIds) {
    const ids = questionIds || QUESTIONS.map(q => q.id);
    const questionResults = {};
    ids.forEach(id => {
      const q = QUESTIONS.find(q => q.id === id);
      if (findOption(q, userAnswers[id]) && findOption(q, modelAnswers[id])) questionResults[id] = userAnswers[id] === modelAnswers[id];
    });
    const values = Object.values(questionResults), matches = values.filter(Boolean).length;
    const rawRate = values.length ? 100 * matches / values.length : null;
    return { matches, compared: values.length, rawRate, rate: rawRate == null ? null : Math.round(rawRate), questionResults };
  }
  function calculateSingleMatch(userId, modelId) { return userId && modelId ? (userId === modelId ? 100 : 0) : null; }
  return { QUESTION_VERSION, COMMON_INSTRUCTIONS, QUESTIONS, QUESTION_PAIRS, findOption, optionCode, shuffle, createQuestionOrder, createPlacement, positionFor, calculateMatchStats, calculateSingleMatch };
});
