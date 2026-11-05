const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
async function run(playwright,executablePath){
 // An isolated localhost origin enables OPFS for real browser file writes.
 const root=path.resolve(__dirname,'..');
 const server=http.createServer(async(request,response)=>{
  try{
   const filename=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
   if(!filename.startsWith(root+path.sep))throw Error('Invalid path');
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
   response.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');
   response.end(await fs.readFile(filename));
  }catch{response.writeHead(404);response.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const context=await browser.newContext({reducedMotion:'reduce',timezoneId:'America/El_Salvador'}),tab=await context.newPage(),errors=[];
  tab.on('pageerror',error=>errors.push(error.message));
  await tab.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  const bytes=await tab.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage([595,842]).drawText('Original page one');pdf.addPage([595,842]).drawText('Original page two');return Array.from(await pdf.save())});
  const pdf={name:'prueba-dos-paginas.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)};
  const session=async institution=>tab.evaluate(institution=>{active=institution;session();resetTrayFilters();render()},institution);
  await tab.evaluate(()=>newCorrespondence('institucional'));
  await tab.locator('[name=subject]').fill('Expediente de prueba documental');
  await tab.locator('[name=requires]').check();await tab.locator('[data-next]').click();
  await tab.locator('#destination').selectOption('I2');await tab.locator('#destinationWindow').selectOption('V21');
  await tab.locator('[data-next]').click();
  for(const width of [320,375,768,1024,1440]){
   await tab.setViewportSize({width,height:900});
   const error=tab.locator('.attachment-upload > .field-error');
   assert.match(await error.textContent(),/Adjunta al menos un documento PDF/);
   assert.equal(await error.evaluate(e=>getComputedStyle(e).gridColumn),'1 / -1');
   assert.ok(await error.evaluate(e=>e.getBoundingClientRect().width>e.parentElement.clientWidth-60));
   assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.equal(await tab.locator('[data-save]').count(),0);
  await tab.locator('#files').setInputFiles(pdf);await tab.waitForFunction(()=>files.length===1);
  assert.equal(await tab.locator('.attachment-upload > .field-error').count(),0);
  await tab.getByRole('button',{name:'Ver documento',exact:true}).click();
  await tab.locator('iframe[title="Documento original sin QR del sistema"]').waitFor();
  assert.equal(await tab.evaluate(()=>!!files[0].authenticatedId),false);await tab.keyboard.press('Escape');
  await tab.locator('[data-next]').click();await tab.getByRole('button',{name:'Confirmar envío'}).click();
  await tab.waitForFunction(()=>editing===null&&db.records.length===1);
  const institutionalId=await tab.evaluate(()=>db.records[0].id);
  assert.deepEqual(await tab.evaluate(async()=>{
   const file=db.records[0].files[0],source=await getFile(file.id),copy=await getFile(file.authenticatedId);
   const pdf=await PDFLib.PDFDocument.load(await copy.arrayBuffer());
   return [Array.from(new Uint8Array(await source.arrayBuffer())),file.authenticationVersion,pdf.getPageCount(),pdf.getPages().map(page=>page.getHeight())];
  }),[bytes,3,2,[842,968]]);
  await tab.keyboard.press('Escape');await session('I2');await tab.evaluate(id=>detail(id),institutionalId);
  await tab.getByRole('button',{name:'Aceptar correspondencia'}).click();
  await tab.locator('#replyForm [name=text]').fill('Respuesta que requiere información adicional');
  await tab.locator('#replyForm [name=requires]').check();
  await tab.locator('#replyFiles').setInputFiles(pdf);
  await tab.waitForFunction(()=>{const draft=replyDraft(db.records[0]);return draft.files.length===1&&!draft.busy});
  assert.equal(await tab.evaluate(()=>JSON.parse(localStorage.getItem('correspondencia-sv-reply-drafts'))[0][1].files.length),1);
  await tab.keyboard.press('Escape');await tab.evaluate(id=>detail(id),institutionalId);
  assert.equal(await tab.locator('#replyForm [name=text]').inputValue(),'Respuesta que requiere información adicional');
  await tab.locator('#replyFileList [aria-label="Ver documento"]').click();
  await tab.locator('iframe[title="Documento original sin QR del sistema"]').waitFor();await tab.keyboard.press('Escape');
  await tab.locator('#sendReply').click();await tab.waitForFunction(()=>db.records[0].messages.length===1);
  assert.deepEqual(await tab.evaluate(()=>{const r=db.records[0];return [r.messages[0].files[0].authenticationVersion,r.messages[0].files[0].submittedBy,attentionAction(r)]}),[3,'I2',null]);
  await tab.keyboard.press('Escape');await session('I1');await tab.evaluate(id=>detail(id),institutionalId);
  assert.match(await tab.locator('.record-next-action').innerText(),/Respuesta pendiente/);
  await tab.locator('#replyForm [name=text]').fill('Gestión concluida');
  await tab.locator('#sendReply').click();await tab.waitForFunction(()=>db.records[0].messages.length===2);
  assert.equal(await tab.locator('#replyForm').count(),0);
  assert.match(await tab.locator('.correspondence-status').innerText(),/Conversación finalizada/);
  await tab.keyboard.press('Escape');await session('I2');
  assert.equal(await tab.evaluate(()=>canReplyToCorrespondence(db.records[0])),false);
  // Complete citizen flow with actual signed-disclaimer PDF, draft recovery and QR.
  await session('I1');await tab.evaluate(()=>newCorrespondence('ciudadana'));
  await tab.locator('[name=identity]').fill('01234567-8');await tab.locator('#verifyIdentityButton').click();
  await tab.waitForFunction(()=>!!editing.citizen);
  await tab.locator('[name=subject]').fill('Solicitud ciudadana con descargo');await tab.locator('[data-next]').click();
  await tab.locator('#destination').selectOption('I2');await tab.locator('#destinationWindow').selectOption('V21');
  await tab.locator('#files').setInputFiles(pdf);await tab.waitForFunction(()=>files.length===1);
  await tab.locator('#signed').setInputFiles({...pdf,name:'descargo-firmado.pdf'});await tab.waitForFunction(()=>editing.validated);
  await tab.locator('[data-next]').click();assert.equal(await tab.locator('[aria-current=step]').textContent(),'3Revisión');
  const draftId=await tab.evaluate(()=>editing.id);await tab.keyboard.press('Escape');
  await tab.evaluate(id=>newCorrespondence('ciudadana',id),draftId);
  assert.equal(await tab.locator('[aria-current=step]').textContent(),'3Revisión');
  await tab.getByRole('button',{name:'Volver a documentos'}).click();
  assert.equal(await tab.evaluate(()=>editing.validated),true);
  await tab.locator('[data-next]').click();await tab.getByRole('button',{name:'Confirmar envío'}).click();
  await tab.waitForFunction(()=>editing===null&&db.records.length===2);
  assert.deepEqual(await tab.evaluate(()=>{const r=db.records.find(r=>r.kind==='ciudadana');return [r.disclaimer.authenticationVersion,r.files[0].authenticationVersion,canReplyToCorrespondence(r)]}),[3,3,false]);
  await tab.keyboard.press('Escape');
  // Exercise the unchanged email-demo branch too, preserving validation on Back.
  await tab.evaluate(()=>newCorrespondence('ciudadana'));
  await tab.locator('[name=identity]').fill('02345678-9');await tab.locator('#verifyIdentityButton').click();await tab.waitForFunction(()=>!!editing.citizen);
  await tab.locator('[name=subject]').fill('Borrador ciudadano con correo');await tab.locator('[data-next]').click();
  await tab.locator('#destination').selectOption('I2');await tab.locator('#destinationWindow').selectOption('V21');await tab.locator('#files').setInputFiles(pdf);await tab.waitForFunction(()=>files.length===1);
  await tab.locator('#validation').selectOption('Correo electrónico (demostración)');
  await tab.locator('[name=citizenEmail]').fill('prueba@example.test');await tab.getByRole('button',{name:'Generar código de prueba'}).click();
  await tab.locator('#emailCode').fill(await tab.evaluate(()=>editing.demoCode));await tab.getByRole('button',{name:'Validar código',exact:true}).click();
  await tab.locator('[data-next]').click();await tab.getByRole('button',{name:'Volver a documentos'}).click();assert.equal(await tab.evaluate(()=>editing.validated),true);await tab.keyboard.press('Escape');
  // Use actual OPFS handles, replacing only the native directory picker/permission UI.
  const snapshot=await tab.evaluate(async()=>{
   const root=await navigator.storage.getDirectory(),directory=await root.getDirectoryHandle('qa-backup',{create:true});
   window.qaDirectory={name:'qa-backup',queryPermission:async()=> 'granted',requestPermission:async()=> 'granted',getDirectoryHandle:(...args)=>directory.getDirectoryHandle(...args),getFileHandle:(...args)=>directory.getFileHandle(...args)};
   backupDirectory=window.qaDirectory;clearTimeout(backupTimer);await backupNow();clearTimeout(backupTimer);
   const payload=JSON.parse(await(await directory.getFileHandle('informacion.json')).getFile().then(file=>file.text()));
   window.showDirectoryPicker=async()=>window.qaDirectory;
   window.qaSnapshot=payload;
   return {recordIds:db.records.map(r=>r.id),draftIds:db.drafts.map(d=>d.id),files:payload.files.map(f=>[f.id,f.size])};
  });
  assert.equal(snapshot.recordIds.length,2);assert.equal(snapshot.draftIds.length,1);assert.ok(snapshot.files.length>=9);
  await tab.evaluate(async()=>{
   backupDirectory=null;clearTimeout(backupTimer);db.records=[];db.drafts=[];save();
   const fileDatabase=await fileDB();
   await new Promise((resolve,reject)=>{const tx=fileDatabase.transaction('files','readwrite');tx.objectStore('files').clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
   render();showBackups();window.qaRestoring=restoreBackup();
  });
  await tab.locator('[data-confirm]').click();await tab.evaluate(()=>window.qaRestoring);
  assert.deepEqual(await tab.evaluate(()=>({recordIds:db.records.map(r=>r.id),draftIds:db.drafts.map(d=>d.id)})),{recordIds:snapshot.recordIds,draftIds:snapshot.draftIds});
  assert.equal(await tab.evaluate(async()=>{for(const file of window.qaSnapshot.files){const blob=await getFile(file.id);if(!blob||blob.size!==file.size)return false}return true}),true);
  assert.equal(await tab.locator('.shell').evaluate(e=>e.inert),false);
  assert.deepEqual(errors,[]);
  return 'PASS: original intacto, PDF de 2 páginas con QR, respuesta con adjunto y borrador, cierre bilateral, ciudadano con descargo y correo demo, respaldo/restauración real en OPFS';
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
