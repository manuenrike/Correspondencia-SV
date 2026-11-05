import {createHash} from 'node:crypto';
import model from '../shared-model.js';
import catalogue from '../catalogue.js';

export const CHUNK_BYTES=2*1024*1024;
export const MAX_FILE_BYTES=64*1024*1024; // Reserved QR footers may enlarge a 50 MB source.
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,240}$/.test(id);
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
async function readJSON(request){
 const text=await request.text();if(Buffer.byteLength(text)>4*1024*1024)throw fail('Demasiados cambios para una solicitud',413);
 try{return JSON.parse(text)}catch{throw fail('JSON inválido')}
}

export function createSharedHandler({database,files,logError=console.error}){
 async function transaction(work){
  const client=await database.pool.connect();
  try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result}
  catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
 }
 return async function handle(request){
  const url=new URL(request.url),resource=url.searchParams.get('resource')||'state';
  try{
   if(!['GET','POST','PUT'].includes(request.method))return json({error:'Método no permitido'},405);
   if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw fail('Origen no permitido',403);
   if(resource==='state'&&request.method==='GET'){
    const {rows}=await database.pool.query('SELECT version,payload FROM csv_shared_state WHERE singleton=TRUE');
    return json(rows.length?{version:Number(rows[0].version),state:rows[0].payload}:{version:0,state:null});
   }
   if(resource==='initialize'&&request.method==='POST'){
    const state=catalogue.seed();state.replyDrafts=[];
    for(const citizen of catalogue.additionalTestCitizens)if(!state.citizens.some(item=>item.type===citizen.type&&item.number===citizen.number))state.citizens.push(citizen);
    model.validateState(state);
    await database.pool.query('INSERT INTO csv_shared_state (singleton,payload) VALUES (TRUE,$1::jsonb) ON CONFLICT (singleton) DO NOTHING',[JSON.stringify(state)]);
    const {rows}=await database.pool.query('SELECT version,payload FROM csv_shared_state WHERE singleton=TRUE');
    return json({version:Number(rows[0].version),state:rows[0].payload});
   }
   if(resource==='changes'&&request.method==='POST'){
    const payload=await readJSON(request);
    if(!validId(payload.id)||!Array.isArray(payload.operations))throw fail('Solicitud inválida');
    const digest=hash(model.canonical(payload.operations));
    const result=await transaction(async client=>{
     const {rows}=await client.query('SELECT version,payload FROM csv_shared_state WHERE singleton=TRUE FOR UPDATE');
     if(!rows.length)throw fail('El almacenamiento no está inicializado',503);
     const existing=await client.query('SELECT digest,version FROM csv_shared_mutations WHERE id=$1',[payload.id]);
     if(existing.rows.length){if(existing.rows[0].digest!==digest)throw fail('Identificador de solicitud reutilizado',409);return {version:Number(existing.rows[0].version),replayed:true}}
     let state;try{state=model.apply(rows[0].payload,payload.operations)}catch(error){if(error.status)throw error;throw fail(error.message)}
     // A committed record must never reference a PDF that was not uploaded.
     const fileIds=new Set();
     for(const record of [...state.records,...state.drafts,...state.replyDrafts]){
      for(const file of [...(record.files||[]),...(record.disclaimer?[record.disclaimer]:[]),...(record.messages||[]).flatMap(message=>message.files||[])]){
       if(file.id)fileIds.add(file.id);if(file.authenticatedId)fileIds.add(file.authenticatedId);
      }
     }
     if(fileIds.size){const available=await client.query('SELECT id FROM csv_shared_files WHERE id=ANY($1::text[])',[[...fileIds]]);const found=new Set(available.rows.map(row=>row.id));if([...fileIds].some(id=>!found.has(id)))throw fail('Hay documentos pendientes de guardar. Vuelve a intentarlo.',422)}
     const version=Number(rows[0].version)+1;
     const saved=await client.query('UPDATE csv_shared_state SET payload=$1::jsonb,version=$2,updated_at=NOW() WHERE singleton=TRUE AND version=$3 RETURNING version',[JSON.stringify(state),version,rows[0].version]);
     if(saved.rows.length!==1)throw fail('Otro equipo guardó cambios al mismo tiempo. Vuelve a intentarlo.',409);
     await client.query('INSERT INTO csv_shared_mutations (id,digest,version) VALUES ($1,$2,$3)',[payload.id,digest,version]);
     return {version};
    });
    return json(result);
   }
   const id=url.searchParams.get('id');
   if(!validId(id))throw fail('Documento inválido');
   if(resource==='file'&&request.method==='GET'){
    const {rows}=await database.pool.query('SELECT hash,size,parts FROM csv_shared_files WHERE id=$1',[id]);
    return rows.length?json(rows[0]):json({error:'Documento no encontrado'},404);
   }
   if(resource==='chunk'){
    const fileHash=url.searchParams.get('hash'),part=Number(url.searchParams.get('part'));
    if(!validHash(fileHash)||!Number.isInteger(part)||part<0||part>=Math.ceil(MAX_FILE_BYTES/CHUNK_BYTES))throw fail('Fragmento inválido');
    const key=`${id}/${fileHash}/${part}`;
    if(request.method==='PUT'){
     const bytes=Buffer.from(await request.arrayBuffer());
     if(!bytes.length||bytes.length>CHUNK_BYTES)throw fail('Tamaño de fragmento inválido',413);
     if(hash(bytes)!==request.headers.get('x-chunk-sha256'))throw fail('El fragmento llegó incompleto',422);
     if(part===0&&bytes.subarray(0,5).toString()!=='%PDF-')throw fail('Solo se admiten documentos PDF',422);
     await files.set(key,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{metadata:{size:bytes.length,sha256:hash(bytes)}});
     return json({saved:true});
    }
    if(request.method==='GET'){
     const file=await database.pool.query('SELECT hash,parts FROM csv_shared_files WHERE id=$1',[id]);
     if(!file.rows.length||file.rows[0].hash!==fileHash||part>=file.rows[0].parts)throw fail('Documento no encontrado',404);
     const bytes=await files.get(key,{type:'arrayBuffer'});if(!bytes)throw fail('Fragmento no encontrado',404);
     return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
   }
   if(resource==='file-commit'&&request.method==='POST'){
    const info=await readJSON(request),parts=Math.ceil(info.size/CHUNK_BYTES);
    if(!validHash(info.hash)||!Number.isInteger(info.size)||info.size<=0||info.size>MAX_FILE_BYTES||info.parts!==parts)throw fail('Documento inválido');
    let total=0;
    for(let index=0;index<parts;index++){
     const metadata=await files.getMetadata(`${id}/${info.hash}/${index}`);
     const expected=index===parts-1?info.size-CHUNK_BYTES*index:CHUNK_BYTES;
     if(metadata?.metadata?.size!==expected)throw fail('El documento todavía no terminó de subirse',422);
     total+=metadata.metadata.size;
    }
    if(total!==info.size)throw fail('Documento incompleto',422);
    await database.pool.query('INSERT INTO csv_shared_files (id,hash,size,parts) VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET hash=EXCLUDED.hash,size=EXCLUDED.size,parts=EXCLUDED.parts,updated_at=NOW()',[id,info.hash,info.size,parts]);
    return json({saved:true});
   }
   return json({error:'Ruta no encontrada'},404);
  }catch(error){
   if(!error.status)logError('Shared storage request failed:',error.message);
   return json({error:error.status?error.message:'No se pudo acceder al almacenamiento compartido. Revisa el despliegue de Netlify.',conflicts:error.conflicts},error.status||503);
  }
 };
}
