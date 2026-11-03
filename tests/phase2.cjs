// Run with Playwright available: node tests/phase2.cjs
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{db.records.push({id:'COR-TEST',kind:'institucional',from:'I2',to:active,fromWindow:'V21',toWindow:'V11',user:'Usuario de prueba',subject:'Expediente con un asunto extenso para comprobar la adaptación de tarjetas en dispositivos pequeños',summary:'Resumen',priority:'Alta',requires:true,status:'pending',created:now(),files:[{id:'DOC-TEST',name:'Nombre documental extenso.pdf',size:100}],messages:[],events:[{text:'Correspondencia creada y enviada',at:now()}]});render()});
  assert.equal(await page.locator('.dashboard-summary__count').textContent(),'1');
  for(const width of [320,375,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   for(const view of ['inicio','institucional','ciudadana','borradores','instituciones']){
    await page.evaluate(v=>{page=v;render()},view);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,view+' overflow at '+width);
   }
   await page.evaluate(()=>newCorrespondence('ciudadana'));
   assert.equal(await page.locator('.dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'dialog overflow '+width);
   assert.ok(await page.locator('[data-next]').evaluate(e=>e.getBoundingClientRect().height>=44));
   await page.keyboard.press('Escape');
   await page.evaluate(()=>detail('COR-TEST'));
   assert.equal(await page.locator('.dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'detail overflow '+width);
   await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{page='inicio';render()});
  assert.equal(await page.locator('.dashboard-summary').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.deepEqual(errors,[]);return 'PASS: dashboard con datos, 49 combinaciones responsive, controles de 44 px y movimiento reducido';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(e=>{console.error(e);process.exitCode=1});
