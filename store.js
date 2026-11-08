/* 診断回答と表示順を保存する。snapshotは独立したコピーを返す。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEYS = { diagnosis: 'value-judgment-ai-matching-week2-v1', settings: 'value-judgment-ai-matching-settings-v1', spectator: 'value-judgment-ai-matching-spectator-settings-v1' };
  const clone = value => JSON.parse(JSON.stringify(value));
  function localStorageAdapter(key) {
    let available = true;
    return {
      get available() { return available; },
      load() { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { available = false; return null; } },
      save(data) { try { localStorage.setItem(key, JSON.stringify(data)); available = true; } catch (e) { available = false; } },
      clear() { try { localStorage.removeItem(key); } catch (e) { available = false; } },
    };
  }
  function create({ core, adapter, rng = Math.random }) {
    const { QUESTIONS, QUESTION_VERSION, findOption } = core;
    let index = 0, answers = {}, order = [], placements = {}, restoreNotice = '';
    function fresh() {
      index = 0; answers = {}; order = core.createQuestionOrder(rng);
      placements = Object.fromEntries(QUESTIONS.map(q => [q.id, core.createPlacement(q)]));
    }
    function payload() { return { questionVersion: QUESTION_VERSION, questionOrder: order, placements, answers, updatedAt: new Date().toISOString() }; }
    function persist() { adapter.save(payload()); }
    const question = () => QUESTIONS.find(q => q.id === order[index]);
    function validPlacement(q, p) {
      return p && p.left !== p.right && findOption(q,p.left) && findOption(q,p.right);
    }
    function validLayout(saved) {
      return Array.isArray(saved.questionOrder) && saved.questionOrder[0] === 'Q01' &&
        saved.questionOrder.length === QUESTIONS.length && new Set(saved.questionOrder).size === QUESTIONS.length &&
        saved.questionOrder.every(id => QUESTIONS.some(q => q.id === id)) && saved.placements &&
        QUESTIONS.every(q => {
          const p = saved.placements[q.id];
          return validPlacement(q,p);
        });
    }
    fresh();
    return {
      get index() { return index; }, get total() { return QUESTIONS.length; },
      get answers() { return clone(answers); }, get order() { return [...order]; },
      get restoreNotice() { return restoreNotice; }, get storageAvailable() { return adapter.available !== false; },
      question, placement(id = question().id) { return { ...placements[id] }; },
      isLast() { return Object.keys(answers).length === QUESTIONS.length; },
      isComplete() { return QUESTIONS.every(q => answers[q.id]); },
      snapshot() { return clone(payload()); },
      answer(optionId, position) {
        const q = question();
        if (!q || answers[q.id] || !findOption(q,optionId) || !['left','right'].includes(position) || placements[q.id][position] !== optionId) return null;
        const record = { question_id:q.id, question_version:q.version, selected_option_id:optionId,
          display_position:position, displayed_index:index, option_order:{ ...placements[q.id] }, response_timestamp:new Date().toISOString() };
        answers[q.id] = record; persist(); return clone(record);
      },
      advance() {
        if (!answers[question().id]) return false;
        const next = order.findIndex(id => !answers[id]);
        if (next === -1) return false;
        index = next; return true;
      },
      reset() { fresh(); restoreNotice = ''; adapter.clear(); persist(); },
      restore() {
        const saved = adapter.load(); fresh(); restoreNotice = '';
        if (!saved) { persist(); return false; }
        if (saved.questionVersion !== QUESTION_VERSION || !validLayout(saved) || !saved.answers || typeof saved.answers !== 'object') {
          restoreNotice = saved.questionVersion !== QUESTION_VERSION ? '問題セットが新しくなったため、旧版の回答は引き継いでいません。演出の設定は保持されています。' : '保存データを読み込めなかったため、新しい診断を開始します。';
          adapter.clear(); persist(); return false;
        }
        order = [...saved.questionOrder];
        // Keep the current display A-left/B-right, but retain historical answer positions.
        // `fresh()` has already built the canonical placements for this session.
        QUESTIONS.forEach(q => {
          const a = saved.answers[q.id];
          const historicalPlacement = a && (a.option_order || saved.placements[q.id]);
          if (a && a.question_id === q.id && a.question_version === q.version && findOption(q,a.selected_option_id) &&
              ['left','right'].includes(a.display_position) && validPlacement(q,historicalPlacement) && historicalPlacement[a.display_position] === a.selected_option_id && a.displayed_index === order.indexOf(q.id)) {
            answers[q.id] = { ...clone(a), option_order: clone(historicalPlacement) };
          }
        });
        const firstOpen = order.findIndex(id => !answers[id]);
        index = firstOpen === -1 ? order.length-1 : firstOpen;
        persist(); return firstOpen === -1;
      },
    };
  }
  function createSettings(adapter) {
    const saved = adapter.load(); let skipAnimation = Boolean(saved && saved.skipAnimation === true);
    return { get skipAnimation() { return skipAnimation; }, get storageAvailable() { return adapter.available !== false; },
      set(key,value) { if (key === 'skipAnimation') { skipAnimation = value === true; adapter.save({ skipAnimation }); } } };
  }
  return { KEYS, create, createSettings, localStorageAdapter };
});
