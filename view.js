/* 表示データの描画、入力イベント、フォーカスを管理する。 */
(function (root) {
  'use strict';
  function create(doc) {
    const $ = id => doc.getElementById(id);
    const buttons = {left:doc.querySelector('.choice-left'),right:doc.querySelector('.choice-right')};
    const overlays = [...doc.querySelectorAll('.result-overlay')];
    const activeOverlay = () => $('optionsOverlay').classList.contains('is-visible') ? $('optionsOverlay') : overlays.find(o => o.classList.contains('is-visible'));
    const visibleFocusables = element => [...element.querySelectorAll('button:not(:disabled), input, select, summary, [tabindex="0"]')].filter(n => n.getClientRects().length && !n.closest('[hidden]'));
    let onChoose = () => {}, onModelSelect = () => {}, optionsFocus = null;
    const node = (tag,cls,text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    const append = (parent,tag,cls,text) => { const n = node(tag,cls,text); parent.append(n); return n; };
    function syncModal() {
      const top = activeOverlay();
      $('appMain').inert = Boolean(top);
      doc.body.classList.toggle('modal-open',Boolean(top));
      overlays.forEach(o => { o.inert = o !== top; o.setAttribute('aria-hidden',String(o !== top)); });
    }
    function setOverlay(o,on) { o.classList.toggle('is-visible',on); syncModal(); }
    function focusHeading() { $('questionTitle').focus({preventScroll:true}); $('questionTitle').scrollIntoView({block:'start'}); }
    function closeOptions() {
      setOverlay($('optionsOverlay'),false);
      if (optionsFocus && optionsFocus.isConnected && !optionsFocus.closest('[inert]')) optionsFocus.focus({preventScroll:true});
      else if (activeOverlay()) activeOverlay().querySelector('.result-panel').focus({preventScroll:true});
    }
    function row(r) {
      const item = node('div',`comparison-row${r.top ? ' is-top' : ''}`);
      const meta = append(item,'div'); const title = append(meta,'div','ai-name',r.name);
      if (r.badge) append(title,'span','ai-badge',r.badge);
      append(meta,'div','ai-answer',r.answer); append(meta,'div','ai-detail',r.detail);
      const bar = append(meta,'div','match-bar'); bar.setAttribute('aria-hidden','true');
      append(bar,'span').style.width = `${r.rate == null ? 0 : r.rate}%`;
      append(item,'div','ai-match',r.rate == null ? '未比較' : `${r.rate}%`);
      return item;
    }
    function evidenceCard(e) {
      const card = node('article','evidence-card');
      append(card,'h4','',`${e.id} ${e.title}`);
      append(card,'p','evidence-body',e.body);
      e.options.forEach(o => append(card,'p','evidence-option',o));
      append(card,'p','evidence-mine',`あなた：${e.mine}`);
      append(card,'p','',`${e.modelName}：${e.counts}`);
      append(card,'p','',`代表回答：${e.representative}`);
      append(card,'p','',`あなたの選択と一致する有効回答の割合：${e.agreement}`);
      if (e.reason) append(card,'p','',`保存された選択後の説明：${e.reason}`);
      return card;
    }
    function detail(parent,title) { const d = append(parent,'details','profile-details'); append(d,'summary','',title); return d; }
    function renderProfile(vm) {
      const host = $('profileSection'); host.replaceChildren(); host.hidden = !vm;
      if (!vm) return;
      const head = append(host,'div','profile-heading');
      append(head,'h3','','6つの観点から振り返る');
      const label = append(head,'label','model-picker','比較するAI '); label.htmlFor = 'profileModel';
      const select = append(label,'select'); select.id = 'profileModel';
      vm.models.forEach(m => { const o = append(select,'option','',m.name); o.value = m.id; }); select.value = vm.selectedModelId;
      select.addEventListener('change',() => onModelSelect(select.value));
      append(host,'p','profile-guide','この10問での選び方を6つの観点で振り返ります。数値の高さは、良し悪しを表しません。');
      const grid = append(host,'div','profile-grid');
      vm.axes.forEach(axis => {
        const card = append(grid,'article','axis-card');
        append(card,'h4','',axis.name); append(card,'p','axis-note',axis.note);
        [['あなた',axis.mine,'mine'],[vm.modelName,axis.ai,'model']].forEach(([name,value,type]) => {
          const group = append(card,'div',`axis-series axis-${type}`);
          append(group,'span','axis-label',name); append(group,'strong','axis-value',value == null ? '未算出' : String(value));
          const track = append(group,'div','axis-track'); track.setAttribute('aria-hidden','true');
          append(track,'span').style.width = `${value == null ? 0 : value}%`;
        });
        append(card,'p','axis-source',axis.ids.join('・'));
      });
      append(host,'p','profile-guide','「本人の意思への反応」「関係性への反応」の50は、2場面で判断の変化がなかったことを示します。AIでは各場面のA選択率の差であり、同じ個体が考えを変えた割合ではありません。');
      const narrative = append(host,'section','profile-narrative'); append(narrative,'h3','','今回の回答から');
      append(narrative,'p','',vm.narrative.common); append(narrative,'p','',vm.narrative.difference);
      const explanation = detail(narrative,'どの回答から分かる？');
      vm.evidence.filter(e => vm.narrative.evidenceIds.includes(e.id)).forEach(e => explanation.append(evidenceCard(e)));
      vm.pairs.forEach(pair => {
        const section = append(host,'section','pair-note'); append(section,'h4','',`${pair.title}（${pair.ids.join('・')}）`); append(section,'p','',pair.text);
      });
      const all = detail(host,'全10問の回答を詳しく見る');
      vm.evidence.forEach(e => all.append(evidenceCard(e)));
      const method = detail(host,'結果の見方と比較方法');
      append(method,'p','','各問の結果は、AIの代表回答との一致・不一致を100%／0%で示します。全体の選択一致度は、AIの回答のばらつきも含めて、あなたと同じ選択をした割合を10問で平均したものです。表示は整数に丸め、最も近いAIの判定には丸め前の値を使います。小さな差は決定的な相性差を示しません。');
      append(method,'p','','AIの割合は有効回答内の割合です。代表回答は多数側を採用し、同数ならA/B拮抗として片側を選びません。全10問の有効回答がそろわないモデルは総合順位の対象外です。');
      append(method,'p','','以下では、原稿のAを選ぶとa=1、Bを選ぶとa=0です。AIにはAの選択率を代入します。6軸は独立した性格因子ではなく、総合点や平均点は作りません。');
      const list = append(method,'ul','formula-list'); vm.axes.forEach(a => append(list,'li','',`${a.name}：${a.formula}`));
      const sourceDetails = detail(method,'AI回答の出典と条件');
      append(sourceDetails,'p','',vm.metadata); append(sourceDetails,'p','',vm.collectionMethod);
    }
    function renderResult(vm) {
      $('resultKicker').textContent = vm.kicker; $('resultTitle').textContent = vm.title; $('resultSelected').textContent = vm.selected;
      $('comparisonTitle').textContent = vm.comparisonTitle; $('comparisonNote').textContent = vm.comparisonNote;
      $('comparisonList').replaceChildren(...vm.rows.slice(0,5).map(row));
      if (vm.rows.length > 5) {
        const more = detail($('comparisonList'),`残りの${vm.rows.length-5}モデルを見る`);
        vm.rows.slice(5).forEach(r => more.append(row(r)));
      } $('comparisonSection').hidden = !vm.rows.length;
      const source = vm.source || (vm.profile && vm.profile.source);
      $('dataNotice').hidden = !source; $('dataNotice').textContent = source || '';
      renderProfile(vm.profile);
      $('resultDisclaimer').textContent = vm.disclaimer;
      $('nextAction').hidden = vm.primaryLabel == null; $('nextButton').hidden = vm.primaryLabel == null; $('nextButton').textContent = vm.primaryLabel || '';
      $('restartButton').textContent = vm.restartLabel; $('homeButton').hidden = !vm.isSummary;
      $('resultOverlay').classList.toggle('is-summary',vm.isSummary);
    }
    Object.entries(buttons).forEach(([position,b]) => b.addEventListener('click',() => {
      if (!activeOverlay() && !b.disabled) onChoose({optionId:b.dataset.optionId,position});
    }));
    $('optionsClose').addEventListener('click',closeOptions);
    doc.addEventListener('keydown',e => {
      const top = activeOverlay();
      if (e.key === 'Escape' && top === $('optionsOverlay')) { e.preventDefault(); closeOptions(); return; }
      if (e.key === 'Tab' && top) {
        const focusable = visibleFocusables(top), first = focusable[0], last = focusable[focusable.length-1];
        if (!first) { e.preventDefault(); top.querySelector('.result-panel').focus(); return; }
        if (e.shiftKey && (doc.activeElement === first || !focusable.includes(doc.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (doc.activeElement === last || !focusable.includes(doc.activeElement))) { e.preventDefault(); first.focus(); }
        return;
      }
      const position = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : null;
      if (!position || top || e.repeat || e.altKey || e.ctrlKey || e.metaKey || buttons[position].disabled || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      e.preventDefault(); buttons[position].click();
    });
    syncModal();
    const bind = (id,fn) => $(id).addEventListener('click',fn);
    return {
      onChoose(fn) { onChoose = fn; }, onModelSelect(fn) { onModelSelect = fn; },
      onNext(fn) { bind('nextButton',fn); }, onRestart(fn) { bind('restartButton',fn); }, onHome(fn) { bind('homeButton',fn); },
      onStart(fn) { bind('startButton',fn); }, onStartRestart(fn) { bind('startRestartButton',fn); }, onSkip(fn) { bind('skipButton',fn); },
      bindOptions(getSettings,fn) {
        [$('optionsButton'), ...doc.querySelectorAll('[data-open-options]')].forEach(button => button.addEventListener('click',() => {
          optionsFocus = doc.activeElement; $('skipToggle').checked = getSettings().skipAnimation;
          setOverlay($('optionsOverlay'),true); $('skipToggle').focus({preventScroll:true});
        }));
        $('skipToggle').addEventListener('change',() => fn($('skipToggle').checked));
      },
      setInstructions(text) { $('startInstructions').textContent = text; $('commonInstructions').textContent = text; },
      renderQuestion(vm,{focus = false} = {}) {
        $('progressPill').textContent = vm.progress; $('progressPill').setAttribute('aria-label',vm.progressLabel);
        $('questionNumber').textContent = vm.number; $('questionTitle').textContent = vm.title; $('questionBody').textContent = vm.body; $('questionNote').textContent = vm.note;
        if (focus) focusHeading();
      },
      renderChoices(choices) {
        Object.entries(buttons).forEach(([position,b]) => {
          const vm = choices[position]; b.dataset.optionId = vm.optionId; b.disabled = false; b.classList.remove('is-selected'); b.setAttribute('aria-pressed','false');
          b.setAttribute('aria-label',`画面${position === 'left' ? '左' : '右'}側、選択肢${vm.code}：${vm.text}`);
          b.querySelector('.choice-copy strong').textContent = vm.text; b.querySelector('.choice-copy small').textContent = `選択肢 ${vm.code}`;
        });
      },
      lockChoices(optionId) { Object.values(buttons).forEach(b => { b.disabled = true; b.classList.toggle('is-selected',b.dataset.optionId === optionId); b.setAttribute('aria-pressed',String(b.dataset.optionId === optionId)); }); },
      showStart(vm) {
        doc.body.classList.add('is-start'); $('startButton').textContent = vm.primaryLabel; $('startRestartButton').hidden = !vm.canRestart;
        $('restoreNotice').hidden = !vm.notice; $('restoreNotice').textContent = vm.notice || '';
        setOverlay($('startOverlay'),true); $('startOverlay').querySelector('.result-panel').scrollTop = 0;
        $('startTitle').setAttribute('tabindex','-1'); $('startTitle').focus({preventScroll:true});
      },
      hideStart() { doc.body.classList.remove('is-start'); setOverlay($('startOverlay'),false); },
      showResult(vm) { renderResult(vm); setOverlay($('resultOverlay'),true); $('resultOverlay').querySelector('.result-panel').scrollTop = 0; $('resultTitle').focus({preventScroll:true}); },
      updateSummary(vm) { const panel = $('resultOverlay').querySelector('.result-panel'), scroll = panel.scrollTop; renderResult(vm); panel.scrollTop = scroll; $('profileModel').focus({preventScroll:true}); },
      hideResult() { setOverlay($('resultOverlay'),false); },
      focusQuestion:focusHeading,
    };
  }
  root.AppView = { create };
})(window);
