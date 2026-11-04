const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {createHash}=require('node:crypto');
const {pathToFileURL}=require('node:url');
const model=require('../shared-model.js');

async function environment(){
 const {NetlifyDB}=await import('@netlify/database-dev');
 const {Pool}=require('pg');
 const {createSharedHandler,CHUNK_BYTES}=await import('../server/shared-handler.mjs');
 const emulator=new NetlifyDB({logger:()=>{}}),connectionString=await emulator.start();
 await emulator.applyMigrations(path.resolve(__dirname,'../netlify/database/migrations'));
 // PGlite multiplexes a single embedded session; serialize its transaction connection.
 // Production uses PostgreSQL row locks with independent sessions.
 const pool=new Pool({connectionString,max:1}),objects=new Map();
 const files={
  async set(key,bytes,options){objects.set(key,{bytes:Buffer.from(bytes),metadata:options.metadata})},
  async get(key){const entry=objects.get(key);return entry?Uint8Array.from(entry.bytes).buffer:null},
  async getMetadata(key){return objects.has(key)?{metadata:objects.get(key).metadata}:null}
 };
 const handler=createSharedHandler({database:{pool},files,logError:()=>{}}),root=path.resolve(__dirname,'..');
 const server=http.createServer(async(request,response)=>{
  try{
   if(request.url.startsWith('/.netlify/functions/shared')){
    const body=[];for await(const chunk of request)body.push(chunk);
    const url=`http://127.0.0.1:${server.address().port}${request.url}`;
    const result=await handler(new Request(url,{method:request.method,headers:request.headers,...(body.length?{body:Buffer.concat(body)}:{})}));
    response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));return;
   }
   const filename=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
   if(!filename.startsWith(root+path.sep))throw Error('Invalid path');
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
   response.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');response.end(await fs.readFile(filename));
  }catch(error){response.writeHead(500);response.end(error.message)}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 async function api(resource,{method='GET',query={},body,headers={}}={}){
  return fetch(origin+'/.netlify/functions/shared?'+new URLSearchParams({resource,...query}),{method,body,headers});
 }
 const post=(resource,value,query={})=>api(resource,{method:'POST',query,body:JSON.stringify(value),headers:{'Content-Type':'application/json'}});
 return {origin,api,post,objects,CHUNK_BYTES,pool,async close(){await new Promise(resolve=>server.close(resolve));await pool.end();await emulator.stop()}};
}

async function serverTests(env){
 const {api,post,CHUNK_BYTES}=env;
 assert.equal((await (await api('state')).json()).state,null);
 const initial=await (await post('initialize',{})).json();
 assert.equal(initial.state.institutions.length,5);assert.equal(initial.state.records.length,0);
 const record=id=>({id,kind:'institucional',from:'I1',fromWindow:'V11',to:'I2',toWindow:'V21',subject:id,created:'2026-11-04T12:00:00Z',requires:true,status:'pending',files:[],messages:[],events:[]});
 const a={collection:'records',id:'SERVER-A',before:null,after:record('SERVER-A')},b={collection:'records',id:'SERVER-B',before:null,after:record('SERVER-B')};
 const concurrent=await Promise.all([post('changes',{id:'SERVER-MUTATION-A',operations:[a]}),post('changes',{id:'SERVER-MUTATION-B',operations:[b]})]);
 assert.deepEqual(concurrent.map(response=>response.status),[200,200]);
 let remote=await (await api('state')).json();assert.equal(remote.state.records.length,2);
 const replay=await (await post('changes',{id:'SERVER-MUTATION-A',operations:[a]})).json();assert.equal(replay.replayed,true);
 assert.equal((await post('changes',{id:'SERVER-MUTATION-A',operations:[b]})).status,409);
 const updates=await Promise.all(['accepted','rejected'].map((status,index)=>post('changes',{id:'CONFLICT-'+index,operations:[{...a,before:a.after,after:{...a.after,status}}]})));
 assert.deepEqual(updates.map(response=>response.status).sort(),[200,409]);
 remote=await (await api('state')).json();assert.equal(remote.state.records.length,2);
 const withMissing={...record('MISSING-PDF'),files:[{id:'DOC-MISSING'}]};
 assert.equal((await post('changes',{id:'MISSING-PDF',operations:[{collection:'records',id:withMissing.id,before:null,after:withMissing}]})).status,422);
 assert.equal((await post('changes',{id:'BAD-RECORD',operations:[{collection:'records',id:'BAD',before:null,after:{id:'BAD'}}]})).status,400);
 const bytes=Buffer.alloc(CHUNK_BYTES*3+37,65);bytes.write('%PDF-1.7\n');
 const hash=createHash('sha256').update(bytes).digest('hex'),parts=Math.ceil(bytes.length/CHUNK_BYTES),id='DOC-LARGE';
 assert.equal((await api('chunk',{method:'PUT',query:{id,hash,part:0},body:bytes.subarray(0,CHUNK_BYTES),headers:{'x-chunk-sha256':'0'.repeat(64)}})).status,422);
 for(let part=0;part<parts;part++){
  const chunk=bytes.subarray(part*CHUNK_BYTES,Math.min(bytes.length,(part+1)*CHUNK_BYTES));
  assert.equal((await api('chunk',{method:'PUT',query:{id,hash,part},body:chunk,headers:{'x-chunk-sha256':createHash('sha256').update(chunk).digest('hex')}})).status,200);
 }
 assert.equal((await post('file-commit',{hash,size:bytes.length,parts},{id})).status,200);
 const restored=[];for(let part=0;part<parts;part++)restored.push(Buffer.from(await(await api('chunk',{query:{id,hash,part}})).arrayBuffer()));
 assert.deepEqual(Buffer.concat(restored),bytes);
 assert.equal((await api('state',{method:'POST',headers:{Origin:'https://example.test'}})).status,403);
 // Start browser tests from clean metadata, preserving the independently tested file store.
 await env.pool.query('DELETE FROM csv_shared_mutations');await env.pool.query('DELETE FROM csv_shared_state');await post('initialize',{});
 console.log('PASS server: real Postgres emulator, atomic concurrent writes, conflicts, replay, validation and >6 MB PDF transfer');
}

async function browserTests(env,playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
  for(const context of contexts)await context.addInitScript(()=>{window.CSV_SHARED_STORAGE=true});
  const [one,two]=await Promise.all(contexts.map(context=>context.newPage())),errors=[];
  for(const page of [one,two])page.on('pageerror',error=>errors.push(error.message));
  const open=async page=>{await page.goto(env.origin+'/index.html');await page.waitForFunction(()=>sharedStorage.ready&&document.querySelector('h1')?.textContent==='Resumen de tu ventanilla')};
  await open(one);
  await one.evaluate(()=>newCorrespondence('institucional'));
  await one.locator('[name=subject]').fill('Documento compartido entre equipos');await one.locator('[name=requires]').check();await one.locator('[data-next]').click();
  await one.locator('#destination').selectOption('I2');await one.locator('#destinationWindow').selectOption('V21');
  const bytes=await one.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage().drawText('Shared PDF original');return Array.from(await pdf.save())});
  await one.locator('#files').setInputFiles({name:'compartido.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});await one.waitForFunction(()=>files.length===1);
  await one.locator('[data-next]').click();await one.getByRole('button',{name:'Confirmar envío'}).click();
  await one.waitForFunction(()=>db.records.length===1&&editing===null&&sharedStorage.isSynced());
  const id=await one.evaluate(()=>db.records[0].id);
  await open(two);assert.equal(await two.evaluate(()=>db.records[0].id),id);
  await two.locator('#accountMenu summary').click();await two.locator('#session').selectOption('I2');await two.keyboard.press('Escape');
  await two.evaluate(id=>detail(id),id);await two.getByRole('button',{name:'Aceptar correspondencia'}).click();
  await two.waitForFunction(()=>db.records[0].status==='accepted'&&sharedStorage.isSynced());
  assert.deepEqual(await two.evaluate(async()=>Array.from(new Uint8Array(await(await getFile(db.records[0].files[0].id)).arrayBuffer()))),bytes);
  assert.equal(await two.evaluate(()=>db.records[0].files[0].authenticationVersion),3);
  await two.locator('#replyForm [name=text]').fill('Respuesta desde el segundo equipo');
  await two.locator('#sendReply').click();await two.waitForFunction(()=>db.records[0].messages.length===1&&sharedStorage.isSynced());
  assert.equal(await two.locator('#replyForm').count(),0);
  await one.keyboard.press('Escape');await one.evaluate(()=>sharedStorage.pull());
  assert.equal(await one.evaluate(()=>db.records[0].messages[0].text),'Respuesta desde el segundo equipo');
  assert.equal(await one.evaluate(()=>canReplyToCorrespondence(db.records[0])),false);
  await two.keyboard.press('Escape');
  // Separate additions from two devices survive concurrent autosaves.
  await Promise.all([one.evaluate(()=>{newCorrespondence('institucional');document.querySelector('[name=subject]').value='Borrador equipo uno';storeDraft();return sharedStorage.flush()}),two.evaluate(()=>{newCorrespondence('institucional');document.querySelector('[name=subject]').value='Borrador equipo dos';storeDraft();return sharedStorage.flush()})]);
  await one.keyboard.press('Escape');await two.keyboard.press('Escape');await one.evaluate(()=>sharedStorage.flush());await two.evaluate(()=>sharedStorage.flush());
  const state=await(await env.api('state')).json();assert.equal(state.state.drafts.length,2);
  await one.evaluate(()=>{db.institutions[0].windows[0].users[0].name='Usuario compartido de prueba';save();return sharedStorage.flush()});
  await two.evaluate(()=>sharedStorage.pull());
  assert.equal(await two.evaluate(()=>db.institutions[0].windows[0].users[0].name),'Usuario compartido de prueba');
  const largeSize=7*1024*1024+13;
  await one.evaluate(async size=>{const bytes=new Uint8Array(size);bytes.set(new TextEncoder().encode('%PDF-1.7\n'));await putFile('DOC-BROWSER-LARGE',new Blob([bytes],{type:'application/pdf'}))},largeSize);
  assert.deepEqual(await two.evaluate(async()=>{const blob=await getFile('DOC-BROWSER-LARGE');return [blob.size,await blob.slice(0,5).text()]}),[largeSize,'%PDF-']);
  // A failed request stays durable across reload and is retried with the same operation ID.
  await one.route('**/.netlify/functions/shared?resource=changes*',route=>route.abort());
  await one.evaluate(()=>{newCorrespondence('institucional');document.querySelector('[name=subject]').value='Borrador pendiente sin red';storeDraft();return sharedStorage.flush().catch(()=>{})});
  assert.match(await one.locator('#sharedStorageStatus').innerText(),/pendientes/);
  await one.reload();await one.waitForFunction(()=>sharedStorage.ready);
  assert.ok(await one.evaluate(()=>db.drafts.some(draft=>draft.subject==='Borrador pendiente sin red')));
  await one.unroute('**/.netlify/functions/shared?resource=changes*');await one.evaluate(()=>sharedStorage.flush());
  assert.ok((await(await env.api('state')).json()).state.drafts.some(draft=>draft.subject==='Borrador pendiente sin red'));
  // An existing browser can import its local records without replacing the team.
  const thirdContext=await browser.newContext();
  const catalogue=require('../catalogue.js').seed();
  catalogue.records=[{id:'LOCAL-IMPORT',kind:'ciudadana',from:'I1',fromWindow:'V11',to:'I2',toWindow:'V21',subject:'Dato anterior del navegador',created:new Date().toISOString(),status:'pending',files:[],messages:[],events:[]}];
  await thirdContext.addInitScript(state=>{window.CSV_SHARED_STORAGE=true;localStorage.setItem('correspondencia-sv-v1',JSON.stringify(state))},catalogue);
  const third=await thirdContext.newPage();third.on('pageerror',error=>errors.push(error.message));await open(third);
  assert.equal(await third.locator('#sharedImportNotice').isVisible(),true);
  await third.locator('#importLocalData').click();await third.waitForFunction(()=>document.querySelector('#sharedImportNotice').hidden&&sharedStorage.isSynced());
  const imported=await(await env.api('state')).json();assert.equal(imported.state.records.length,2);
  for(const width of [320,375,768,1024,1440]){await third.setViewportSize({width,height:900});assert.equal(await third.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'shared status overflow '+width)}
  assert.deepEqual(errors,[]);
  console.log('PASS browser: independent profiles, shared PDF/QR, reception, response, drafts, durable offline retry, local import and five widths');
 }finally{await browser.close()}
}

async function run(playwright,executablePath){
 const env=await environment();
 try{await serverTests(env);await browserTests(env,playwright,executablePath);return 'PASS: shared persistence across independent browsers'}finally{await env.close()}
}
module.exports=run;
module.exports.browserTests=browserTests;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
