// The server is authoritative. Browser storage is only a cache and durable outbox.
const sharedStorage=(()=>{
 const enabled=location.protocol!=='file:'&&(globalThis.CSV_SHARED_STORAGE===true||location.hostname.endsWith('.netlify.app'));
 const model=globalThis.CSVSharedModel,endpoint='/.netlify/functions/shared';
 const OUTBOX='csv-shared-outbox-v1',LINKED='csv-shared-linked-v1',IMPORT='csv-shared-local-import-v1';
 const CHUNK=2*1024*1024;
 let ready=false,base=null,version=0,pending=null,inflight=null,timer,pollTimer,blocked=false,applying=false,lastError='',needsPull=false;
 const fileHashes=new Map();
 const snapshot=()=>model.clone({...db,replyDrafts:[...replyDrafts].filter(([,data])=>data.text?.trim()||data.files?.length||data.requires).map(([id,data])=>({...data,id,busy:false}))});
 const read=key=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
 const isSynced=()=>!enabled||(ready&&!pending&&!inflight&&model.diff(base,snapshot()).length===0);
 function setStatus(state,message){
  if(!enabled)return;
  const status=document.getElementById('sharedStorageStatus');
  if(status){status.hidden=state!=='error';status.dataset.state=state;status.querySelector('span').textContent=state==='error'?message:'';const button=status.querySelector('button');button.hidden=state!=='error';button.textContent=blocked?'Revisar':'Reintentar';button.onclick=()=>!ready?location.reload():blocked?reviewConflict():flush().catch(reportError)}
  if(document.querySelector('.send-save-status'))setDraftSaveStatus(state==='saved'?'saved':state==='error'?'error':'saving');
 }
 function persistOutbox(){
  const latest=snapshot();
  if(!pending&&model.diff(base,latest).length===0)localStorage.removeItem(OUTBOX);
  else localStorage.setItem(OUTBOX,JSON.stringify({base,latest,pending}));
 }
 async function api(resource,{method='GET',query={},body,headers={}}={}){
  const params=new URLSearchParams({resource,...query});
  const response=await fetch(endpoint+'?'+params,{method,body,headers,cache:'no-store',signal:AbortSignal.timeout(90000)});
  if(!response.ok){let payload;try{payload=await response.json()}catch{}
   const error=Error(payload?.error||(response.status===404?'El guardado compartido no está disponible en este servidor.':'No se pudo completar el guardado compartido.'));
   error.status=response.status;error.conflicts=payload?.conflicts;throw error;
  }
  return response;
 }
 async function requestJSON(resource,value){return (await api(resource,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)})).json()}
 function applySnapshot(state){
  model.validateState(state);applying=true;
  try{
   db=Object.fromEntries(['institutions','citizens','records','drafts'].map(collection=>[collection,model.clone(state[collection])]));
   replyDrafts.clear();for(const item of state.replyDrafts){const {id,...data}=item;replyDrafts.set(id,{...data,busy:false})}
   localStorage.setItem('correspondencia-sv-v1',JSON.stringify(db));
   localStorage.setItem('correspondencia-sv-reply-drafts',JSON.stringify([...replyDrafts]));
   if(!inst(active))active=db.institutions[0]?.id||'I1';
  }finally{applying=false}
 }
 async function bootstrap(){
  if(!enabled){ready=true;return}
  setStatus('loading','Abriendo espacio compartido…');
  const local=snapshot(),outbox=read(OUTBOX),linked=localStorage.getItem(LINKED)==='true';
  let remote=await (await api('state')).json();
  if(!remote.state)remote=await requestJSON('initialize',{});
  version=remote.version;base=model.clone(remote.state);
  if(outbox?.base&&outbox.latest){
   model.validateState(outbox.base);model.validateState(outbox.latest);
   base=outbox.base;pending=outbox.pending;applySnapshot(outbox.latest);
  }else{
   if(!linked&&(local.records.length||local.drafts.length||local.replyDrafts.length))localStorage.setItem(IMPORT,JSON.stringify(local));
   applySnapshot(remote.state);
  }
  localStorage.setItem(LINKED,'true');ready=true;
  const demo=document.querySelector('.account-demo');if(demo)demo.textContent='Demo pública · Datos compartidos';
  const footer=document.querySelector('.footer-demo');if(footer)footer.textContent='Datos compartidos del equipo';
  document.querySelector('#sharedStorageStatus button').onclick=()=>blocked?reviewConflict():flush().catch(reportError);
  const importButton=document.querySelector('#importLocalData');
  importButton.onclick=()=>importLocal().catch(reportError);
  document.querySelector('#sharedImportNotice').hidden=!read(IMPORT);
  if(outbox)schedule();else setStatus('saved','Guardado compartido');
  pollTimer=setInterval(()=>pull().catch(()=>setStatus('error','Sin conexión · Reintentar')),10000);
  window.addEventListener('focus',()=>{if(blocked)return;if(!isSynced())flush().catch(reportError);else pull().catch(reportError)});
 }
 function reportError(error){
  lastError=error.message;blocked=error.status===409;
  setStatus('error',blocked?'Hay cambios de otro equipo · Revisar':'Cambios pendientes · Reintentar');
  if(document.querySelector('.send-save-status'))setDraftSaveStatus('error');
 }
 function schedule(){
  if(!enabled||!ready||applying)return;
  clearTimeout(timer);persistOutbox();
  if(blocked){setStatus('error','Hay cambios de otro equipo · Revisar');return}
  if(isSynced()){setStatus('saved','Guardado compartido');return}
  setStatus('saving','Guardando en línea…');
  if(!blocked)timer=setTimeout(()=>flush().catch(reportError),350);
 }
 async function drain(){
  while(true){
   if(blocked)throw Object.assign(Error(lastError||'Revisa los cambios de otro equipo antes de continuar'),{status:409});
   if(!pending){
    const after=snapshot(),operations=model.diff(base,after);
    if(!operations.length){persistOutbox();setStatus('saved','Guardado compartido');return}
    pending={id:'SYNC-'+crypto.randomUUID(),operations,after};persistOutbox();
   }
   const current=pending;setStatus('saving','Guardando en línea…');
   const result=await requestJSON('changes',{id:current.id,operations:current.operations});
   base=model.clone(current.after);version=result.version;needsPull=true;pending=null;persistOutbox();
  }
 }
 async function flush(){
  if(!enabled)return;
  if(!ready)throw Error('El espacio compartido todavía no está disponible');
  clearTimeout(timer);
  if(inflight){await inflight;return flush()}
  inflight=drain();
  try{await inflight}catch(error){reportError(error);throw error}finally{inflight=null;if(isSynced())setStatus('saved','Guardado compartido')}
 }
 async function pull(){
  if(!ready||blocked||!isSynced()||editing||document.querySelector('.overlay:not([hidden]),dialog[open]')||document.activeElement?.matches('input,textarea,select'))return;
  const remote=await (await api('state')).json();
  // A form may have opened or changed while the request was in flight.
  if((remote.version===version&&!needsPull)||!isSynced()||editing||document.querySelector('.overlay:not([hidden]),dialog[open]'))return;
  base=model.clone(remote.state);version=remote.version;needsPull=false;applySnapshot(remote.state);session();render();setStatus('saved','Guardado compartido');
 }
 async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
 async function uploadFile(id,file){
  const bytes=await file.arrayBuffer(),hash=await sha256(bytes),parts=Math.ceil(file.size/CHUNK);
  // Idempotent content-addressed chunks also work for PDFs larger than a Function request.
  for(let part=0;part<parts;part++){
   const chunk=bytes.slice(part*CHUNK,Math.min(bytes.byteLength,(part+1)*CHUNK));
   await api('chunk',{method:'PUT',query:{id,hash,part},body:chunk,headers:{'Content-Type':'application/octet-stream','X-Chunk-SHA256':await sha256(chunk)}});
  }
  await requestJSONWithId('file-commit',id,{hash,size:file.size,parts});fileHashes.set(id,hash);
 }
 async function requestJSONWithId(resource,id,value){return (await api(resource,{method:'POST',query:{id},body:JSON.stringify(value),headers:{'Content-Type':'application/json'}})).json()}
 async function downloadFile(id){
  const response=await api('file',{query:{id}}),info=await response.json();
  if(fileHashes.get(id)===info.hash){const cached=await getLocalFile(id);if(cached)return cached}
  const parts=[];
  for(let part=0;part<info.parts;part++)parts.push(await (await api('chunk',{query:{id,hash:info.hash,part}})).arrayBuffer());
  const file=new Blob(parts,{type:'application/pdf'});
  if(file.size!==info.size||await sha256(await file.arrayBuffer())!==info.hash)throw Error('El documento llegó incompleto. Vuelve a abrirlo.');
  await putLocalFile(id,file);fileHashes.set(id,info.hash);return file;
 }
 async function importLocal(){
  const legacy=read(IMPORT);if(!legacy)return;
  if(!isSynced())await flush();
  const remote=await (await api('state')).json();
  const merged=model.clone(remote.state),conflicts=[];
  // Preserve every existing remote entity. Different versions are never silently overwritten.
  for(const collection of model.collections){
   const defaults=collection==='institutions'?seed().institutions:collection==='citizens'?[...seed().citizens,...additionalTestCitizens]:[];
   for(const item of legacy[collection]||[]){
    const id=model.key(collection,item),existing=merged[collection].find(value=>model.key(collection,value)===id);
    if(existing){
     if(model.equal(existing,item))continue;
     const original=defaults.find(value=>model.key(collection,value)===id);
     if(original&&model.equal(existing,original))merged[collection][merged[collection].indexOf(existing)]=item;
     else if(!original||!model.equal(item,original))conflicts.push(collection+':'+id);
    }
    else merged[collection].push(item);
   }
  }
  if(conflicts.length)throw Error('Hay registros locales distintos de los compartidos. Conserva tu copia y revisa los identificadores antes de importarlos: '+conflicts.slice(0,5).join(', '));
  const ids=new Set();
  for(const record of [...legacy.records,...legacy.drafts,...legacy.replyDrafts])for(const file of recordDocuments(record)){ids.add(file.id);if(file.authenticatedId)ids.add(file.authenticatedId)}
  const button=document.querySelector('#importLocalData');button.disabled=true;button.textContent='Compartiendo documentos…';
  try{
   for(const id of ids){const file=await getLocalFile(id);if(!file)throw Error('Falta el documento local '+id+'. Restaura la copia completa antes de importarlo.');await uploadFile(id,file)}
   base=model.clone(remote.state);version=remote.version;applySnapshot(merged);schedule();await flush();
   localStorage.removeItem(IMPORT);document.querySelector('#sharedImportNotice').hidden=true;session();render();toast('Datos de este navegador compartidos correctamente');
  }finally{button.disabled=false;button.textContent='Compartir datos de este navegador'}
 }
 async function reviewConflict(){
  if(!await confirmAction({title:'¿Cargar la versión del equipo?',message:'Otro equipo cambió un expediente que estabas modificando. Se conservará una copia de tus cambios pendientes en este navegador antes de cargar la versión compartida.',confirmLabel:'Conservar copia y cargar',danger:false}))return;
  if(editing)storeDraft();
  localStorage.setItem('csv-shared-conflict-'+Date.now(),JSON.stringify({state:snapshot(),outbox:read(OUTBOX)}));
  const remote=await (await api('state')).json();
  pending=null;blocked=false;lastError='';base=model.clone(remote.state);version=remote.version;editing=null;
  document.querySelector('#modal').hidden=true;deactivateModal(document.querySelector('#modal'));
  applySnapshot(remote.state);persistOutbox();session();render();setStatus('saved','Guardado compartido');
 }
 return {enabled,bootstrap,schedule,flush,pull,uploadFile,downloadFile,isSynced,reportError,get ready(){return ready}};
})();
