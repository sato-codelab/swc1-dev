/* 回答・比較・プロフィールの表示データを生成する。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppPresenter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DISCLAIMER = '数値はこの10問の回答から作った指標です。人格全体や道徳性の優劣、実際の行動を示すものではありません。';
  const statusLabels = { missing:'回答なし', 'version-mismatch':'問題版が異なるため対象外', invalid:'無効な記録', refused:'回答拒否', insufficient:'有効回答不足', truncated:'出力打ち切り', failed:'取得失敗' };
  function question(q,index,total) {
    return { progress:`${index+1} / ${total}問`, progressLabel:`全${total}問中${index+1}問目`, number:`第${index+1}問｜倫理的ジレンマ`, title:q.title, body:q.body,
      note:'判断者はどちらを選ぶべきですか。あなた自身の考えに近い方を選んでください。' };
  }
  const choice = option => ({ optionId:option.id, code:option.code, text:option.text });
  function questionResult({core,modelData,models,question:q,answer,isLast,storageAvailable,number}) {
    const rows = models.map(model => {
      const data = modelData.getAnswer(model,q);
      const option = core.findOption(q,data.representativeOptionId);
      const rate = core.calculateSingleMatch(answer.selected_option_id,option && option.id);
      return { id:model.id, name:model.name, rate,
        answer:option ? `AIの回答：${option.code}｜${option.text}` : data.status === 'available' ? 'AとBが同数のため、代表回答はありません。' : 'この問題の回答はまだありません。',
        detail:rate === 100 ? 'あなたと同じ選択でした' : rate === 0 ? 'あなたとは異なる選択でした' : '比較できる回答がありません' };
    });
    return { kicker:`第${number || Number(q.id.slice(1))}問の比較`, title:'今回の回答', selected:`あなた：${core.findOption(q,answer.selected_option_id).code}｜${core.findOption(q,answer.selected_option_id).text}`,
      rows, comparisonTitle:'この問題での一致率', comparisonNote:'AIの代表回答と比較', profile:null,
      source:models.some(m => m.sourceType === 'mock') ? 'サンプルAIを含む比較です。実在するAIの測定結果ではありません。' : null,
      disclaimer:'一致は100%、不一致は0%です。複数の回答があるAIは、多かった選択を代表回答としています。選択の違いに優劣はありません。' + (storageAvailable ? '' : 'このブラウザでは保存できないため、ページを閉じると回答が失われます。'),
      primaryLabel:isLast ? '全体の結果を見る' : '次の問題へ', restartLabel:null, showHome:true, isSummary:false };
  }
  function start({answered,total,nextIndex,completed,notice}) {
    const resume = answered > 0 && answered < total;
    return { primaryLabel:completed ? '結果をもう一度見る' : resume ? `続きから再開（${nextIndex+1}問目）` : '診断をはじめる', canRestart:resume || completed, notice };
  }
  function summary({core,profiles,modelData,answers,models,selectedModelId}) {
    const mine = Object.fromEntries(core.QUESTIONS.map(q => [q.id,answers[q.id] && answers[q.id].selected_option_id]));
    const ownProbabilities = profiles.fromAnswers(mine);
    const stats = models.map(model => ({model,stats:modelData.calculateAgreement(mine,model)}));
    // 順位は表示の丸め前に決定し、比較条件の異なるモデルや欠測は末尾に置く。
    stats.sort((a,b) => Number(b.stats.rankEligible)-Number(a.stats.rankEligible) ||
      (b.stats.rawRate ?? -1)-(a.stats.rawRate ?? -1));
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
      detail:!s.rankEligible && s.complete ? '回答の条件が異なるため、順位の対象外です' : '', rate:s.rate,
      top:top.some(t => t.model.id === model.id), badge:top.some(t => t.model.id === model.id) ? '最も近い' : null,
    }));
    let profile = null;
    if (selected) {
      const model = selected.model, ai = modelData.getProbabilities(model);
      const ownAxes = profiles.calculate(ownProbabilities), aiAxes = profiles.calculate(ai);
      const narrative = selected.stats.complete ? profiles.compare(ownProbabilities,ai,model.name) : {common:'比較に必要な全10問の回答がそろっていません。',difference:'不足した回答は補完せず、計算できる指標だけを表示します。',evidenceIds:[]};
      profile = { selectedModelId:model.id, modelName:model.name,
        models:stats.map(({model:m}) => ({id:m.id,name:m.name})),
        axes:ownAxes.map((axis,i) => ({...axis,mine:axis.value,ai:aiAxes[i].value})), narrative,
        pairs:profiles.describePairs(ownProbabilities),
        evidence:core.QUESTIONS.map(q => evidence(q,model)),
        source:model.sourceType === 'mock' ? 'AIの回答は架空のサンプルです。実在するAIの測定結果ではありません。' : 'あなたの回答と、取得済みのAI回答を比較しています。',
        metadata:`問題版 ${model.questionVersion} ／ モデル版 ${model.modelVersion} ／ プロンプト版 ${model.systemPromptVersion} ／ ${model.collectedAt ? '取得日時 '+model.collectedAt : '取得日時なし（実測未実施）'}`,
        collectionMethod:model.collectionMethod,
      };
    }
    return { kicker:'全10問の結果', title:'あなたとAIの価値観プロフィール',
      selected:top.length ? `この10問で最も選択が近かったのは ${top.map(t => t.model.name).join('・')}（${Math.round(max)}%）です。${top.length>1 ? '同率のAIをすべて表示しています。' : ''}` : '全10問を比較できるAI回答がないため、最も近いAIは表示していません。',
      comparisonTitle:'この10問での選択一致度', comparisonNote:`${models.length}モデル・一致度の高い順`,rows,profile,
      disclaimer:DISCLAIMER + (models.every(m => m.sourceType === 'mock') ? 'AIの回答は架空のサンプルです。' : 'AIの回答はモデルの版・問い方・実行条件によって変わります。'),primaryLabel:null,restartLabel:null,showHome:true,isSummary:true };
  }
  return { question,choice,questionResult,start,summary };
});
