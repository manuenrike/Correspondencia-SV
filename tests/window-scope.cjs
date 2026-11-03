const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'}),tab=await context.newPage(),errors=[];
  tab.on('pageerror',error=>errors.push(error.message));
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await tab.evaluate(()=>newCorrespondence('institucional'));
  await tab.locator('[name=subject]').fill('Solo ventanilla general');
  await tab.locator('[name=requires]').check();await tab.locator('[data-next]').click();
  await tab.locator('#destination').selectOption('I2');await tab.locator('#destinationWindow').selectOption('V21');
  const bytes=await tab.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage().drawText('Prueba de ventanillas');return Array.from(await pdf.save())});
  const upload=()=>tab.locator('#files').setInputFiles({name:'documento.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await upload();await tab.waitForFunction(()=>files.length===1);
  await tab.getByRole('button',{name:'Eliminar documento',exact:true}).click();
  assert.deepEqual(await tab.evaluate(()=>[files.length,editing.files.length,JSON.parse(localStorage.getItem('correspondencia-sv-v1')).drafts[0].files.length]),[0,0,0]);
  await tab.keyboard.press('Escape');await tab.evaluate(()=>newCorrespondence('institucional',db.drafts[0].id));
  assert.equal(await tab.locator('#fileList .file-row').count(),0);
  await upload();await tab.waitForFunction(()=>files.length===1);await tab.locator('[data-next]').click();
  for(const width of [320,375,390,430,768,1024,1440]){
   await tab.setViewportSize({width,height:900});
   assert.equal(await tab.locator('.dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'review overflow '+width);
  }
  assert.equal(await tab.locator('.review-heading').count(),0);
  assert.equal(await tab.locator('.record-facts dt').count(),4);
  await tab.getByRole('button',{name:'Confirmar envío'}).click();await tab.waitForFunction(()=>editing===null);
  const recordId=await tab.evaluate(()=>db.records[0].id);
  const selectWindow=async(institution,window)=>{
   if(await tab.locator('#modal').isVisible())await tab.keyboard.press('Escape');
   await tab.locator('#accountMenu summary').click();
   await tab.locator('#session').selectOption(institution);
   const key=await tab.evaluate(window=>availableSessionUsers().find(entry=>entry.window.id===window).key,window);
   await tab.locator('#sessionUser').selectOption(key);
   await tab.locator('#accountMenu summary').click();
   await tab.locator('aside [data-page=institucional]').click();
  };
  await selectWindow('I2','V24');
  assert.equal(await tab.locator('.correspondence-card').count(),0);
  await tab.locator('#search').fill('Solo ventanilla');assert.equal(await tab.locator('.correspondence-card').count(),0);
  assert.deepEqual(await tab.evaluate(()=>{const r=db.records[0];receive(r.id);rejectForm(r.id);detail(r.id);return [r.status,canReplyToCorrespondence(r),canRejectCorrespondence(r),resolveDocumentContext(r.files[0].id)]}),['pending',false,false,null]);
  assert.equal(await tab.locator('#modal').isVisible(),false);
  await tab.locator('aside [data-page=inicio]').click();assert.equal(await tab.locator('.dashboard-summary__count').textContent(),'0');
  assert.equal(await tab.locator('.stat strong').first().textContent(),'00');
  await selectWindow('I2','V21');
  assert.equal(await tab.locator('.correspondence-card').count(),1);
  await tab.evaluate(id=>detail(id),recordId);await tab.getByRole('button',{name:'Aceptar correspondencia'}).click();
  assert.equal(await tab.locator('#replyForm').count(),1);
  await selectWindow('I2','V24');
  assert.deepEqual(await tab.evaluate(()=>[canAccessCorrespondence(db.records[0]),canReplyToCorrespondence(db.records[0]),canRejectCorrespondence(db.records[0])]),[false,false,false]);
  await selectWindow('I1','V14');assert.equal(await tab.locator('.correspondence-card').count(),0);
  await selectWindow('I1','V11');assert.equal(await tab.locator('.correspondence-card').count(),1);
  // Users assigned to the same window share the expediente.
  await tab.evaluate(()=>{const other=availableSessionUsers().filter(entry=>entry.window.id==='V11')[1];document.querySelector('#sessionUser').value=other.key;document.querySelector('#sessionUser').dispatchEvent(new Event('change'))});
  assert.equal(await tab.locator('.correspondence-card').count(),1);
  // Legacy records without routing fields are visible only in General.
  assert.equal(await tab.evaluate(()=>canAccessCorrespondence({from:'I2',to:'I1'})),true);
  await selectWindow('I1','V14');assert.equal(await tab.evaluate(()=>canAccessCorrespondence({from:'I2',to:'I1'})),false);
  assert.equal(await tab.evaluate(()=>canAccessCorrespondence({kind:'ciudadana',from:'I2',fromWindow:'V21',to:'I1',toWindow:'V11'})),false);
  assert.equal(await tab.evaluate(()=>canAccessCorrespondence({kind:'ciudadana',from:'I2',fromWindow:'V21',to:'I1',toWindow:'V14'})),true);
  await tab.evaluate(()=>newCorrespondence('ciudadana'));const draftId=await tab.evaluate(()=>editing.id);await tab.keyboard.press('Escape');
  await selectWindow('I1','V11');await tab.locator('aside [data-page=borradores]').click();assert.equal(await tab.locator('.draft-card').count(),0);
  await tab.evaluate(id=>newCorrespondence('ciudadana',id),draftId);assert.equal(await tab.locator('#modal').isVisible(),false);
  await selectWindow('I1','V14');await tab.locator('aside [data-page=borradores]').click();assert.equal(await tab.locator('.draft-card').count(),1);
  assert.deepEqual(errors,[]);return 'PASS: eliminación persistente, recepción y envío por ventanilla, búsquedas, contadores, detalle, documentos, decisiones, chat, borradores y compatibilidad histórica';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
