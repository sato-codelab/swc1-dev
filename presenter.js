/* Pure view models. Model observations never reach a question-in-progress view. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppPresenter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DISCLAIMER = '数値はこの10問の回答から作った指標です。人格全体や道徳性の優劣、実際の行動を示すものではありません。検証済みの心理尺度ではありません。';
  const statusLabels = { missing:'回答なし', 'version-mismatch':'問題版が異なるため対象外', invalid:'無効な記録', refused:'回答拒否', insufficient:'有効回答不足', truncated:'出力打ち切り', failed:'取得失敗' };
  function question(q,index,total) {
    return { progress:`QUESTION ${index+1} / ${total}`, progressLabel:`全${total}問中${index+1}問目`, number:`${q.id}｜倫理的ジレンマ`, title:q.title, body:q.body,
      note:'判断者はどちらを選ぶべきですか。あなた自身の考えに近い方を選んでください。' };
  }
  const choice = option => ({ optionId:option.id, code:option.code, text:option.text });
  function questionResult({core,question:q,answer,isLast,storageAvailable}) {
    return { kicker:`ANSWER SAVED · ${q.id}`, title:'回答を記録しました', selected:`${core.findOption(q,answer.selected_option_id).code}：${core.findOption(q,answer.selected_option_id).text}`,
      rows:[], comparisonTitle:'', comparisonNote:'', profile:null,
      disclaimer: storageAvailable ? 'AIの回答・比較・解説は、全10問の回答後にまとめて表示します。' : 'このブラウザでは保存できないため、回答はページを開いている間だけ保持されます。',
      primaryLabel:isLast ? '価値観プロフィールを見る' : '次の問題へ', restartLabel:'診断を最初からやり直す', isSummary:false };
  }
  function start({answered,total,nextIndex,completed,notice}) {
    const resume = answered > 0 && answered < total;
    return { primaryLabel:completed ? '結果をもう一度見る' : resume ? `続きから再開（${nextIndex+1}問目）` : '診断をはじめる', canRestart:resume || completed, notice };
  }
  function summary({core,profiles,modelData,answers,models,selectedModelId}) {
    const mine = Object.fromEntries(core.QUESTIONS.map(q => [q.id,answers[q.id] && answers[q.id].selected_option_id]));
    const ownProbabilities = profiles.fromAnswers(mine);
    const stats = models.map(model => ({model,stats:modelData.calculateAgreement(mine,model)}));
    const eligible = stats.filter(item => item.stats.rankEligible);
    const max = eligible.length ? Math.max(...eligible.map(item => item.stats.rawRate)) : null;
    const top = eligible.filter(item => Math.abs(item.stats.rawRate-max) < 1e-9);
    const selected = stats.find(item => item.model.id === selectedModelId) || top[0] || stats[0];
    const evidence = (q,model) => {
      const observation = modelData.getAnswer(model,q), option = core.findOption(q,mine[q.id]);
      const representative = core.findOption(q,observation.representativeOptionId);
      const counts = observation.counts ? `A ${observation.counts[0]}回 / B ${observation.counts[1]}回 / 無効 ${observation.invalidCount}回` : observation.status === 'available' ? '単一の記録回答' : statusLabels[observation.status] || '回答未確定';
      return { id:q.id, title:q.title, body:q.body, options:q.options.map(o => `${o.code}：${o.text}`), mine:option ? `${option.code}：${option.text}` : '未回答',
        modelName:model.name, counts, representative: representative ? `${representative.code}：${representative.text}` : observation.status === 'available' ? 'A/B拮抗（代表回答なし）' : '回答未確定',
        agreement:option && observation.probabilityA != null ? `${Math.round(100*(option.code === 'A' ? observation.probabilityA : 1-observation.probabilityA))}%` : '未比較',
        kind:observation.kind, reason: model.answerMetadata && model.answerMetadata[q.id] && model.answerMetadata[q.id].reasonSummary || null };
    };
    const rows = stats.map(({model,stats:s}) => ({ id:model.id, name:model.name,
      answer:s.complete ? `代表回答との一致：${s.representativeMatches} / ${s.representativeCompared}問` : `全10問の一致度は未算出（比較可能 ${s.compared} / 10問）`,
      detail:model.sourceType === 'mock' ? '架空サンプル・有効回答内の割合' : '記録済み回答', rate:s.rate,
      top:top.some(t => t.model.id === model.id), badge:top.some(t => t.model.id === model.id) ? '最も近い' : null,
    }));
    let profile = null;
    if (selected) {
      const model = selected.model, ai = modelData.getProbabilities(model);
      const ownAxes = profiles.calculate(ownProbabilities), aiAxes = profiles.calculate(ai);
      const narrative = selected.stats.complete ? profiles.compare(ownProbabilities,ai,model.name) : {common:'比較に必要な全10問の回答がそろっていません。',difference:'不足した回答は補完せず、計算できる指標だけを表示します。',evidenceIds:[]};
      profile = { selectedModelId:model.id, modelName:model.name,
        models:models.map(m => ({id:m.id,name:m.name})),
        axes:ownAxes.map((axis,i) => ({...axis,mine:axis.value,ai:aiAxes[i].value})), narrative,
        pairs:profiles.describePairs(ownProbabilities),
        evidence:core.QUESTIONS.map(q => evidence(q,model)),
        source:model.sourceType === 'mock' ? 'あなたの回答は今回の入力です。AIのみ架空のサンプルで、実在LLMの実測ではありません。回数は各問の詳細で確認できます。' : 'あなたの回答と、取得済みのAI回答を比較しています。',
        metadata:`問題版 ${model.questionVersion} ／ モデル版 ${model.modelVersion} ／ プロンプト版 ${model.systemPromptVersion} ／ ${model.collectedAt ? '取得日時 '+model.collectedAt : '取得日時なし（実測未実施）'}`,
        collectionMethod:model.collectionMethod,
      };
    }
    return { kicker:'10 QUESTIONS · YOUR PROFILE', title:'あなたとAIの価値観プロフィール',
      selected:top.length ? `この10問で最も選択が近かったのは ${top.map(t => t.model.name).join('・')}（${Math.round(max)}%）です。${top.length>1 ? '同率のAIをすべて表示しています。' : ''}` : '全10問を比較できるAI回答がないため、最も近いAIは表示していません。',
      comparisonTitle:'この10問での選択一致度', comparisonNote:models.every(m => m.sourceType === 'mock') ? 'AIは架空データ' : '回答の取得条件は詳細欄へ',rows,profile,
      disclaimer:DISCLAIMER + (models.every(m => m.sourceType === 'mock') ? 'AIの回答は動作確認用の架空データです。' : 'AIの回答はモデルの版・問い方・実行条件によって変わります。'),primaryLabel:null,restartLabel:'もう一度診断する',isSummary:true };
  }
  return { question,choice,questionResult,start,summary };
});
