import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
// Standalone npm install, or the existing sibling test runtime in this workspace.
const {JSDOM}=await import('jsdom').catch(()=>import('../../lamay-web/node_modules/jsdom/lib/api.js'));
const html=readFileSync(new URL('../mayos/index.html',import.meta.url),'utf8');
function page({url='https://by.lamayhotel.com/mayos/',saved=null,mobile=false}={}){
  const dom=new JSDOM(html,{url,runScripts:'outside-only'});
  const w=dom.window; w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion')||mobile&&query.includes('max-width'),addEventListener(){}});
  Object.defineProperty(w.navigator,'language',{value:'en-US'});
  if(saved)w.localStorage.setItem('mayos-lang',saved);
  for(const script of w.document.querySelectorAll('script:not([src])'))w.eval(script.textContent);
  return dom;
}
test('Vietnamese is the default even with an English browser; explicit choices work',()=>{
  for(const [options,expected] of [[{},'vi'],[{saved:'en'},'en'],[{url:'https://by.lamayhotel.com/mayos/?lang=en'},'en']]){
    const dom=page(options);assert.equal(dom.window.document.documentElement.lang,expected);dom.window.close();
  }
});
test('claims have no unverified percentage/module tally, Claude remains absent',()=>{
  const dom=page(),d=dom.window.document;
  assert.doesNotMatch(d.querySelector('.proof').textContent,/67|14|production/);
  assert.match(d.querySelector('.proof').textContent,/3.*nền tảng/s);
  assert.doesNotMatch(html,/Claude|AI-native/i);
  assert.equal(d.querySelectorAll('.moment').length,7);
  assert.equal(d.querySelector('.moment:last-child time').textContent,'23:47');
  assert.match(d.querySelector('#finance').textContent,/Live.*lãi\/lỗ/);
  dom.window.close();
});
test('all gallery screens exist, local image assets are small WebP files',()=>{
  const dom=page(),d=dom.window.document;
  assert.equal(d.querySelectorAll('.product-scene').length,6);
  for(const img of d.querySelectorAll('.product-scene img')){
    const file=new URL('../mayos/'+img.getAttribute('src'),import.meta.url);
    assert.ok(existsSync(file));
    const bytes=readFileSync(file);assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length<200000);
    assert.equal(img.getAttribute('loading'),'lazy');assert.ok(img.alt);
  }
  const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
  for(const a of d.querySelectorAll('a[href^="#"]'))assert.ok(d.querySelector(a.getAttribute('href')),a.outerHTML);
  dom.window.close();
});
test('gallery selection, language switching, no autoplay or form changes',()=>{
  const dom=page(),w=dom.window,d=w.document;
  for(const lang of ['en','vi']){
    d.querySelector('[data-lang="'+lang+'"]').click();
    for(const button of d.querySelectorAll('[data-scene-target]')){
      button.click();
      assert.equal(button.getAttribute('aria-pressed'),'true');
      assert.equal(d.querySelectorAll('.product-scene:not([hidden])').length,1);
      assert.equal(d.querySelector('.product-scene:not([hidden])').id,button.getAttribute('aria-controls'));
    }
    const newText=[...d.querySelectorAll('.scene-tabs button,.scene-copy h3,.scene-copy p,.showcase .lede,.proof div>span,#finance h4,#finance p,.moment:last-child h3,.moment:last-child p')].map(e=>e._k);
    assert.equal(w.__miss.filter(key=>newText.includes(key)).length,0);
    assert.equal(d.documentElement.lang,lang);
  }
  assert.match(html,/https:\/\/formsubmit\.co\/ajax\/hello@lamayhotel.com/);
  assert.equal(d.querySelector('#form button').type,'submit');
  dom.window.close();
});
test('mobile shows every screen without switching chips and has mobile-specific assets',()=>{
  const dom=page({mobile:true}),d=dom.window.document;
  assert.equal(d.querySelectorAll('.product-scene:not([hidden])').length,6);
  for(const source of d.querySelectorAll('.product-scene source')){
    assert.equal(source.media,'(max-width:860px)');
    assert.ok(existsSync(new URL('../mayos/'+source.getAttribute('srcset'),import.meta.url)));
  }
  assert.match(html,/image.src = source.currentSrc \|\| source.src/);
  dom.window.close();
});
test('iPhone frames reserve real display safe areas above and below the app',()=>{
  const dom=page(),d=dom.window.document;
  const frames=d.querySelectorAll('.screen-zoom.iphone,.screen-zoom.responsive-device');
  assert.equal(frames.length,6);
  for(const frame of frames){
    const display=frame.querySelector('.phone-display');
    assert.deepEqual([...display.children].map(x=>x.className||x.tagName),['phone-status',frame.querySelector('picture')?'PICTURE':'IMG','phone-home']);
    assert.equal(display.querySelector('.phone-status').getAttribute('aria-hidden'),'true');
    assert.equal(display.querySelector('.phone-home').getAttribute('aria-hidden'),'true');
    assert.ok(display.querySelector('.phone-status svg'));
  }
  dom.window.close();
});
