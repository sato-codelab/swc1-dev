/* Recorded response boundary. Frequencies and representative choices are distinct. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./app-core.js') : root.AppCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  const COMPARISON_PROTOCOL = 'synthetic-original-20-v1';
  const samples = [
    [95,25,40,100,90,90,80,80,75,5],
    [100,95,95,100,100,100,20,100,5,0],
    [35,5,5,55,10,45,95,20,95,5],
  ];
  const MOCK_AI_MODELS = samples.map((rates, i) => ({
    id: `mock-${'abc'[i]}`, name: `生成AI ${'ABC'[i]}`,
    modelVersion: 'synthetic-profile-v1', systemPromptVersion: 'not-run',
    questionVersion: core.QUESTION_VERSION, sourceType: 'mock',
    collectionProtocolId: COMPARISON_PROTOCOL, collectedAt: null,
    collectionMethod: 'trolley_value_profile.mdの架空サンプル。20回分を想定した数値で、生成・実測は未実施。',
    minimumValidResponses: 20,
    answers: Object.fromEntries(core.QUESTIONS.map((q, n) => [q.id, {
      kind: 'frequency', status: 'valid',
      counts: { [q.options[0].id]: rates[n] / 5, [q.options[1].id]: 20 - rates[n] / 5 },
      invalidCount: 0,
    }])),
  }));

  function getAnswer(model, question) {
    const empty = (status) => ({ status, probabilityA: null, representativeOptionId: null, counts: null, validCount: 0, invalidCount: 0 });
    if (!model || model.questionVersion !== question.version) return empty('version-mismatch');
    const answer = model.answers && model.answers[question.id];
    if (!answer) return empty('missing');
    if (answer.status !== 'valid') return empty(answer.status || 'invalid');
    if (answer.kind === 'single') {
      if (!core.findOption(question, answer.optionId)) return empty('invalid');
      return { status: 'available', probabilityA: question.options[0].id === answer.optionId ? 1 : 0,
        representativeOptionId: answer.optionId, counts: null, validCount: 1, invalidCount: 0, kind: 'single' };
    }
    if (answer.kind !== 'frequency' || !answer.counts) return empty('invalid');
    const counts = question.options.map(o => answer.counts[o.id]);
    const invalidCount = answer.invalidCount;
    if (Object.keys(answer.counts).some(id => !core.findOption(question, id)) ||
        counts.some(n => !Number.isSafeInteger(n) || n < 0) || !Number.isSafeInteger(invalidCount) || invalidCount < 0) return empty('invalid');
    const validCount = counts[0] + counts[1];
    const minimum = model.minimumValidResponses;
    if (!Number.isSafeInteger(minimum) || minimum < 1 || validCount < minimum) return { ...empty('insufficient'), counts, validCount, invalidCount };
    return {
      status: 'available', kind: 'frequency', probabilityA: counts[0] / validCount,
      representativeOptionId: counts[0] === counts[1] ? null : question.options[counts[0] > counts[1] ? 0 : 1].id,
      counts, validCount, invalidCount,
    };
  }

  function getProbabilities(model) {
    return Object.fromEntries(core.QUESTIONS.map(q => [q.id, getAnswer(model, q).probabilityA]));
  }

  // Future spectator mode consumes this read-only projection; ties never become a forced choice.
  function getRepresentativeAnswers(model) {
    return Object.fromEntries(core.QUESTIONS.map(q => [q.id, getAnswer(model, q).representativeOptionId]));
  }

  function calculateAgreement(userAnswers = {}, model) {
    const observations = core.QUESTIONS.map(q => {
      const id = userAnswers[q.id], code = core.optionCode(q, id), data = getAnswer(model, q);
      const expected = code && data.probabilityA != null ? (code === 'A' ? data.probabilityA : 1 - data.probabilityA) : null;
      return { questionId: q.id, expected, representativeMatch: code && data.representativeOptionId ? id === data.representativeOptionId : null };
    });
    const compared = observations.filter(o => o.expected != null);
    const complete = compared.length === core.QUESTIONS.length;
    const rawRate = complete ? 100 * compared.reduce((sum,o) => sum + o.expected, 0) / core.QUESTIONS.length : null;
    const representative = observations.filter(o => o.representativeMatch != null);
    return { complete, compared: compared.length, rawRate, rate: rawRate == null ? null : Math.round(rawRate), observations,
      representativeMatches: representative.filter(o => o.representativeMatch).length, representativeCompared: representative.length,
      rankEligible: complete && model.collectionProtocolId === COMPARISON_PROTOCOL };
  }

  return { MOCK_AI_MODELS, COMPARISON_PROTOCOL, getAnswer, getProbabilities, getRepresentativeAnswers, calculateAgreement };
});
