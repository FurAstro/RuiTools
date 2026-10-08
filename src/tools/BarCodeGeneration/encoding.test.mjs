import assert from 'node:assert/strict';
import { formats, prepareBarcode, renderBarcode } from './encoding.ts';
const data = values => {const result = new FormData(); for (const [key,value] of Object.entries(values)) result.set(key,value); return result;};
for (const format of formats) {
 const svg = renderBarcode(data({format:format.id,text:format.example,width:'600',height:'240',foreground:'#123',background:'#FAEBCD',showText:'on'}));
 assert.ok(svg.includes('viewBox="0 0 600 240"'));
 assert.ok(svg.includes('fill="#FAEBCD"'));
 assert.ok(svg.includes('#112233'));
 console.log(`${format.label}: OK`);
}
assert.equal(prepareBarcode('code128a','A^0291').text, '^103^033^093^017');
assert.equal(prepareBarcode('code128b','0012').text, '^104^016^016^017^018');
assert.equal(prepareBarcode('code128c','0012').text, '^105^000^012');
assert.throws(()=>prepareBarcode('code128a','abc'));
assert.throws(()=>prepareBarcode('code128c','123'));
assert.throws(()=>prepareBarcode('itf','123'));
assert.throws(()=>prepareBarcode('code39','abc'));
assert.equal(prepareBarcode('ean13','012345678901').text,'0123456789012');
assert.throws(()=>prepareBarcode('ean13','0123456789019'));
assert.equal(prepareBarcode('itf14','1001234500001').text.length,14);
assert.throws(()=>renderBarcode(data({format:'code128',text:'123',foreground:'#fff',background:'#FFFFFF'})));
console.log('PASS: forced code sets, leading zeros, check digits, invalid input and colors');
