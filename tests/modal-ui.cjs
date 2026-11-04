const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const tab=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await tab.getByRole('button',{name:'Nueva correspondencia',exact:true}).click();
  await tab.mouse.click(10,10);assert.equal(await tab.locator('#modal').isVisible(),false);
  assert.equal(await tab.getByRole('button',{name:'Nueva correspondencia',exact:true}).evaluate(e=>e===document.activeElement),true);
  await tab.evaluate(()=>newCorrespondence('institucional'));
  await tab.locator('[name=subject]').fill('Borrador al cerrar fuera');
  await tab.locator('.dialog h2').click();assert.equal(await tab.locator('#modal').isVisible(),true);
  const inside=await tab.locator('.dialog h2').boundingBox();
  await tab.mouse.move(inside.x+10,inside.y+10);await tab.mouse.down();await tab.mouse.move(10,10);await tab.mouse.up();
  assert.equal(await tab.locator('#modal').isVisible(),true,'dragging outside must not dismiss');
  await tab.evaluate(()=>sendingCorrespondence=true);await tab.mouse.click(10,10);
  assert.equal(await tab.locator('#modal').isVisible(),true,'sending guard preserved');
  await tab.evaluate(()=>sendingCorrespondence=false);
  await tab.mouse.click(10,10);assert.equal(await tab.locator('#modal').isVisible(),false);
  assert.equal(await tab.evaluate(()=>JSON.parse(localStorage.getItem('correspondencia-sv-v1')).drafts[0].subject),'Borrador al cerrar fuera');
  await tab.evaluate(()=>newCorrespondence('institucional',db.drafts[0].id));
  assert.equal(await tab.locator('[name=subject]').inputValue(),'Borrador al cerrar fuera');
  // The real original-PDF viewer uses the same lifecycle and owns the backdrop.
  const bytes=await tab.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage().drawText('Modal QA');return Array.from(await pdf.save())});
  await tab.locator('[data-next]').click();await tab.locator('#files').setInputFiles({name:'modal.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await tab.waitForFunction(()=>files.length===1);
  await tab.getByRole('button',{name:'Ver documento',exact:true}).click();await tab.locator('iframe').waitFor();
  await tab.mouse.click(10,10);assert.equal(await tab.locator('iframe').count(),0);assert.equal(await tab.locator('#modal').isVisible(),true);
  assert.equal(await tab.locator('#modal').evaluate(e=>e.inert),false);
  const rail=await tab.locator('.dialog').evaluate(e=>({width:getComputedStyle(e,'::-webkit-scrollbar').width,inset:getComputedStyle(e,'::-webkit-scrollbar-track').marginTop}));
  assert.deepEqual(rail,{width:'12px',inset:'16px'});
  await tab.keyboard.press('Escape');assert.equal(await tab.locator('#modal').isVisible(),false);
  return 'PASS: backdrop, interior, arrastre, bloqueo durante envio, borrador, visor PDF superpuesto, foco y scrollbar inset';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
