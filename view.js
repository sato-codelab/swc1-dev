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
      list: $('comparisonList'), disclaimer: $('resultDisclaimer'), next: $('nextButton'), restart: $('restartButton'), home: $('homeButton'),
      start: $('startOverlay'), startBtn: $('startButton'), startRestart: $('startRestartButton'),
      options: $('optionsOverlay'), optionsBtn: $('optionsButton'), optionsClose: $('optionsClose'), skipToggle: $('skipToggle'), skip: $('skipButton'),
    };
    const buttons = { left: doc.querySelector('.choice-left'), right: doc.querySelector('.choice-right') };
    const side = { left: '左', right: '右' };
    const arrow = { left: '←', right: '→' };
    const overlays = [...doc.querySelectorAll('.result-overlay')];
    let onChoose = () => {};
    let lastFocus = null;

    const anyOpen = () => overlays.some((o) => o.classList.contains('is-visible'));
    const setOverlay = (o, on) => { o.classList.toggle('is-visible', on); o.setAttribute('aria-hidden', String(!on)); };

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
      div.className = `comparison-row${isSummary ? ' comparison-row-summary' : ''}${r.top ? ' is-top' : ''}`;
      const meta = doc.createElement('div');
      const add = (parent, cls, text) => { const n = doc.createElement('div'); n.className = cls; n.textContent = text; parent.append(n); return n; };
      const name = add(meta, 'ai-name', r.name);
      if (r.badge) { const b = doc.createElement('span'); b.className = 'ai-badge'; b.textContent = r.badge; name.append(b); }
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

    function openOptions(settings) {
      lastFocus = doc.activeElement;
      el.skipToggle.checked = settings.skipAnimation;
      setOverlay(el.options, true);
      el.skipToggle.focus({ preventScroll: true });
    }
    function closeOptions() {
      setOverlay(el.options, false);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    Object.entries(buttons).forEach(([position, b]) => {
      b.addEventListener('click', () => onChoose({ optionId: b.dataset.optionId, position }));
    });
    el.optionsClose.addEventListener('click', closeOptions);
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.options.classList.contains('is-visible')) { closeOptions(); return; }
      const position = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : null;
      if (!position || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (anyOpen() || buttons[position].disabled) return;
      buttons[position].click();
    });

    return {
      onChoose(fn) { onChoose = fn; },
      onNext(fn) { el.next.addEventListener('click', fn); },
      onRestart(fn) { el.restart.addEventListener('click', fn); },
      onHome(fn) { el.home.addEventListener('click', fn); },
      onStart(fn) { el.startBtn.addEventListener('click', fn); },
      onStartRestart(fn) { el.startRestart.addEventListener('click', fn); },
      onSkip(fn) { el.skip.addEventListener('click', fn); },
      /** fn(checked) is called when the skip-animation switch changes; getSettings() supplies the current values. */
      bindOptions(getSettings, fn) {
        el.optionsBtn.addEventListener('click', () => openOptions(getSettings()));
        el.skipToggle.addEventListener('change', () => fn(el.skipToggle.checked));
      },

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

      showStart(vm) {
        doc.body.classList.add('is-start');
        el.startBtn.textContent = vm.primaryLabel;
        el.startRestart.hidden = !vm.canRestart;
        setOverlay(el.start, true);
        el.startBtn.focus({ preventScroll: true });
      },
      hideStart() { doc.body.classList.remove('is-start'); setOverlay(el.start, false); },

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
        el.home.hidden = !vm.isSummary;
        setOverlay(el.overlay, true);
        (el.next.hidden ? el.restart : el.next).focus({ preventScroll: true });
      },
      hideResult() { setOverlay(el.overlay, false); },
    };
  }

  root.AppView = { create };
})(window);
