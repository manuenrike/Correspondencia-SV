const documentIcons={
 view:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
 download:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>'
};
function documentActions(id){
 return `<span class="document-actions"><button type="button" class="icon-btn document-action" title="Ver documento" aria-label="Ver documento" onclick="viewFile('${esc(id)}')">${documentIcons.view}</button><button type="button" class="icon-btn document-action" title="Descargar documento" aria-label="Descargar documento" onclick="downloadDocument('${esc(id)}',this)">${documentIcons.download}</button></span>`;
}
async function downloadDocument(id,button){
 if(button)button.disabled=true;
 try{
  if(editing)storeDraft();
  const context=resolveDocumentContext(id);
  if(!context)throw Error('No se encontró el documento');
  const sent=context.source==='sent';
  const file=sent?await authenticatedPDF(context.record,context.file):await getFile(id);
  if(!file)throw Error('Archivo no disponible en este navegador');
  if(sent)save();
  const url=URL.createObjectURL(file),anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=sent?context.file.name.replace(/\.pdf$/i,'')+'-autenticado.pdf':context.file.name;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(error){toast('No se pudo descargar: '+error.message)}
 finally{if(button)button.disabled=false}
}
