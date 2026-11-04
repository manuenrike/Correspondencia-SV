// Shared wire format: plain JSON entities, no browser/session state or PDF bytes.
(() => {
 const collections=['institutions','citizens','records','drafts','replyDrafts'];
 const key=(collection,item)=>collection==='citizens'?item.type+':'+item.number:item.id;
 const clone=value=>JSON.parse(JSON.stringify(value));
 const canonical=value=>{
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(name=>JSON.stringify(name)+':'+canonical(value[name])).join(',')+'}';
  return JSON.stringify(value);
 };
 const equal=(a,b)=>canonical(a)===canonical(b);
 function validateState(state){
  if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Estado compartido inválido');
  for(const collection of collections){
   if(!Array.isArray(state[collection]))throw Error('Colección inválida: '+collection);
   const seen=new Set();
   for(const item of state[collection]){
    if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Registro inválido');
    const id=key(collection,item);
    if(typeof id!=='string'||!id||id.length>240||seen.has(id))throw Error('Identificador inválido o duplicado');
    seen.add(id);
    if(collection==='institutions'){
     if(typeof item.name!=='string'||typeof item.acronym!=='string'||typeof item.active!=='boolean'||!Array.isArray(item.windows))throw Error('Institución inválida');
     for(const window of item.windows){if(typeof window.id!=='string'||typeof window.name!=='string'||!Array.isArray(window.users))throw Error('Ventanilla inválida');for(const user of window.users)if(typeof user.id!=='string'||typeof user.name!=='string'||typeof user.email!=='string'||typeof user.active!=='boolean')throw Error('Usuario inválido')}
    }
    if(collection==='citizens'&&(!item.type||!item.number||typeof item.name!=='string'))throw Error('Ciudadano inválido');
    if(['records','drafts'].includes(collection)&&(!['institucional','ciudadana'].includes(item.kind)||typeof item.from!=='string'||!Array.isArray(item.files)))throw Error('Expediente inválido');
    if(collection==='records'&&(typeof item.to!=='string'||typeof item.subject!=='string'||!['pending','accepted','rejected'].includes(item.status)||!Array.isArray(item.events)||!Array.isArray(item.messages)||!Number.isFinite(Date.parse(item.created))))throw Error('Correspondencia inválida');
    if(collection==='replyDrafts'&&(!Array.isArray(item.files)||typeof item.text!=='string'))throw Error('Borrador de respuesta inválido');
   }
  }
  return state;
 }
 function diff(before,after){
  const operations=[];
  for(const collection of collections){
   const previous=new Map((before[collection]||[]).map(item=>[key(collection,item),item]));
   const current=new Map((after[collection]||[]).map(item=>[key(collection,item),item]));
   for(const id of new Set([...previous.keys(),...current.keys()])){
    const a=previous.get(id)||null,b=current.get(id)||null;
    if(!equal(a,b))operations.push({collection,id,before:a,after:b});
   }
  }
  return clone(operations);
 }
 function apply(state,operations){
  if(!Array.isArray(operations)||operations.length>1000)throw Error('Lote de cambios inválido');
  const result=clone(state),conflicts=[],seen=new Set();
  for(const operation of operations){
   const {collection,id,before,after}=operation||{};
   if(!collections.includes(collection)||typeof id!=='string'||!id||id.length>240)throw Error('Cambio inválido');
   const signature=collection+':'+id;
   if(seen.has(signature))throw Error('Cambio duplicado');seen.add(signature);
   for(const value of [before,after])if(value!==null&&(!value||typeof value!=='object'||Array.isArray(value)||key(collection,value)!==id))throw Error('Contenido del cambio inválido');
   const index=result[collection].findIndex(item=>key(collection,item)===id);
   const current=index<0?null:result[collection][index];
   // Exact preconditions prevent lost edits and replies after another device closes a chat.
   if(equal(current,after))continue;
   if(!equal(current,before)){conflicts.push(signature);continue}
   if(after===null){if(index>=0)result[collection].splice(index,1)}
   else if(index>=0)result[collection][index]=clone(after);
   else result[collection].push(clone(after));
  }
  if(conflicts.length){const error=Error('Otro equipo modificó estos datos');error.status=409;error.conflicts=conflicts;throw error}
  return validateState(result);
 }
 const model={collections,key,clone,canonical,equal,validateState,diff,apply};
 if(typeof module!=='undefined'&&module.exports)module.exports=model;
 else globalThis.CSVSharedModel=model;
})();
