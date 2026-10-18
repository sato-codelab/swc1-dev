/* State + persistence. No DOM. Swap `adapter` to persist elsewhere (API, IndexedDB...). */
(function (root) {
  'use strict';

  function localStorageAdapter(key) {
    return {
      load() { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
      save(data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn('回答のローカル保存を利用できません。', e); } },
      clear() { try { localStorage.removeItem(key); } catch (e) { console.warn('保存済みデータを削除できませんでした。', e); } },
    };
  }

  function create({ core, adapter }) {
    const { QUESTIONS, QUESTION_VERSION, findOption } = core;
    let index = 0;
    let answers = {};

    const store = {
      get index() { return index; },
      get total() { return QUESTIONS.length; },
      get answers() { return answers; },
      question() { return QUESTIONS[index]; },
      isLast() { return index === QUESTIONS.length - 1; },

      answer(optionId, position) {
        const q = QUESTIONS[index];
        if (!findOption(q, optionId)) return null;
        const record = {
          question_id: q.id,
          question_version: q.version,
          selected_option_id: optionId,
          display_position: position,
          response_timestamp: new Date().toISOString(),
        };
        answers[q.id] = record;
        adapter.save({ questionVersion: QUESTION_VERSION, answers, updatedAt: new Date().toISOString() });
        return record;
      },

      advance() {
        if (index >= QUESTIONS.length - 1) return false;
        index += 1;
        return true;
      },

      reset() { index = 0; answers = {}; adapter.clear(); },

      /** @returns {boolean} true when every question was already answered */
      restore() {
        const saved = adapter.load();
        if (!saved || saved.questionVersion !== QUESTION_VERSION || typeof saved.answers !== 'object' || !saved.answers) {
          if (saved) adapter.clear();
          return false;
        }
        QUESTIONS.forEach((q) => {
          const a = saved.answers[q.id];
          if (a && findOption(q, a.selected_option_id) && (a.display_position === 'left' || a.display_position === 'right')) answers[q.id] = a;
        });
        const firstOpen = QUESTIONS.findIndex((q) => !answers[q.id]);
        index = firstOpen === -1 ? QUESTIONS.length - 1 : firstOpen;
        return firstOpen === -1;
      },
    };
    return store;
  }

  root.AppStore = { create, localStorageAdapter };
})(window);
