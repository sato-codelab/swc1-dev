/* 保存された説明を文字送りで表示する。内容の生成や補完は行わない。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./playback-clock'):root.AppPlaybackClock);if(typeof module==='object'&&module.exports)module.exports=api;else root.AppTextReplay=api;})(typeof globalThis!=='undefined'?globalThis:this,function(clocks){
  function create(clock=clocks.create()){
    let text='',render=null;
    function cancel(finish=false){clock.cancel();if(finish&&render)render(text);render=null;}
    return {
      show(value,write,{instant=false}={}){cancel();text=typeof value==='string'?value:'';render=write;const chars=Array.from(text);let count=0;write(instant?text:'');if(instant||!chars.length)return;function tick(){write(chars.slice(0,++count).join(''));if(count<chars.length)clock.later(tick,35);}tick();},
      pause:()=>clock.pause(),resume:()=>clock.resume(),cancel,
    };
  }
  return {create};
});
