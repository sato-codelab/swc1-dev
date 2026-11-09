/* トロッコの演出を管理する。回答の保存や採点は行わない。 */
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
    const scene = $('scene'), stage = $('trolleyStage'), impact = $('impactEffect'), status = $('sceneStatus');
    const sparks = { left: $('sparkLeft'), right: $('sparkRight') };
    const targets = { left: $('targetLeft'), right: $('targetRight') };
    const clock = root.AppPlaybackClock.create();
    let pausedAnimations = [];
    let pendingDone = null;
    let generation = 0;

    const later = (fn, ms) => clock.later(fn, ms);
    const cancel = () => {
      generation += 1; clock.cancel(); pendingDone = null;
      pausedAnimations.forEach(animation => { if(animation.playState === 'paused') animation.play(); }); pausedAnimations = [];
      scene.classList.remove('is-playing', 'is-paused');
    };
    const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

    ['left', 'right'].forEach((dir) => {
      sparks[dir].replaceChildren(...Array.from({ length: 4 }, () => {
        const s = doc.createElement('span');
        s.className = 'spark';
        if (dir === 'right') s.style.transform = 'scaleX(-1)';
        return s;
      }));
    });

    function calm({keepTargets = false} = {}) {
      scene.classList.remove('is-choice-left', 'is-choice-right', 'is-sprinting', 'is-impact');
      if(!keepTargets)Object.values(targets).forEach(t=>t.classList.remove('is-launched')); 
      stage.classList.remove('tilt-left', 'tilt-right');
      impact.classList.remove('active');
      sparks.left.classList.remove('animate-sparks');
      sparks.right.classList.remove('animate-sparks');
    }

    function finish() {
      scene.classList.remove('is-playing');
      const fn = pendingDone; pendingDone = null;
      if (fn) fn();
    }

    return {
      cancel,
      pause() {
        if (clock.paused) return;
        clock.pause();
        void scene.offsetWidth;
        pausedAnimations = scene.getAnimations ? scene.getAnimations({subtree:true}).filter(a => a.playState === 'running') : [];
        pausedAnimations.forEach(a => a.pause());
        scene.classList.add('is-paused');
      },
      resume() {
        scene.classList.remove('is-paused');
        pausedAnimations.forEach(a => { if (a.playState === 'paused') a.play(); });
        pausedAnimations = []; clock.resume();
      },
      /** Ends a running choice animation immediately and shows the result. */
      skip() {
        if (!pendingDone) return;
        const done = pendingDone;
        cancel();
        pendingDone = done;
        scene.classList.add('is-skipping');
        calm();
        status.textContent = TEXT.settled;
        finish();
      },
      setTheme(theme) {
        [...scene.classList].filter((c) => c.startsWith('question-type-')).forEach((c) => scene.classList.remove(c));
        scene.classList.add(`question-type-${theme || 'neutral'}`);
      },
      /** labels: { left: 'A', right: 'B' } – badge text shown on each choice marker */
      setTargets(labels) {
        Object.entries(targets).forEach(([pos, t]) => { t.querySelector('.target-badge').textContent = labels[pos] || ''; });
      },
      reset() {
        cancel();
        pendingDone = null;
        scene.classList.add('is-skipping');
        calm();
        void scene.offsetWidth;
        scene.classList.remove('is-playing', 'is-skipping');
        scene.classList.add('is-running');
        status.textContent = TEXT.idle;
      },
      /** Plays the choice animation; calls onDone when the result may be shown. */
      playChoice(position, onDone, { instant = false } = {}) {
        cancel();
        calm();
        pendingDone = onDone;
        scene.classList.add('is-playing');
        if (instant) { scene.classList.add('is-skipping'); later(finish, 200); return; }
        // CSS slides the chosen figure to the track centre and zooms around the centre line, so the rails stay under the wheels.
        scene.classList.add('is-playing', position === 'left' ? 'is-choice-left' : 'is-choice-right', 'is-sprinting');
        stage.classList.add(position === 'left' ? 'tilt-left' : 'tilt-right');
        retrigger(sparks[position], 'animate-sparks');
        status.textContent = TEXT.sprint;
        later(() => { scene.classList.add('is-impact'); targets[position].classList.add('is-launched'); retrigger(impact, 'active'); status.textContent = TEXT.impact; }, TIMINGS.impact);
        later(() => { calm({keepTargets:true}); status.textContent = TEXT.settled; }, TIMINGS.settle);
        later(finish, TIMINGS.done);
      },
    };
  }

  root.AppScene = { create };
})(window);
