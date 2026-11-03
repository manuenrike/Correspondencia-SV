let backupDirectory=null, backupTimer, backupWriting=false, backupAgain=false, backupStatus='Sin carpeta de respaldo seleccionada';
const backupWrittenFiles=new Map();
function backupHandleDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('correspondencia-sv-backup-settings',1);r.onupgradeneeded=()=>r.result.createObjectStore('settings');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function rememberBackupDirectory(handle){const settings=await backupHandleDB();return new Promise((resolve,reject)=>{const tx=settings.transaction('settings','readwrite');tx.objectStore('settings').put(handle,'directory');tx.oncomplete=()=>{settings.close();resolve()};tx.onerror=()=>reject(tx.error)})}
async function recoverBackupDirectory(){try{const settings=await backupHandleDB();const handle=await new Promise((resolve,reject)=>{const r=settings.transaction('settings').objectStore('settings').get('directory');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});settings.close();if(handle){backupDirectory=handle;const allowed=await handle.queryPermission({mode:'readwrite'});backupStatus=allowed==='granted'?'Carpeta conectada: '+handle.name:'Pulsa Conectar carpeta para reautorizar el respaldo';if(allowed==='granted')scheduleBackup()}}catch{backupStatus='Selecciona una carpeta para habilitar el respaldo'}updateBackupStatus()}
function scheduleBackup(){if(!backupDirectory)return;clearTimeout(backupTimer);backupTimer=setTimeout(()=>writeBackup().catch(()=>{}),700)}
function updateBackupStatus(){const status=document.querySelector('#backupStatus');if(status)status.textContent=backupStatus}
function showBackups(){show(modalHead('Respaldo de información','Guarda tu correspondencia y sus documentos en tu equipo')+`<div class="form-section"><h3>Carpeta de respaldo automático</h3><p>Selecciona una carpeta exclusiva para Correspondencia SV</p><p class="hint">Se guardarán las instituciones, ventanillas, usuarios, ciudadanos, correspondencias, respuestas, borradores y todos los PDF</p><div class="notice" id="backupStatus">${esc(backupStatus)}</div><div class="form-actions"><button class="btn" onclick="selectBackupDirectory()">Conectar carpeta</button><button class="btn primary" onclick="backupNow()">Guardar ahora</button></div></div><div class="form-section"><h3>Restaurar un respaldo</h3><p class="hint">Selecciona una carpeta que contenga informacion.json y la subcarpeta documentos<br>La restauración reemplaza los datos actuales tras tu confirmación</p><button class="btn" onclick="restoreBackup()">Seleccionar respaldo para restaurar</button></div><div class="notice">Espera a que aparezca “Respaldo guardado” antes de cerrar el HTML<br>Los datos también permanecen en este navegador. Si usas otro navegador o equipo, restaura la carpeta de respaldo</div>`)}
async function selectBackupDirectory(){try{if(!window.showDirectoryPicker)return toast('Usa Chrome o Edge para guardar en una carpeta local');const handle=await window.showDirectoryPicker({id:'correspondencia-sv-backup',mode:'readwrite'});if(backupDirectory&&handle.name!==backupDirectory.name)backupWrittenFiles.clear();backupDirectory=handle;backupWrittenFiles.clear();await rememberBackupDirectory(handle);await writeBackup();}catch(error){if(error.name!=='AbortError')toast('No se pudo conectar la carpeta: '+error.message)}}
async function backupNow(){if(!backupDirectory)return selectBackupDirectory();try{if(await backupDirectory.requestPermission({mode:'readwrite'})!=='granted')return toast('Se necesita permiso para escribir en la carpeta');if(typeof editing!=='undefined'&&editing)storeDraft();await writeBackup()}catch(error){toast('No se pudo guardar: '+error.message)}}
async function writeBackup(){
 if(!backupDirectory)return;
 if(backupWriting){backupAgain=true;return}
 backupWriting=true;backupStatus='Guardando respaldo…';updateBackupStatus();
 try{
  if(await backupDirectory.queryPermission({mode:'readwrite'})!=='granted')throw Error('Reconecta la carpeta para autorizar la escritura');
  const directory=backupDirectory, snapshot=JSON.parse(JSON.stringify(db));
  const fileDatabase=await fileDB();
  const entries=await new Promise((resolve,reject)=>{const result=[];const tx=fileDatabase.transaction('files');const cursor=tx.objectStore('files').openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c){result.push({id:c.key,blob:c.value});c.continue()}};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error)});
  const documents=await directory.getDirectoryHandle('documentos',{create:true}), manifest=[];
  for(const {id,blob} of entries){
   const filename=encodeURIComponent(id)+'.pdf';
   if(backupWrittenFiles.get(id)!==blob.size){const target=await documents.getFileHandle(filename,{create:true});const writer=await target.createWritable();await writer.write(blob);await writer.close();backupWrittenFiles.set(id,blob.size)}
   manifest.push({id,filename,size:blob.size});
  }
  const payload={format:'CorrespondenciaSV',version:1,savedAt:new Date().toISOString(),data:snapshot,replyDrafts:[...replyDrafts].map(([key,value])=>[key,{...value,busy:false}]),files:manifest};
  const target=await directory.getFileHandle('informacion.json',{create:true}),writer=await target.createWritable();await writer.write(JSON.stringify(payload,null,2));await writer.close();
  backupStatus='Respaldo guardado · '+date(payload.savedAt)+' · '+directory.name;
 }catch(error){backupStatus='Respaldo pendiente: '+error.message;toast(backupStatus);throw error}
 finally{backupWriting=false;updateBackupStatus();if(backupAgain){backupAgain=false;scheduleBackup()}}
}
async function restoreBackup(){try{
 if(!window.showDirectoryPicker)return toast('Usa Chrome o Edge para restaurar una carpeta');
 const directory=await window.showDirectoryPicker({id:'correspondencia-sv-restore',mode:'read'});
 const file=await (await directory.getFileHandle('informacion.json')).getFile(),payload=JSON.parse(await file.text());
 if(payload.format!=='CorrespondenciaSV'||payload.version!==1||!payload.data||!['institutions','citizens','records','drafts'].every(key=>Array.isArray(payload.data[key]))||!Array.isArray(payload.files))throw Error('El formato del respaldo no es válido');
 if(!await confirmAction({title:'¿Restaurar el respaldo?',message:'Los datos actuales del navegador se reemplazarán por el respaldo del '+date(payload.savedAt)+'. Incluye '+payload.data.records.length+' correspondencias y '+payload.files.length+' archivos',confirmLabel:'Restaurar respaldo',danger:true}))return;
 // Read and validate every file before changing the current database
 const documents=await directory.getDirectoryHandle('documentos'),pending=[];
 for(const entry of payload.files){if(typeof entry.id!=='string'||typeof entry.filename!=='string'||entry.filename!==encodeURIComponent(entry.id)+'.pdf')throw Error('Nombre de archivo inválido');const blob=await(await documents.getFileHandle(entry.filename)).getFile();if(blob.size!==entry.size)throw Error('Archivo incompleto: '+entry.filename);pending.push({id:entry.id,blob})}
 const serialized=JSON.stringify(payload.data);
 const fileDatabase=await fileDB();
 await new Promise((resolve,reject)=>{const tx=fileDatabase.transaction('files','readwrite');const store=tx.objectStore('files');for(const entry of pending)store.put(entry.blob,entry.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
 localStorage.setItem('correspondencia-sv-v1',serialized);
 db=payload.data;editing=null;clearTimeout(draftTimer);replyDrafts.clear();
 for(const [key,value] of payload.replyDrafts||[])replyDrafts.set(key,{...value,busy:false});
 persistReplyDrafts();
 if(!db.institutions.some(i=>i.id===active))active=db.institutions[0]?.id||'I1';
 localStorage.setItem('csv-active',active);session();$('#modal').hidden=true;render();deactivateModal($('#modal'));toast('Respaldo restaurado correctamente');
 }catch(error){if(error.name!=='AbortError')toast('No se pudo restaurar: '+error.message)}
}
// The handle is remembered; browsers may request permission again on the next visit
window.addEventListener('DOMContentLoaded',recoverBackupDirectory);
