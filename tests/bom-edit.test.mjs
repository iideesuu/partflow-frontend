import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../runtime_templates/src/bom-edit.js.tmpl',import.meta.url),'utf8');
const {flattenBom,parentCandidates,bomItemPayload}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('moving a row excludes itself and all descendants regardless of row order',()=>{
  const rows=[{id:'c',parent_item:'b'},{id:'a',parent_item:null},{id:'b',parent_item:'a'},{id:'d',parent_item:null}];
  assert.deepEqual(parentCandidates(rows,'a').map(r=>r.id),['d']);
  assert.equal(parentCandidates(rows,null).length,4);
});
test('hierarchical row selection retains depth and identifiers',()=>{
  assert.deepEqual(flattenBom([{id:'a',children:[{id:'b',children:[]}]}]).map(r=>[r.id,r.depth]),[['a',0],['b',1]]);
});
const form={line_no:'10',child_part_revision:'child',quantity:'999999999999.123456',unit:'unit',parent_item:'',position:'P1'};
test('quantity survives editing without floating point rounding',()=>{
  assert.equal(bomItemPayload(form).quantity,form.quantity);
  assert.equal(bomItemPayload(form).parent_item,null);
  for(const quantity of ['0','-1','NaN','Infinity','1e3','1.1234567','1000000000000'])assert.throws(()=>bomItemPayload({...form,quantity}));
});
test('no-position sentinel requires an explicit reason',()=>{
  assert.throws(()=>bomItemPayload({...form,position:''}));
  const payload=bomItemPayload({...form,position:'',no_position_reason:'  散装紧固件  '});
  assert.equal(payload.position,'__NO_POSITION__');assert.equal(payload.no_position_reason,'散装紧固件');
});
