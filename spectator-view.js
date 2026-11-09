/* 観戦設定と再生状態を描画する。診断の回答入力には接続しない。 */
(function(root){'use strict';
  function create({doc,view,core,models,modelData,preview}) {
    const $=id=>doc.getElementById(id),on={};let lastQuestion=null,lastEntry=null,scoped=false,rosterKey='',streamKey='',streamFinished=false,diagnosisNumber=1,rosterQuestion=null;
    const stream=root.AppTextReplay.create();
    const cards=new Map();
    function node(tag,text,cls){const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
    const source=models.some(m=>m.sourceType==='mock')?'サンプルAIの記録済み回答を再生します。実在するAIの測定結果ではありません。':'取得済みのAI回答を再生します。ここで新しい回答を生成することはありません。';
    models.forEach(m=>{const label=node('label',null,'spectator-check'),input=node('input');input.type='checkbox';input.value=m.id;input.name='spectatorModel';label.append(input,node('span',m.name));$('spectatorModels').append(label);});
    models.forEach(m=>{
      const section=node('section',null,'spectator-answer');section.append(node('strong',m.name),node('p',m.sourceType==='mock'?'架空のサンプル回答です。':`モデル版：${m.modelVersion} ／ プロンプト版：${m.systemPromptVersion} ／ 取得日時：${m.collectedAt||'未記録'}`),node('p',m.collectionMethod||'取得条件は未記録です。'));$('spectatorSources').append(section);
    });
    doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('spectatorConfig').classList.contains('is-visible')&&!$('optionsOverlay').classList.contains('is-visible')){e.preventDefault();on.close?.();}});
    const checks=()=>[...$('spectatorModels').querySelectorAll('input')];
    const read=()=>({modelIds:checks().filter(i=>i.checked).map(i=>i.value),mode:$('spectatorMode').value,order:$('spectatorOrder').value,filter:$('spectatorFilter').value,autoplay:$('spectatorAuto').checked});
    function refresh(){const config=read(),plan=preview(config);
      $('spectatorOrder').disabled=config.mode==='fast';
      [...$('spectatorFilter').options].forEach(o=>{o.disabled=['match','different'].includes(o.value)?!plan.answered:['split','unanimous'].includes(o.value)?config.modelIds.length<2:false;});
      $('spectatorCount').textContent=plan.reason||`${plan.questionIds.length}問・${plan.selection.length}モデル・${plan.entries.length}回答（${plan.queue.length}ステップ）`;
      $('spectatorBegin').disabled=!plan.queue.length;
      $('spectatorPersonal').textContent=`あなたとの比較対象：回答済み ${plan.answered} / ${core.QUESTIONS.length}問。未回答は一致・不一致に含めません。`;
      $('spectatorDiagnose').hidden=plan.answered>0;
      $('spectatorClearFilter').hidden=config.filter==='all';
    }
    $('spectatorConfig').addEventListener('change',refresh);
    $('spectatorClearFilter').addEventListener('click',()=>{$('spectatorFilter').value='all';refresh();});
    const actions={spectatorBegin:()=>on.begin?.(read()),spectatorConfigClose:()=>on.close?.(),spectatorDiagnose:()=>on.diagnose?.(),spectatorPlay:()=>on.toggle?.(),spectatorPrevious:()=>on.previous?.(),spectatorNext:()=>on.next?.(),spectatorSkip:()=>on.skip?.(),spectatorConfigure:()=>on.configure?.(),spectatorEnd:()=>on.end?.()};
    Object.entries(actions).forEach(([id,fn])=>$(id).addEventListener('click',fn));
    function table(plan,q){
      const targetIds=new Set(plan.entries.filter(e=>e.questionId===q.id).map(e=>e.modelId));
      $('spectatorTable').replaceChildren();let a=0,b=0;
      plan.questionRows[q.id].forEach(r=>{
        const option=core.findOption(q,r.optionId),item=node('div',null,'spectator-answer');
        if(targetIds.has(r.modelId)&&option){if(option.code==='A')a++;else b++;}
        item.append(node('strong',r.modelName),node('span',option?`${option.code}（${option.code==='A'?'左':'右'}）：${option.text}`:r.status==='available'?'A/B拮抗・代表回答なし':'回答なし'));
        item.append(node('small',`${targetIds.has(r.modelId)?'観戦対象':'今回の絞り込み対象外'} ／ ${r.match===null?'あなたとは未比較':r.match?'あなたと一致':'あなたと不一致'}`));
        if(r.reason)item.append(node('p',`保存された説明：${r.reason}`));
        $('spectatorTable').append(item);
      });
      $('spectatorDistribution').textContent=`観戦対象の代表回答：左A ${a}モデル ／ 右B ${b}モデル`;
    }
    function roster(plan,q,entry,phase,state,fast) {
      const key=plan.selection.map(m=>m.id).join('/');
      if(key!==rosterKey){
        $('modelDock').replaceChildren();cards.clear();rosterKey=key;
        plan.selection.forEach(m=>{
          const card=node('section',null,'model-card'),name=node('strong',m.name,'model-card-name'),choice=node('span','','model-card-choice'),bubble=node('p','','model-bubble');
          bubble.hidden=true;card.append(name,choice,bubble);$('modelDock').append(card);cards.set(m.id,{card,choice,bubble});
        });
      }
      const eventKey=q.id+'/'+(fast?'fast':entry.modelId);
      if(streamKey!==eventKey)stream.cancel(true);
      if(rosterQuestion!==q.id){rosterQuestion=q.id;cards.forEach(({card,choice,bubble})=>{card.classList.remove('answer-a','answer-b');choice.textContent='';bubble.hidden=true;bubble.textContent='';});}
      if(streamKey!==eventKey){streamFinished=false;streamKey=eventKey;
        if(!fast){const item=cards.get(entry.modelId);item.card.classList.remove('answer-a','answer-b');item.choice.textContent='';item.bubble.hidden=true;}
        $('modelRider').classList.remove('is-boarding');void $('modelRider').offsetWidth;$('modelRider').classList.add('is-boarding');
      }
      cards.forEach(({card},id)=>card.classList.toggle('is-active',!fast&&entry.modelId===id));
      $('modelRider').hidden=fast;$('modelRider').textContent=fast?'':entry.modelName;
      if(phase==='result'&&!streamFinished){
        streamFinished=true;
        const entries=fast?entry.entries:[entry];
        entries.forEach(item=>{
          const {card,choice,bubble}=cards.get(item.modelId),code=core.optionCode(q,item.optionId);
          card.classList.add(code==='A'?'answer-a':'answer-b');choice.textContent=code;bubble.hidden=false;
          if(!item.reason){bubble.textContent='この回答の理由は記録されていません。';return;}
          bubble.setAttribute('aria-label',`記録済みの説明：${item.reason}`);bubble.setAttribute('aria-live','off');
          if(fast||root.matchMedia?.('(prefers-reduced-motion: reduce)').matches){bubble.textContent=item.reason;return;}
          stream.show(item.reason,text=>{bubble.textContent=text;});
        });
      }
      if(state==='paused')stream.pause();else stream.resume();
    }
    return {
      bind(handlers){Object.assign(on,handlers);},
      open(config){checks().forEach(i=>{i.checked=config.modelIds.includes(i.value);});$('spectatorMode').value=config.mode;$('spectatorOrder').value=config.order;$('spectatorFilter').value=config.filter;$('spectatorAuto').checked=config.autoplay;$('spectatorSource').textContent=source;refresh();view.openPanel('spectatorConfig');$('spectatorConfigTitle').focus({preventScroll:true});},
      close(){view.closePanel('spectatorConfig');},
      active(on,{scoped:scope=false,number=1}={}){scoped=scope;diagnosisNumber=number;stream.cancel();streamKey='';rosterKey='';rosterQuestion=null;$('modelDock').hidden=!on;$('modelRider').hidden=true;$('spectatorConfigure').hidden=scope;$('spectatorEnd').textContent=scope?'診断の次の問題へ':'観戦を終了';$('spectatorHud').hidden=!on;doc.body.classList.toggle('is-spectating',on);lastQuestion=null;lastEntry=null;},
      frame({plan,index,state,phase,entry,seenQuestionIds=[]}){
        const q=core.QUESTIONS.find(q=>q.id===entry.questionId),fast=plan.config.mode==='fast';
        const vm=root.AppPresenter.question(q,scoped?diagnosisNumber-1:core.QUESTIONS.indexOf(q),core.QUESTIONS.length);vm.note='AIの記録済み回答を再生しています。あなたの診断回答は変更されません。';if(lastEntry!==entry)view.renderQuestion(vm);
        const p=core.createPlacement(q);if(lastEntry!==entry)view.renderChoices({left:root.AppPresenter.choice(core.findOption(q,p.left)),right:root.AppPresenter.choice(core.findOption(q,p.right))});
        lastEntry=entry;
        roster(plan,q,entry,phase,state,fast);
        view.renderProgress({index:plan.questionIds.indexOf(q.id),answered:plan.questionIds.map(id=>seenQuestionIds.includes(id)),labels:plan.questionIds.map(id=>scoped?diagnosisNumber:core.QUESTIONS.findIndex(q=>q.id===id)+1)});
        if(fast){const left=entry.entries.filter(e=>e.optionId===p.left).length,right=entry.entries.filter(e=>e.optionId===p.right).length;view.setChoiceHints({left:`選択肢 A · 対象${left}モデル`,right:`選択肢 B · 対象${right}モデル`});}
        view.lockChoices(!fast&&phase!=='intro'?entry.optionId:null);
        if(lastQuestion!==q.id){table(plan,q);lastQuestion=q.id;$('spectatorComparison').open=false;}
        $('spectatorStatus').textContent=`${fast?'AIの回答をまとめて比較':entry.modelName} · 第${scoped?diagnosisNumber:core.QUESTIONS.indexOf(q)+1}問 · ${state==='paused'?'一時停止中':state==='ready'?'操作待ち':phase==='intro'?'回答を再生します':phase==='animation'?'再生中':'回答の比較'}`;
        $('spectatorPosition').textContent=`${index+1} / ${plan.queue.length}${fast?'問':'回答'}${fast?'':` · AI ${plan.selection.findIndex(m=>m.id===entry.modelId)+1} / ${plan.selection.length}`}`;
        $('spectatorNotice').textContent='記録済み回答の再生です。サンプルAIを含みます。';
        $('spectatorPlay').textContent=state==='playing'?'一時停止':state==='paused'?'再開':phase==='result'?'次を再生':'再生';
        $('spectatorPrevious').disabled=index===0;$('spectatorNext').textContent=index+1===plan.queue.length?(scoped?'診断の次の問題へ':'結果を見る'):'次へ';
        $('spectatorSkip').hidden=fast;$('spectatorSkip').disabled=phase==='result';
        $('spectatorChoice').textContent=fast?'左右の回答数と各AIの選択を比較できます。':phase==='intro'?'記録された代表回答を再生します。':`${core.findOption(q,entry.optionId).code}：${core.findOption(q,entry.optionId).text}（${entry.match===null?'あなたとは未比較':entry.match?'あなたと一致':'あなたと不一致'}）`;
      },
      focus(){$('spectatorPlay').focus({preventScroll:true});},
    };
  }
  root.AppSpectatorView={create};
})(window);
