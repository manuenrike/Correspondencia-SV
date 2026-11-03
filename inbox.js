// Read-only projections of the existing routing, reception and reply rules.
// Filter state belongs to the view; it is never added to records or backups.
const trayDefaults=()=>({kind:'',priority:'',type:'',institution:'',fromDate:'',toDate:'',response:'',sort:'newest'});
let trayFilters=trayDefaults();

function resetTrayFilters(){trayFilters=trayDefaults();box='all';query='';filter=''}

function refreshAttentionCount(){
 const target=document.querySelector('#attentionCount');if(!target)return;
 const count=db.records.filter(record=>attentionAction(record)).length;
 target.textContent=count;target.setAttribute('aria-label',`${count} expedientes por atender`);
}

function attentionAction(record){
 if(!canAccessCorrespondence(record))return null;
 if(record.status==='pending'&&isWindowRecipient(record))return 'receive';
 if(!canReplyToCorrespondence(record))return null;
 const latest=(record.messages||[]).filter(message=>typeof message.requires==='boolean').at(-1);
 const sender=latest?(latest.institution||latest.actor?.institutionId):record.from;
 // A requirement on our own last message is awaiting the other institution.
 // Ambiguous legacy messages do not establish a pending action for either side.
 return sender&&sender!==active&&(sender===record.from||sender===record.to)?'reply':null;
}

function recordDateKey(value){
 const parsed=new Date(value);
 if(!Number.isFinite(parsed.getTime()))return '';
 return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
}

function trayDateRangeInvalid(){return !!(trayFilters.fromDate&&trayFilters.toDate&&trayFilters.fromDate>trayFilters.toDate)}

function filterCorrespondence(records){
 const term=query.trim().toLocaleLowerCase('es');
 return records.filter(record=>{
  if(!canAccessCorrespondence(record))return false;
  if(page==='atencion'&&!attentionAction(record))return false;
  if(box==='in'&&!isWindowRecipient(record)||box==='out'&&!isWindowSender(record))return false;
  if(filter&&record.status!==filter)return false;
  if(trayFilters.kind&&record.kind!==trayFilters.kind)return false;
  if(trayFilters.priority&&record.priority!==trayFilters.priority)return false;
  if(trayFilters.type&&record.type!==trayFilters.type)return false;
  if(trayFilters.institution&&record.from!==trayFilters.institution&&record.to!==trayFilters.institution)return false;
  if(trayFilters.response==='required'&&!(record.kind==='institucional'&&record.status!=='rejected'&&correspondenceRequiresReply(record)))return false;
  if(trayFilters.response==='closed'&&!(record.kind==='institucional'&&record.status==='accepted'&&!correspondenceRequiresReply(record)))return false;
  const created=recordDateKey(record.created);
  if(trayDateRangeInvalid())return false;
  if((trayFilters.fromDate||trayFilters.toDate)&&!created)return false;
  if(trayFilters.fromDate&&created<trayFilters.fromDate||trayFilters.toDate&&created>trayFilters.toDate)return false;
  return `${record.id} ${record.subject} ${record.citizen||''} ${inst(record.from)?.name||''} ${inst(record.to)?.name||''}`.toLocaleLowerCase('es').includes(term);
 }).sort((a,b)=>{
  const delta=(Date.parse(a.created)||0)-(Date.parse(b.created)||0);
  return (trayFilters.sort==='oldest'?delta:-delta)||String(a.id).localeCompare(String(b.id));
 });
}

function currentTrayRecords(){return db.records.filter(record=>canAccessCorrespondence(record)&&(page==='atencion'||record.kind===page))}

function inboxToolbar(records){
 const select=(key,label,choices)=>`<label class="field">${label}<select data-tray-filter="${key}">${choices.map(([value,text])=>`<option value="${esc(value)}" ${trayFilters[key]===value?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
 const types=[...new Set(records.map(record=>record.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const involved=new Set(records.flatMap(record=>[record.from,record.to]));
 const institutions=db.institutions.filter(institution=>involved.has(institution.id)).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 return `<div class="inbox-controls"><div class="inbox-search-row"><label class="field inbox-search">Buscar expediente<span class="search">${uiIcon('search')}<input id="search" type="search" placeholder="Asunto, código, ciudadano o institución" value="${esc(query)}"></span></label><label class="field">Estado de recepción<select id="filter"><option value="">Todos los estados</option>${[['pending','Pendiente de recepción / enviado'],['accepted','Recibido'],['rejected','Rechazado']].map(([value,label])=>`<option value="${value}" ${filter===value?'selected':''}>${label}</option>`).join('')}</select></label><button type="button" class="btn" data-clear-tray>${uiIcon('reset')} Limpiar filtros</button></div>
  <details class="tray-refinements" ${Object.entries(trayFilters).some(([key,value])=>value&&key!=='sort')?'open':''}><summary>Más filtros <span class="hint">Fechas, prioridad, documento e institución</span></summary><div class="inbox-filter-grid">
  ${page==='atencion'?select('kind','Correspondencia',[['','Todos los tipos'],['institucional','Institucional'],['ciudadana','Ciudadana']]):''}
  <label class="field">Fecha de envío desde<input type="date" data-tray-filter="fromDate" value="${esc(trayFilters.fromDate)}"></label><label class="field">Fecha de envío hasta<input type="date" data-tray-filter="toDate" value="${esc(trayFilters.toDate)}" aria-describedby="trayDateError"></label>
  ${select('priority','Prioridad',[['','Todas las prioridades'],...['Alta','Media','Baja'].map(value=>[value,value])])}
  ${select('type','Tipo de documento',[['','Todos los documentos'],...types.map(value=>[value,value])])}
  ${select('institution','Institución de origen o destino',[['','Todas las instituciones'],...institutions.map(institution=>[institution.id,institution.name])])}
  ${select('response','Respuesta institucional',[['','Cualquier requerimiento'],['required','Requiere respuesta'],['closed','Conversación finalizada']])}
  </div><p id="trayDateError" class="field-error" role="alert" hidden>La fecha hasta debe ser igual o posterior a la fecha desde.</p></details>
  <div class="tray-results-heading"><p id="trayStatus" role="status" aria-live="polite" aria-atomic="true">${trayResultLabel(filterCorrespondence(records).length)}</p>${select('sort','Ordenar por',[['newest','Fecha más reciente'],['oldest','Fecha más antigua']])}</div></div>`;
}

function trayResultLabel(count){return `${count} ${count===1?'expediente encontrado':'expedientes encontrados'}${page==='atencion'?' por atender':''} en tu ventanilla`}

function bindInboxFilters(){
 const update=()=>{
  query=$('#search').value;filter=$('#filter').value;
  $$('[data-tray-filter]').forEach(control=>trayFilters[control.dataset.trayFilter]=control.value);
  const invalid=trayDateRangeInvalid(),until=$('[data-tray-filter="toDate"]');
  $('#trayDateError').hidden=!invalid;until.setAttribute('aria-invalid',String(invalid));
  const records=filterCorrespondence(currentTrayRecords());
  $('#results').innerHTML=correspondenceCards(records);$('#trayStatus').textContent=trayResultLabel(records.length);
 };
 $('#search').oninput=update;$('#filter').onchange=update;
 $$('[data-tray-filter]').forEach(control=>control.onchange=update);
 $('[data-clear-tray]').onclick=()=>{resetTrayFilters();render();$('#search').focus()};
 update();
}

function focusRecordAction(id){
 const target=document.getElementById(id);
 const control=target?.querySelector('textarea')||target?.querySelector('.btn.primary')||target?.querySelector('button');
 if(control){control.focus();control.scrollIntoView({block:'center',behavior:'auto'})}
}

function recordNextAction(record){
 const action=attentionAction(record);
 if(!action)return '';
 return `<div class="record-next-action"><div>${uiIcon(action==='receive'?'inbox':'edit')}<span><b>${action==='receive'?'Pendiente de tu recepción':'Respuesta pendiente de tu ventanilla'}</b><small>${action==='receive'?'Revisa los documentos antes de aceptar o rechazar.':'El último envío de la contraparte requiere respuesta.'}</small></span></div><button type="button" class="btn primary" onclick="focusRecordAction('${action==='receive'?'recordReception':'replyForm'}')">${action==='receive'?'Revisar recepción':'Preparar respuesta'} ${uiIcon('arrow')}</button></div>`;
}
