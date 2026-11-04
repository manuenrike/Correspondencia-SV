const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fixture=require('./operational-fixture.cjs');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const context=await browser.newContext({reducedMotion:'reduce',timezoneId:'America/El_Salvador'});
  const tab=await context.newPage(),errors=[];
  tab.on('pageerror',error=>errors.push(error.message));
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await tab.setViewportSize({width:1440,height:1000});
  assert.equal(await tab.locator('.dashboard-summary__count').textContent(),'0');
  assert.match(await tab.locator('#main').innerText(),/Sin actividad registrada/);
  await tab.evaluate(fixture);
  assert.equal(await tab.locator('.dashboard-summary__count').textContent(),'4');
  assert.deepEqual(await tab.locator('.stat strong').allTextContents(),['08','02','03','00']);
  assert.match(await tab.locator('.activity-list li').first().innerText(),/Consulta sobre documentos recibidos/);
  assert.doesNotMatch(await tab.locator('#main').innerText(),/Expediente privado de otra ventanilla/);
  await tab.locator('[data-ui-page=atencion]').click();
  assert.equal(await tab.locator('h1').textContent(),'Por atender');
  assert.equal(await tab.locator('#attentionCount').textContent(),'4');
  assert.equal(await tab.locator('#appSidebar [data-page=atencion]').getAttribute('aria-current'),'page');
  const ids=()=>tab.locator('#results .card-meta .code').allTextContents();
  assert.deepEqual((await ids()).sort(),['CIUDADANO','PENDIENTE','RESPUESTA','RESPUESTA-ORIGEN']);
  assert.deepEqual(await tab.evaluate(()=>{
   const initial=db.records.find(r=>r.id==='RESPUESTA');
   return [
    attentionAction({...initial,messages:[{requires:true}]}),
    attentionAction({...initial,messages:[{requires:true,institution:'I9'}]}),
    attentionAction({...initial,messages:[{requires:false,institution:'I2'}]}),
    attentionAction({...initial,kind:'ciudadana'}),
    attentionAction({...initial,toWindow:'V14'}),
    attentionAction({...initial,messages:[{requires:true,actor:{institutionId:'I2'}}]})
   ];
  }),[null,null,null,null,null,'reply']);
  await tab.getByRole('button',{name:'Entrantes',exact:true}).click();assert.equal((await ids()).length,3);
  await tab.getByRole('button',{name:'Enviadas',exact:true}).click();assert.deepEqual(await ids(),['RESPUESTA-ORIGEN']);
  await tab.getByRole('button',{name:'Limpiar filtros',exact:true}).click();
  await tab.locator('.tray-refinements summary').click();
  await tab.locator('[data-tray-filter=kind]').selectOption('institucional');
  await tab.locator('[data-tray-filter=priority]').selectOption('Alta');
  await tab.locator('[data-tray-filter=type]').selectOption('Oficio');
  await tab.locator('[data-tray-filter=institution]').selectOption('I2');
  await tab.locator('[data-tray-filter=fromDate]').fill('2026-11-02');
  await tab.locator('[data-tray-filter=toDate]').fill('2026-11-02');
  await tab.locator('#filter').selectOption('pending');
  await tab.locator('#search').fill('informe');
  assert.deepEqual(await ids(),['PENDIENTE']);
  assert.match(await tab.locator('#trayStatus').textContent(),/1 expediente encontrado por atender/);
  await tab.locator('#search').fill('inexistente');assert.deepEqual(await ids(),[]);
  assert.match(await tab.locator('#results').innerText(),/ajusta la búsqueda/);
  await tab.locator('[data-tray-filter=toDate]').fill('2026-11-01');
  assert.equal(await tab.locator('#trayDateError').isVisible(),true);
  assert.equal(await tab.locator('[data-tray-filter=toDate]').getAttribute('aria-invalid'),'true');
  await tab.getByRole('button',{name:'Limpiar filtros',exact:true}).click();
  assert.equal(await tab.locator('#search').evaluate(e=>document.activeElement===e),true);
  assert.equal((await ids()).length,4);
  await tab.locator('[data-tray-filter=sort]').selectOption('oldest');assert.equal((await ids())[0],'CIUDADANO');
  await tab.locator('[data-tray-filter=sort]').selectOption('newest');assert.equal((await ids()).at(-1),'CIUDADANO');
  // Date boundaries use the same local day as the visible date, including midnight.
  await tab.evaluate(()=>{
   const base=db.records[0];
   db.records.push({...base,id:'FIN-DEL-DIA',created:'2026-11-03T05:59:59.999Z'},{...base,id:'DIA-SIGUIENTE',created:'2026-11-03T06:00:00.000Z'});render();
  });
  await tab.locator('.tray-refinements summary').click();
  await tab.locator('[data-tray-filter=fromDate]').fill('2026-11-02');
  await tab.locator('[data-tray-filter=toDate]').fill('2026-11-02');
  assert.ok((await ids()).includes('FIN-DEL-DIA'));assert.ok(!(await ids()).includes('DIA-SIGUIENTE'));
  // Visible institutions and state/requirement filters combine without changing persisted data.
  await tab.locator('#appSidebar [data-page=institucional]').click();
  await tab.locator('.tray-refinements summary').click();
  await tab.locator('[data-tray-filter=response]').selectOption('closed');
  assert.deepEqual(await ids(),['FINALIZADO']);
  assert.match(await tab.locator('#results .card-status').innerText(),/Recibido\s+Conversación finalizada/);
  await tab.locator('#results .card-open').click();assert.equal(await tab.locator('#replyForm').count(),0);
  assert.equal(await tab.locator('.record-next-action').count(),0);await tab.keyboard.press('Escape');
  await tab.getByRole('button',{name:'Limpiar filtros',exact:true}).click();
  await tab.locator('#search').fill('ENVIADO');
  assert.match(await tab.locator('#results .card-status').innerText(),/Enviado/);
  assert.equal(await tab.locator('#results .needs-attention').count(),0);
  await tab.getByRole('button',{name:'Limpiar filtros',exact:true}).click();
  const contrasts=await tab.locator('#results .badge,#results .attention-label').evaluateAll(nodes=>{
   const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
   const luminance=color=>rgb(color).map(value=>{value/=255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
   return nodes.map(node=>{
    let ancestor=node,background;
    do{background=getComputedStyle(ancestor).backgroundColor;ancestor=ancestor.parentElement}while(ancestor&&background==='rgba(0, 0, 0, 0)');
    const values=[luminance(getComputedStyle(node).color),luminance(background)].sort((a,b)=>b-a);
    return {label:node.textContent,ratio:(values[0]+0.05)/(values[1]+0.05)};
   });
  });
  assert.ok(contrasts.length>=8);for(const pair of contrasts)assert.ok(pair.ratio>=4.5,`${pair.label}: ${pair.ratio}`);
  // Mark the primary available action near the beginning of the detail.
  await tab.evaluate(()=>detail('PENDIENTE'));
  await tab.getByRole('button',{name:'Revisar recepción',exact:true}).click();
  assert.equal(await tab.getByRole('button',{name:'Aceptar correspondencia'}).evaluate(e=>document.activeElement===e),true);
  await tab.keyboard.press('Escape');
  await tab.evaluate(()=>detail('RESPUESTA'));
  await tab.getByRole('button',{name:'Preparar respuesta'}).click();
  assert.equal(await tab.locator('#replyForm textarea').evaluate(e=>document.activeElement===e),true);
  await tab.keyboard.press('Escape');
  // Switching the real session control removes stale advanced filters and protects scope.
  await tab.locator('#accountMenu summary').click();
  const otherKey=await tab.evaluate(()=>availableSessionUsers().find(entry=>entry.window.id==='V14').key);
  await tab.locator('#sessionUser').selectOption(otherKey);await tab.locator('#accountMenu summary').click();
  await tab.locator('#appSidebar [data-page=atencion]').click();assert.deepEqual(await ids(),['OTRA-VENTANILLA']);
  await tab.evaluate(()=>{localStorage.setItem('csv-user-I1','V11:U000');session()});
  await tab.evaluate(fixture);
  // All views, expanded filters and details reflow at the six requested widths.
  for(const width of [320,375,390,768,1024,1440]){
   await tab.setViewportSize({width,height:900});
   for(const view of ['inicio','atencion','institucional','ciudadana','borradores','instituciones']){
    await tab.evaluate(view=>{page=view;resetTrayFilters();render();const details=document.querySelector('.tray-refinements');if(details)details.open=true},view);
    assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${view} overflow at ${width}`);
   }
   await tab.evaluate(()=>detail('RESPUESTA'));
   assert.equal(await tab.locator('.dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,`detail overflow ${width}`);
   await tab.keyboard.press('Escape');
  }
  // A failed multi-field submit retains inline errors and focuses a linked summary.
  await tab.setViewportSize({width:375,height:800});
  await tab.evaluate(()=>newCorrespondence('ciudadana'));
  await tab.locator('[data-next]').click();
  assert.equal(await tab.locator('.form-error-summary').evaluate(e=>e===document.activeElement),true);
  assert.equal(await tab.locator('.field-error').count(),2);
  await tab.locator('.form-error-summary a').first().click();
  assert.equal(await tab.locator('[name=identity]').evaluate(e=>e===document.activeElement),true);
  assert.ok(await tab.locator('[name=subject]').getAttribute('aria-describedby'));
  await tab.locator('[name=subject]').fill('Borrador con ayuda accesible');
  await tab.waitForFunction(()=>document.querySelector('.send-save-status').dataset.state==='saved');
  assert.equal(await tab.locator('.send-save-status').isVisible(),false);
  await tab.locator('[data-next]').focus();
  await tab.evaluate(()=>toast('Notificacion para probar el foco'));
  const focusClear=()=>tab.evaluate(()=>{
   const focus=document.activeElement.getBoundingClientRect(),notice=document.querySelector('#toast').getBoundingClientRect();
   return focus.right<=notice.left||focus.left>=notice.right||focus.bottom<=notice.top||focus.top>=notice.bottom;
  });
  assert.equal(await focusClear(),true,'notification must not cover the footer focus');
  await tab.locator('#modal .close').focus();assert.equal(await focusClear(),true,'notification must not cover the dialog close control');
  await tab.keyboard.press('Escape');
  await tab.evaluate(()=>newCorrespondence('ciudadana',db.drafts[0].id));
  assert.equal(await tab.locator('[name=subject]').inputValue(),'Borrador con ayuda accesible');
  await tab.keyboard.press('Escape');
  // Reflow at half the desktop viewport and landscape orientation (not native browser zoom).
  for(const width of [320,375,768,1024,1440]){
   await tab.setViewportSize({width,height:900});
   await tab.evaluate(()=>{document.activeElement.blur();toast('Notificación de prueba')});
   await tab.locator('#toast').evaluate(e=>Promise.all(e.getAnimations().map(animation=>animation.finished)));
   const position=await tab.locator('#toast').boundingBox();
   assert.ok(position.x>=0&&position.x+position.width<=width);
   assert.ok(position.y>=16&&position.y<=24,'notification stays at the top: '+JSON.stringify({width,position,style:await tab.locator('#toast').getAttribute('style')}));
   assert.ok(width-position.x-position.width<=24,'notification stays on the right');
  }
  await tab.setViewportSize({width:720,height:450});
  await tab.evaluate(()=>{page='atencion';resetTrayFilters();render()});
  assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  return 'PASS: acciones por ventanilla, estados separados, filtros combinados, fechas locales, orden, contadores, actividad real, cambios de sesión, errores enlazados, guardado, 6 anchos y paisaje';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
