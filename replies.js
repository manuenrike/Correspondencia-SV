let savedReplyDrafts=[];
try{savedReplyDrafts=JSON.parse(localStorage.getItem('correspondencia-sv-reply-drafts')||'[]')}catch{}
const replyDrafts = new Map(Array.isArray(savedReplyDrafts)?savedReplyDrafts.map(([key,value])=>[key,{...value,busy:false}]):[]);
function persistReplyDrafts(){localStorage.setItem('correspondencia-sv-reply-drafts',JSON.stringify([...replyDrafts].map(([key,value])=>[key,{...value,busy:false}])));scheduleBackup()}
function correspondenceRequiresReply(record){
  const latest=(record.messages||[]).filter(message=>typeof message.requires==='boolean').at(-1);
  return latest?latest.requires:record.requires===true;
}
function canReplyToCorrespondence(record){return record.kind==='institucional'&&record.status==='accepted'&&correspondenceRequiresReply(record)&&[record.from,record.to].includes(active)}
function replyDraft(record) {
  const key = record.id + ':' + active;
  if (!replyDrafts.has(key)) replyDrafts.set(key, {text:'', files:[], requires:false,busy:false});
  return replyDrafts.get(key);
}
function replyComposer() {
  return `<form id="replyForm" class="form-section"><h3>Responder en esta conversación</h3><label class="check"><input type="checkbox" name="requires" value="true">Requiere respuesta</label><p class="hint">Desmarca la casilla si no requiere respuesta</p>
    <label class="field">Mensaje <span class="optional">Opcional si adjuntas documentos</span><textarea name="text" maxlength="3000" placeholder="Escribe tu respuesta"></textarea></label>
    <div class="drop" style="margin-top:18px"><p>Adjuntar documentos a la respuesta</p><div class="hint">Hasta 5 archivos PDF · máximo 50 MB por archivo</div><input id="replyFiles" type="file" accept="application/pdf,.pdf" multiple></div>
    <div id="replyFileList"></div><div class="form-actions"><button id="sendReply" class="btn primary">Enviar respuesta ↗</button></div></form>`;
}
function bindReplyComposer(record) {
  if(!canReplyToCorrespondence(record))return;
  const draft = replyDraft(record), form = $('#replyForm');
  form.elements.text.value = draft.text;
  form.elements.text.oninput = e => {draft.text=e.target.value;persistReplyDrafts()};
  form.elements.requires.checked=draft.requires===true||draft.requires==='true';
  form.elements.requires.onchange=e=>{draft.requires=e.target.checked;persistReplyDrafts()};
  const refresh = () => {
    $('#replyFiles').disabled = draft.busy;
    $('#sendReply').disabled = draft.busy;
    form.elements.text.disabled = draft.busy;
    form.elements.requires.disabled=draft.busy;
    $('#sendReply').textContent = draft.busy ? 'Procesando documentos…' : 'Enviar respuesta ↗';
    $('#replyFileList').innerHTML = draft.files.map((f,i)=>`<div class="file-row"><span>▤ ${esc(f.name)} <small class="hint">${(f.size/1024/1024).toFixed(2)} MB</small></span><div>${documentActions(f.id)} <button type="button" class="icon-btn" data-remove="${i}" ${draft.busy?'disabled':''} aria-label="Quitar documento">×</button></div></div>`).join('');
    $$('#replyFileList [data-remove]').forEach(b=>b.onclick=()=>{if(!draft.busy){draft.files.splice(Number(b.dataset.remove),1);persistReplyDrafts();refresh()}});
  };
  $('#replyFiles').onchange = async e => {
    if(draft.busy)return;
    const incoming=[...e.target.files];e.target.value='';draft.busy=true;refresh();
    try {
      for(const file of incoming){
        if(draft.files.length>=5){toast('Solo se permiten 5 documentos por respuesta');break}
        if(file.size>50*1024*1024||!file.name.toLowerCase().endsWith('.pdf')||new TextDecoder().decode(await file.slice(0,5).arrayBuffer())!=='%PDF-'){
          toast('Solo se permiten archivos PDF válidos de hasta 50 MB');continue;
        }
        const id='DOC-'+uid();
        await putFile(id,file);
        draft.files.push({id,name:file.name,size:file.size,token:uid()+uid()});
      }
    }catch{toast('No se pudieron guardar los adjuntos: revisa el espacio disponible')}
    finally{draft.busy=false;persistReplyDrafts();if($('#replyForm')===form)refresh()}
  };
  form.onsubmit=async e=>{
    e.preventDefault();if(draft.busy)return;
    const text=draft.text.trim(), institution=active;
    if(!text&&!draft.files.length)return toast('Escribe un mensaje o adjunta al menos un documento');
    if(!canReplyToCorrespondence(record))return toast('No se permiten respuestas: la conversación está cerrada, no requiere respuesta o no tienes permiso');
    const actor=currentActor(),requires=form.elements.requires.checked;
    draft.busy=true;refresh();
    try{
      const attachments=draft.files.map(f=>({...f,submittedBy:institution}));
      for(const file of attachments)await authenticatedPDF({...record,from:institution},file);
      if(!canReplyToCorrespondence(record))throw Error('La conversación se ha cerrado y no admite más respuestas');
      const at=now(),message={id:'RESP-'+uid(),text,files:attachments,institution,actor,requires,at};
      const previousRequires=record.requires,previousInitialRequires=record.initialRequires;
      if(record.initialRequires===undefined)record.initialRequires=!!record.requires;
      record.requires=requires;
      record.messages.push(message);
      record.events.push({text:'Respuesta enviada por '+inst(institution).acronym+(attachments.length?' con '+attachments.length+' documento(s)':'')+' · '+(requires?'Requiere respuesta':'No requiere respuesta · Conversación finalizada'),actor,at});
      try{save()}catch(error){record.messages.pop();record.events.pop();record.requires=previousRequires;record.initialRequires=previousInitialRequires;throw error}
      replyDrafts.delete(record.id+':'+institution);persistReplyDrafts();
      if($('#replyForm')===form)detail(record.id);
      toast('Respuesta enviada'+(attachments.length?' con documentos adjuntos':''));
    }catch(error){toast('No se pudo enviar la respuesta: '+error.message)}
    finally{draft.busy=false;if($('#replyForm')===form)refresh()}
  };
  refresh();
}
