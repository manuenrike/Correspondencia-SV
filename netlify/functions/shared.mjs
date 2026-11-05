import {getDatabase} from '@netlify/database';
import {getStore} from '@netlify/blobs';
import {createSharedHandler} from '../../server/shared-handler.mjs';

// Public demonstration workspace, explicitly requested by the project owner.
// Replace with authenticated per-user authorization before using real documents.
export default async request=>{
 try{
  return await createSharedHandler({database:getDatabase(),files:getStore({name:'csv-documents-v1',consistency:'strong'})})(request);
 }catch(error){
  console.error('Shared storage unavailable:',error.message);
  return Response.json({error:'El almacenamiento compartido aún no está configurado en Netlify.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
};
