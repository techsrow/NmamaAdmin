import test from 'node:test';
import assert from 'node:assert/strict';
import { moveItem, normalizeMenuTree } from '../src/services/navigationTree.js';
const row=(id,children=[])=>({id,children});
test('drag reorder keeps complete subtrees',()=>{const result=moveItem([row('a',[row('child')]),row('b')],'a','b','after');assert.deepEqual(result.map(x=>x.id),['b','a']);assert.equal(result[1].children[0].id,'child')});
test('indent and outdent preserve item identity',()=>{const nested=moveItem([row('a'),row('b')],'b','a','inside');assert.equal(nested[0].children[0].id,'b');assert.deepEqual(moveItem(nested,'b','a','after').map(x=>x.id),['a','b'])});
test('drag cannot create cycles or exceed four levels',()=>{const items=[row('a',[row('b',[row('c',[row('d')])])]),row('z')];assert.throws(()=>moveItem(items,'a','b','inside'),/own submenu/);assert.throws(()=>moveItem(items,'z','d','inside'),/four levels/);assert.equal(items[1].id,'z')});
test('legacy menu labels and links get editable IDs without losing submenus',()=>{const items=normalizeMenuTree([{title:'Shop',href:'/shop',children:[{label:'About',pageId:1}]}]);assert.equal(items[0].url,'/shop');assert.equal(items[0].label,'Shop');assert.equal(items[0].children[0].type,'page');assert.notEqual(items[0].id,items[0].children[0].id)});
