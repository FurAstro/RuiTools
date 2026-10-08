import assert from 'node:assert/strict';
import { renderQR } from './encoding.ts';
import { kinds } from './kinds.ts';
const data = values => { const form = new FormData(); for (const [key,value] of Object.entries(values)) form.set(key,value); return form; };
const base = { text:'12345', foreground:'#123', background:'#FAEBCD', size:'640', margin:'20' };
for (const kind of kinds) {
 for (const level of kind.levels.length ? kind.levels : ['']) {
  const svg = renderQR(data({...base,kind:kind.id,level}));
  assert.ok(svg.includes('#112233'));
  assert.ok(svg.includes('fill="#FAEBCD"'));
  const [,w,h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  assert.equal(Math.max(Number(w),Number(h)),640); assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'));
  if (['rectangularmicroqrcode','pdf417'].includes(kind.id)) assert.notEqual(w,h);
 }
 console.log(`${kind.label}: all levels OK`);
}
for (const kind of ['qrcode','datamatrix','pdf417','hanxin']) assert.ok(renderQR(data({...base,text:'中文测试 😄',kind,level:kinds.find(item=>item.id===kind).defaultLevel})).startsWith('<svg'));
for (const margin of [0,1,40]) {
 const svg = renderQR(data({...base,kind:'qrcode',level:'M',margin:String(margin)}));
 assert.ok(svg.includes(`<svg x="${margin}" y="${margin}"`));
}
assert.throws(()=>renderQR(data({...base,kind:'microqrcode',level:'H'})));
assert.throws(()=>renderQR(data({...base,kind:'microqrcode',level:'L',text:'x'.repeat(2000)})));
assert.throws(()=>renderQR(data({...base,kind:'qrcode',level:'M',margin:'320'})));
assert.throws(()=>renderQR(data({...base,kind:'wifi',level:'M'})));
console.log('PASS: Unicode, exact longest side, aspect ratios, margins, invalid levels and capacity');


for (const kind of kinds) {
 const values = {...base, kind:kind.id, level:kind.defaultLevel};
 const plain = renderQR(data(values));
 const labeled = renderQR(data({...values, showText:'on'}));
 assert.ok(!plain.includes('<text'));
 assert.ok(labeled.includes('>12345</tspan>'));
 const dimensions = svg => /viewBox="0 0 (\d+) (\d+)"/.exec(svg).slice(1).map(Number);
 assert.equal(dimensions(plain)[0], dimensions(labeled)[0]);
 assert.equal(dimensions(labeled)[1], dimensions(plain)[1] + 36);
}
const escaped = renderQR(data({...base, kind:'qrcode', level:'M', text:'<tag>&中文😄', showText:'on'}));
assert.ok(escaped.includes('&lt;tag&gt;&amp;中文😄'));
const multiline = renderQR(data({...base, kind:'qrcode', level:'M', text:'one\ntwo\nthree\nfour', showText:'on'}));
assert.equal((multiline.match(/<tspan /g) ?? []).length, 3);
assert.ok(multiline.includes('…'));
console.log('PASS: captions across six formats, XML escaping, Unicode, wrapping, export dimensions');
