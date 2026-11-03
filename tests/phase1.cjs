// Run: node tests/phase1.cjs (requires Playwright and an installed browser).
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
async function run(playwright, executablePath) {
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try {
  const context=await browser.newContext();const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>newCorrespondence('institucional'));
  await page.locator('[data-next]').click();assert.equal(await page.locator('.field-error').count(),1);
  await page.locator('[name=subject]').fill('Regresión de envío');await page.locator('[data-next]').click();
  await page.locator('#destination').selectOption('I2');await page.locator('#destinationWindow').selectOption({index:1});
  const bytes=await page.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage().drawText('Prueba');return Array.from(await pdf.save())});
  await page.locator('#files').setInputFiles({name:'prueba.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.waitForFunction(()=>files.length===1);await page.locator('[data-next]').click();
  assert.match(await page.locator('[aria-current=step]').textContent(),/3/);
  await page.evaluate(async()=>{const original=save;save=()=>{throw Error('Cuota simulada')};try{await sendCorrespondence()}finally{save=original}});
  assert.deepEqual(await page.evaluate(()=>[db.records.length,db.drafts.length,!!editing]),[0,1,true]);
  await page.evaluate(()=>Promise.all([sendCorrespondence(),sendCorrespondence()]));
  assert.deepEqual(await page.evaluate(()=>[db.records.length,db.drafts.length,db.records[0].files[0].authenticationVersion]),[1,0,3]);
  await page.evaluate(()=>{active='I2';session();receive(db.records[0].id)});
  assert.equal(await page.evaluate(()=>db.records[0].status),'accepted');
  await page.evaluate(()=>rejectForm(db.records[0].id));await page.locator('[name=reason]').fill('Justificación de rechazo');
  await page.getByRole('button',{name:'Confirmar rechazo'}).click();assert.equal(await page.evaluate(()=>db.records[0].status),'rejected');
  await page.evaluate(()=>viewFile(db.records[0].files[0].id));await page.waitForSelector('iframe');await page.keyboard.press('Escape');
  assert.equal(await page.locator('.overlay:not([hidden])').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.shell').evaluate(e=>e.inert),false);
  for(const width of [320,375,390,430,768,1024,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  assert.deepEqual(errors,[]);return 'PASS: envío, rollback, duplicados, PDF/QR, recepción, rechazo, Escape y anchos';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
