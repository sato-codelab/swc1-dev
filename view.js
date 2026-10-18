/* DOM rendering + user input events. Receives view-models, emits plain events. No domain logic. */
(function (root) {
  'use strict';

  function create(doc) {
    const $ = (id) => doc.getElementById(id);
    const el = {
      progress: $('progressPill'), number: $('questionNumber'), title: $('questionTitle'),
      body: $('questionBody'), note: $('questionNote'),
      overlay: $('resultOverlay'), kicker: $('resultKicker'), resultTitle: $('resultTitle'),
      selected: $('resultSelected'), cmpTitle: $('comparisonTitle'), cmpNote: $('comparisonNote'),
      list: $('comparisonList'), disclaimer: $('resultDisclaimer'), next: $('nextButton'), restart: $('restartButton'),
    };
    const buttons = { left: doc.querySelector('.choice-left'), right: doc.querySelector('.choice-right') };
    const side = { left: '左', right: '右' };
    const arrow = { left: '←', right: '→' };
    let onChoose = () => {};

    function renderChoice(position, vm) {
      const b = buttons[position];
      b.dataset.optionId = vm.optionId;
      b.dataset.position = position;
      b.disabled = false;
      b.classList.remove('is-selected');
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `画面${side[position]}側、選択肢${vm.code}：${vm.text}`);
      b.querySelector('.choice-arrow').textContent = arrow[position];
      b.querySelector('.choice-copy strong').textContent = vm.text;
      b.querySelector('.choice-copy small').textContent = `選択肢 ${vm.code}`;
    }

    function row(r, isSummary) {
      const div = doc.createElement('div');
      div.className = `comparison-row${isSummary ? ' comparison-row-summary' : ''}`;
      const meta = doc.createElement('div');
      const add = (parent, cls, text) => { const n = doc.createElement('div'); n.className = cls; n.textContent = text; parent.append(n); return n; };
      add(meta, 'ai-name', r.name);
      add(meta, 'ai-answer', r.answer);
      if (r.detail) add(meta, 'ai-detail', r.detail);
      const rate = r.rate == null ? 0 : r.rate;
      const bar = doc.createElement('div');
      bar.className = 'match-bar';
      bar.innerHTML = '<span></span>';
      bar.firstChild.style.width = `${rate}%`;
      meta.append(bar);
      div.append(meta);
      add(div, 'ai-match', r.rate == null ? '—' : `${r.rate}%`);
      return div;
    }

    Object.entries(buttons).forEach(([position, b]) => {
      b.addEventListener('click', () => onChoose({ optionId: b.dataset.optionId, position }));
    });
    doc.addEventListener('keydown', (e) => {
      const position = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : null;
      if (!position || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (el.overlay.classList.contains('is-visible') || buttons[position].disabled) return;
      buttons[position].click();
    });

    return {
      onChoose(fn) { onChoose = fn; },
      onNext(fn) { el.next.addEventListener('click', fn); },
      onRestart(fn) { el.restart.addEventListener('click', fn); },

      renderQuestion(vm) {
        el.progress.textContent = vm.progress;
        el.progress.setAttribute('aria-label', vm.progressLabel);
        el.number.textContent = vm.number;
        el.title.textContent = vm.title;
        el.body.textContent = vm.body;
        el.note.textContent = vm.note;
      },
      renderChoices({ left, right }) { renderChoice('left', left); renderChoice('right', right); },
      lockChoices(selectedOptionId) {
        Object.values(buttons).forEach((b) => {
          const on = b.dataset.optionId === selectedOptionId;
          b.disabled = true;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-pressed', String(on));
        });
      },

      showResult(vm) {
        el.kicker.textContent = vm.kicker;
        el.resultTitle.textContent = vm.title;
        el.selected.textContent = vm.selected;
        el.cmpTitle.textContent = vm.comparisonTitle;
        el.cmpNote.textContent = vm.comparisonNote;
        el.list.replaceChildren(...vm.rows.map((r) => row(r, vm.isSummary)));
        el.disclaimer.textContent = vm.disclaimer;
        el.next.hidden = vm.primaryLabel == null;
        if (vm.primaryLabel != null) el.next.textContent = vm.primaryLabel;
        el.restart.textContent = vm.restartLabel;
        el.overlay.classList.add('is-visible');
        el.overlay.setAttribute('aria-hidden', 'false');
        (el.next.hidden ? el.restart : el.next).focus({ preventScroll: true });
      },
      hideResult() {
        el.overlay.classList.remove('is-visible');
        el.overlay.setAttribute('aria-hidden', 'true');
      },
    };
  }

  root.AppView = { create };
})(window);
