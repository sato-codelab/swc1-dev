'use strict';
const assert = require('node:assert/strict');
const core = require('../app-core.js');
assert.equal(core.QUESTION_VERSION, '2.0');
assert.equal(core.QUESTIONS.length, 10);
assert.deepEqual(core.QUESTIONS.map(q => q.id), Array.from({length:10},(_,i)=>`Q${String(i+1).padStart(2,'0')}`));
for (const q of core.QUESTIONS) {
  assert.equal(q.options.length, 2);
  assert.deepEqual(q.options.map(x=>x.code), ['A','B']);
  assert.notEqual(q.options[0].id,q.options[1].id);
}
const answers = Object.fromEntries(core.QUESTIONS.map(q=>[q.id,q.options[0].id]));
const allA = core.valueProfile(answers);
assert.ok(Math.abs(allA.outcomes-(700/9))<1e-9);
assert.equal(allA.harmCaution,0);
assert.equal(allA.consentResponse,50);
assert.equal(allA.relationshipResponse,50);
assert.equal(allA.certainty,100);
assert.equal(allA.procedure,50);
const allB = Object.fromEntries(core.QUESTIONS.map(q=>[q.id,q.options[1].id]));
assert.equal(core.valueProfile(allB).outcomes,200/9);
assert.equal(core.valueProfile(allB).harmCaution,100);
assert.equal(core.valueProfile(allB).certainty,0);
assert.equal(core.valueProfile(allB).procedure,50);
const demo = 'ABBAAAAAAB'.split('');
const sample = Object.fromEntries(core.QUESTIONS.map((q,i)=>[q.id,q.options[demo[i]==='A'?0:1].id]));
const scores=core.valueProfile(sample);
assert.ok(Math.abs(scores.outcomes-100*6/9)<1e-8);
assert.equal(scores.harmCaution,100*2/3);
assert.equal(scores.consentResponse,100);
assert.equal(scores.relationshipResponse,50);
assert.equal(scores.certainty,100);
assert.equal(scores.procedure,50);
assert.equal(core.valueProfile({Q01:answers.Q01}),null);
for(const model of core.MOCK_AI_MODELS) {
 assert.equal(model.questionVersion,core.QUESTION_VERSION);
 assert.equal(model.sourceType,'mock');
 assert.equal(core.valueProfile(model.answers)!==null,true);
 assert.equal(core.calculateMatchStats(model.answers, model.answers).rate,100);
}
console.log('app-core: all tests passed');
