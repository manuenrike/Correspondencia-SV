const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try {
  const context=await browser.newContext({reducedMotion:'reduce'}),tab=await context.newPage(),errors=[];
  tab.on('pageerror',error=>errors.push(error.message));
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  for(const width of [320,375,390,430,768]){
   await tab.setViewportSize({width,height:900});
   await tab.getByRole('button',{name:'Abrir menú de navegación'}).click();
   assert.equal(await tab.locator('#mobileNavigation').evaluate(e=>e.open),true);
   await tab.keyboard.press('Tab');await tab.keyboard.press('Shift+Tab');
   assert.equal(await tab.evaluate(()=>!!document.activeElement.closest('#mobileNavigation')),true);
   await tab.keyboard.press('Escape');await tab.waitForFunction(()=>!document.querySelector('#mobileNavigation').open);
   assert.equal(await tab.locator('[data-open-menu]').getAttribute('aria-expanded'),'false');
   assert.equal(await tab.locator('#appSidebar').evaluate(e=>e.parentElement===document.body),true);
   await tab.getByRole('button',{name:'Abrir menú de navegación'}).click();
   await tab.locator('#appSidebar [data-page=ciudadana]').click();
   assert.equal(await tab.locator('#mobileNavigation').evaluate(e=>e.open),false);
   assert.equal(await tab.locator('h1').textContent(),'Correspondencia ciudadana');
   assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await tab.getByRole('button',{name:'Abrir menú de navegación'}).click();
  await tab.getByRole('button',{name:'Cambiar institución y ventanilla'}).click();
  assert.equal(await tab.locator('#accountMenu').evaluate(e=>e.open),true);
  assert.equal(await tab.locator('#mobileNavigation').evaluate(e=>e.open),false);
  await tab.keyboard.press('Escape');
  await tab.getByRole('button',{name:'Nueva correspondencia'}).click();
  await tab.locator('[data-next]').click();
  assert.equal(await tab.locator('[name=identity]').getAttribute('aria-invalid'),'true');
  assert.equal(await tab.locator('[name=identity]').evaluate(e=>getComputedStyle(e).borderTopColor),'rgb(185, 28, 28)');
  const unnamed=await tab.locator('#correspondenceForm input,#correspondenceForm select,#correspondenceForm textarea').evaluateAll(nodes=>nodes.filter(n=>!n.labels?.length&&!n.getAttribute('aria-label')&&!n.getAttribute('aria-labelledby')).map(n=>n.id||n.name));
  assert.deepEqual(unnamed,[]);
  await tab.locator('[name=subject]').fill('Borrador visual');
  await tab.waitForFunction(()=>document.querySelector('.send-save-status')?.dataset.state==='saved');
  assert.equal(await tab.locator('.send-save-status').textContent(),'Borrador guardado');
  await tab.keyboard.press('Escape');
  // The reception shortcut follows the kind of an actual pending record.
  await tab.evaluate(()=>{db.records.push({id:'UI-CITIZEN',kind:'ciudadana',from:'I2',fromWindow:'V21',to:active,toWindow:activeWindowId(),subject:'Pendiente ciudadano',created:now(),status:'pending',files:[],messages:[],events:[]});page='inicio';render()});
  await tab.locator('[data-ui-page]').click();assert.equal(await tab.locator('h1').textContent(),'Correspondencia ciudadana');
  assert.equal(await tab.locator('.correspondence-card').count(),1);
  // Native destructive confirmation is distinct and preserves cancel behavior.
  await tab.evaluate(()=>{window.cancelResult=null;confirmAction({title:'Eliminar prueba',message:'Solo interfaz',danger:true}).then(value=>window.cancelResult=value)});
  assert.equal(await tab.locator('.confirm-danger').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(185, 28, 28)');
  await tab.keyboard.press('Escape');await tab.waitForFunction(()=>window.cancelResult===false);
  await tab.setViewportSize({width:1024,height:900});assert.equal(await tab.locator('#appSidebar').isVisible(),true);
  assert.equal(await tab.locator('[data-open-menu]').isVisible(),false);
  assert.deepEqual(errors,[]);return 'PASS: menú móvil nativo, foco, Escape, selector de espacio, nombres accesibles, error textual y visual, autoguardado, atajo ciudadano y confirmación destructiva';
 } finally {await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
