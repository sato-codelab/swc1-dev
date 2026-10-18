/* Trolley scene: animation + theme only. Knows nothing about questions or answers. */
(function (root) {
  'use strict';

  const TIMINGS = { impact: 950, settle: 1700, done: 2200 };
  const TEXT = {
    idle: 'ガタン、ゴトン……トロッコは原っぱを進んでいます',
    sprint: '選択を受けて、草原と線路が揺れています',
    impact: 'ガタンッ！ 大きな揺れを越えました',
    settled: '揺れが収まりました',
  };

  function create(doc) {
    const $ = (id) => doc.getElementById(id);
    const scene = $('scene'), world = $('worldLayer'), stage = $('trolleyStage'), impact = $('impactEffect'), status = $('sceneStatus');
    const sparks = { left: $('sparkLeft'), right: $('sparkRight') };
    const targets = { left: $('targetLeft'), right: $('targetRight') };
    let timers = [];

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const cancel = () => { timers.forEach(clearTimeout); timers = []; };
    const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

    ['left', 'right'].forEach((dir) => {
      sparks[dir].replaceChildren(...Array.from({ length: 4 }, () => {
        const s = doc.createElement('span');
        s.className = 'spark';
        if (dir === 'right') s.style.transform = 'scaleX(-1)';
        return s;
      }));
    });

    function calm() {
      scene.classList.remove('is-choice-left', 'is-choice-right', 'is-sprinting', 'is-impact');
      stage.classList.remove('tilt-left', 'tilt-right');
      impact.classList.remove('active');
      sparks.left.classList.remove('animate-sparks');
      sparks.right.classList.remove('animate-sparks');
    }

    return {
      cancel,
      setTheme(theme) {
        [...scene.classList].filter((c) => c.startsWith('question-type-')).forEach((c) => scene.classList.remove(c));
        scene.classList.add(`question-type-${theme || 'neutral'}`);
      },
      /** labels: { left: 'A', right: 'B' } – badge text shown on each collision target */
      setTargets(labels) {
        Object.entries(targets).forEach(([pos, t]) => { t.querySelector('.target-badge').textContent = labels[pos] || ''; });
      },
      reset() {
        cancel();
        calm();
        scene.classList.add('is-running');
        status.textContent = TEXT.idle;
      },
      /** Plays the choice animation; calls onDone when the result may be shown. */
      playChoice(position, onDone) {
        // Zoom toward the centre of the chosen target (focus of expansion) while sliding it toward the cart.
        const t = targets[position];
        const ox = t.offsetLeft + t.offsetWidth / 2, oy = t.offsetTop + t.offsetHeight / 2;
        world.style.transformOrigin = `${ox}px ${oy}px`;
        world.style.setProperty('--shift', `${(world.offsetWidth / 2 - ox) * 0.85}px`);
        scene.classList.add(position === 'left' ? 'is-choice-left' : 'is-choice-right', 'is-sprinting');
        stage.classList.add(position === 'left' ? 'tilt-left' : 'tilt-right');
        retrigger(sparks[position], 'animate-sparks');
        status.textContent = TEXT.sprint;
        later(() => { scene.classList.add('is-impact'); retrigger(impact, 'active'); status.textContent = TEXT.impact; }, TIMINGS.impact);
        later(() => { calm(); status.textContent = TEXT.settled; }, TIMINGS.settle);
        later(onDone, TIMINGS.done);
      },
    };
  }

  root.AppScene = { create };
})(window);
