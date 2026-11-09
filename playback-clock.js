/* 残り時間を保持して停止・再開できるタイマー。取消後のコールバックは無効にする。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AppPlaybackClock=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function create({now=()=>Date.now(),schedule=setTimeout,unschedule=clearTimeout}={}) {
    const jobs=new Set();let paused=false,generation=0;
    function arm(job){job.started=now();const token=generation;job.handle=schedule(()=>{if(token!==generation||paused||!jobs.has(job))return;jobs.delete(job);job.fn();},job.remaining);}
    return {
      later(fn,ms){const job={fn,remaining:ms};jobs.add(job);if(!paused)arm(job);},
      pause(){if(paused)return;paused=true;generation++;jobs.forEach(job=>{unschedule(job.handle);job.remaining=Math.max(0,job.remaining-(now()-job.started));});},
      resume(){if(!paused)return;paused=false;jobs.forEach(arm);},
      cancel(){generation++;jobs.forEach(job=>unschedule(job.handle));jobs.clear();paused=false;},
      get paused(){return paused;},
    };
  }
  return {create};
});
