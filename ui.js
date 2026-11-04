const uiPaths={
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 chevrons:'<path d="m8 9 4-4 4 4m-8 6 4 4 4-4"/>',
 archive:'<rect x="3" y="3" width="18" height="5" rx="2"/><path d="M5 8v12h14V8M10 12h4"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 send:'<path d="m21 3-7 18-4-7-7-4Z"/><path d="m10 14 5-5"/>',

 alert:'<path d="m12 3 10 18H2Z"/><path d="M12 9v4m0 3v1"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 building:'<path d="m3 9 9-6 9 6M4 21h16M6 10v8m6-8v8m6-8v8M3 9h18"/>',
 person:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8m-8 4h5"/>',
 window:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 reply:'<path d="m9 5-7 7 7 7M2 12h12a7 7 0 0 1 7 7"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
 edit:'<path d="m16 3 5 5L9 20l-6 1 1-6Z"/><path d="m13 6 5 5"/>',
 power:'<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 inbox:'<path d="M4 4h16l2 11v5H2v-5Z"/><path d="M2 15h6l2 3h4l2-3h6M12 6v7m-3-3 3 3 3-3"/>',
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="11" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="18" width="7" height="3" rx="1"/>'
};
function uiIcon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${uiPaths[name]||uiPaths.mail}</svg>`}
function uiChip(label,color='b-gray',icon='info',classes=''){
 return `<span class="badge ${color}${classes?' '+classes:''}">${uiIcon(icon)}<span>${esc(label)}</span></span>`;
}
function emptyCards(title,description,icon='inbox'){return `<div class="empty-state"><span class="empty-illustration">${uiIcon(icon)}</span><h3>${title}</h3><p>${description}</p></div>`}
function correspondenceCards(records){
 const list=records.map(record=>{
  const outgoing=isWindowSender(record),other=inst(outgoing?record.to:record.from);
  const attachments=(record.files||[]).length+(record.disclaimer?1:0),priority=record.priority;
  const action=attentionAction(record);
  return `<article class="correspondence-card kind-${esc(record.kind)} ${action?'needs-attention':''}">
   <span class="correspondence-card__icon">${uiIcon(record.kind==='ciudadana'?'person':'building')}</span>
   <div class="correspondence-card__body"><div class="card-top"><span class="type-label">${record.kind==='ciudadana'?'Ciudadana':'Institucional'}</span><span class="correspondence-card__direction">${outgoing?'↗ Enviada':'↙ Entrante'}</span>${action?`<span class="attention-label">${uiIcon(action==='receive'?'inbox':'edit')}${action==='receive'?'Confirmar recepción':'Responder a la contraparte'}</span>`:''}</div>
    <button type="button" class="card-title" onclick="detail('${record.id}')">${esc(record.subject)}</button>
    <div class="card-route"><span>${outgoing?'Para':'De'}</span><b>${esc(other?.name||'Institución no disponible')}</b>${record.citizen?`<span class="citizen-name">· ${esc(record.citizen)}</span>`:''}</div>
    <div class="card-meta"><span class="code">${esc(record.id)}</span><span>${uiIcon('clock')}${date(record.created)}</span><span>${uiIcon('file')}${attachments} PDF</span>${record.kind==='institucional'&&priority?`<span class="priority-dot">Prioridad ${esc(priority.toLowerCase())}</span>`:''}</div>
   </div><div class="correspondence-card__side"><div class="card-status">${badge(record)}</div><button class="card-open" onclick="detail('${record.id}')" aria-label="Abrir ${esc(record.subject)}">Ver expediente ${uiIcon('arrow')}</button></div>
  </article>`;
 }).join('');
 return `<div class="correspondence-grid">${list}</div>${!records.length?emptyCards('Sin correspondencia por aquí','No hay expedientes con estos filtros. Crea un envío o ajusta la búsqueda para continuar.'):''}<div class="collection-footer"><span>${records.length} ${records.length===1?'correspondencia':'correspondencias'}</span><span>Mostrando datos de tu ventanilla</span></div>`;
}

function draftCards(){const drafts=db.drafts.filter(canAccessDraft);return `<div class="directory-grid">${drafts.map(d=>`<article class="directory-card draft-card"><div class="directory-top"><span class="directory-icon">${uiIcon('file')}</span>${uiChip('Borrador','b-gray','edit')}</div><span class="type-label">${d.kind==='ciudadana'?'Ciudadana':'Institucional'}</span><h3>${esc(d.subject||'Correspondencia sin asunto')}</h3><p class="hint">Último cambio · ${date(d.updated)}</p><span class="code">${esc(d.id)}</span><div class="directory-actions"><button class="btn" onclick="newCorrespondence('${d.kind}','${d.id}')">Continuar ${uiIcon('arrow')}</button><button class="icon-btn" title="Eliminar borrador" aria-label="Eliminar borrador" onclick="deleteDraft('${d.id}')">${uiIcon('trash')}</button></div></article>`).join('')}</div>${!drafts.length?emptyCards('Una página en blanco','Tus avances se guardan automáticamente. Cuando tengas un borrador, podrás continuarlo aquí.','file'):''}`}
function institutionCards(){const list=db.institutions.filter(i=>(!filter||(filter==='active')===i.active)&&`${i.id} ${i.name} ${i.acronym}`.toLowerCase().includes(query.toLowerCase()));return `<div class="directory-grid">${list.map(i=>`<article class="directory-card"><div class="directory-top"><span class="directory-icon">${uiIcon('building')}</span>${uiChip(i.active?'Activa':'Inactiva',i.active?'b-green':'b-gray',i.active?'check':'power')}</div><span class="code">INST-${esc(i.id.slice(1).padStart(3,'0'))} · ${esc(i.acronym)}</span><h3>${esc(i.name)}</h3><div class="directory-counts"><span>${uiIcon('window')}<b>${i.windows.length}</b> ventanillas</span><span>${uiIcon('person')}<b>${i.windows.reduce((sum,w)=>sum+w.users.length,0)}</b> usuarios</span></div><div class="directory-actions"><button class="btn" onclick="windows('${i.id}')">Gestionar ventanillas ${uiIcon('arrow')}</button><div class="actions"><button class="icon-btn" onclick="editInstitution('${i.id}')" title="Editar institución" aria-label="Editar ${esc(i.name)}">${uiIcon('edit')}</button><button class="icon-btn" onclick="toggleInstitution('${i.id}')" title="${i.active?'Dar de baja':'Dar de alta'}" aria-label="${i.active?'Dar de baja':'Dar de alta'} ${esc(i.name)}">${uiIcon('power')}</button></div></div></article>`).join('')}</div>${!list.length?emptyCards('Sin coincidencias','Prueba con otro nombre, código o siglas.','building'):''}<div class="collection-footer"><span>${list.length} instituciones</span><span>Directorio de colaboración</span></div>`}
function windowCards(institution){return `<div class="directory-grid compact-grid">${institution.windows.map(w=>`<article class="directory-card" data-search="${esc((w.id+' '+w.name).toLowerCase())}"><div class="directory-top"><span class="directory-icon">${uiIcon('window')}</span><span class="code">${esc(w.id)}</span></div><h3>${esc(w.name)}</h3><p>${w.users.length} usuarios asignados</p><div class="directory-actions"><button class="btn" onclick="users('${institution.id}','${w.id}')">Gestionar usuarios ${uiIcon('arrow')}</button><div class="actions"><button class="icon-btn" onclick="editWindow('${institution.id}','${w.id}')" aria-label="Editar ventanilla" title="Editar">${uiIcon('edit')}</button><button class="icon-btn" onclick="deleteWindow('${institution.id}','${w.id}')" aria-label="Eliminar ventanilla" title="Eliminar">${uiIcon('trash')}</button></div></div></article>`).join('')}</div>${!institution.windows.length?emptyCards('Abre un punto de atención','Crea una ventanilla para asignar a su equipo.','window'):''}<div class="search-empty" hidden>Sin resultados para esta búsqueda</div>`}
function userCards(institutionId,window){return `<div class="people-grid">${window.users.map(user=>`<article class="person-card" data-search="${esc((user.name+' '+user.email).toLowerCase())}"><span class="person-avatar">${esc(user.name.split(/\s+/).slice(0,2).map(n=>n[0]).join(''))}</span><div class="person-info"><h3>${esc(user.name)}</h3><p>${esc(user.email)}</p></div><div class="person-card__footer">${uiChip(user.active?'Activo':'Inactivo',user.active?'b-green':'b-gray',user.active?'check':'power')}<div class="person-actions"><button class="icon-btn" onclick="editUser('${institutionId}','${window.id}','${user.id}')" title="Editar usuario" aria-label="Editar ${esc(user.name)}">${uiIcon('edit')}</button><button class="icon-btn" onclick="toggleUser('${institutionId}','${window.id}','${user.id}')" title="${user.active?'Desactivar':'Activar'}" aria-label="${user.active?'Desactivar':'Activar'} ${esc(user.name)}">${uiIcon('power')}</button></div></div></article>`).join('')}</div>${!window.users.length?emptyCards('El equipo empieza aquí','Asigna usuarios para gestionar esta ventanilla.','person'):''}<div class="search-empty" hidden>Sin resultados para esta búsqueda</div>`}
function dashboardHero(){
 const actionable=db.records.filter(record=>attentionAction(record));
 const pending=actionable.length,receptions=actionable.filter(record=>attentionAction(record)==='receive').length;
 return `<section class="welcome" aria-label="Pendientes de tu ventanilla"><div class="dashboard-summary"><span class="dashboard-summary__icon">${uiIcon('inbox')}</span><div><span class="hero-label">POR ATENDER</span><h2><strong class="dashboard-summary__count">${pending}</strong> ${pending===1?'expediente requiere tu atención':'expedientes requieren tu atención'}</h2><p>${pending?`${receptions} por recibir · ${pending-receptions} por responder`:'No hay recepciones ni respuestas pendientes de tu ventanilla.'}</p></div><button class="btn" data-ui-page="atencion">Ver por atender ${uiIcon('arrow')}</button></div></section>`;
}

function recentActivity(records){
 const events=records.flatMap(record=>(record.events||[]).map(event=>({record,event}))).filter(({event})=>Number.isFinite(Date.parse(event.at))).sort((a,b)=>Date.parse(b.event.at)-Date.parse(a.event.at)).slice(0,6);
 return `<section class="panel collection-panel" aria-labelledby="recentActivityTitle"><div class="panel-head"><div><h2 id="recentActivityTitle">Actividad reciente</h2><p>Últimos eventos registrados en los expedientes de tu ventanilla.</p></div></div>${events.length?`<ol class="activity-list">${events.map(({record,event})=>`<li><span class="activity-icon">${uiIcon(event.action==='accepted'?'check':event.action==='rejected'?'alert':'clock')}</span><div><button type="button" class="activity-subject" onclick="detail('${record.id}')">${esc(record.subject)}</button><p>${esc(event.text)}</p><small>${esc(record.id)} · <time datetime="${esc(event.at)}">${date(event.at)}</time></small></div><button type="button" class="btn" onclick="detail('${record.id}')" aria-label="Ver expediente ${esc(record.subject)}">Ver expediente ${uiIcon('arrow')}</button></li>`).join('')}</ol>`:emptyCards('Sin actividad registrada','Los envíos, recepciones y respuestas aparecerán aquí con su fecha real.','clock')}</section>`;
}

// Shared, labeled summaries for review and expediente details.
function correspondenceRoute(record){
 return `<div class="route-summary"><div class="route-summary__endpoint"><span class="route-summary__label">Remitente</span><strong>${esc(inst(record.from)?.name||'Institución no disponible')}</strong><span>${esc(win(record.from,correspondenceWindow(record,'from'))?.name||'Ventanilla no disponible')}</span></div><div class="route-summary__endpoint"><span class="route-summary__label">Destino</span><strong>${esc(inst(record.to)?.name||'Institución no disponible')}</strong><span>${esc(win(record.to,correspondenceWindow(record,'to'))?.name||'Ventanilla no disponible')}</span></div></div>`;
}
function correspondenceMetadata(record){
 const fields=record.kind==='institucional'?
  [['Tipo de documento',record.type||'Oficio'],['Modalidad',record.format||'Digital'],['Prioridad',record.priority||'Media'],['Respuesta',correspondenceRequiresReply(record)?'Requerida':'No requerida']]:
  [['Tipo de documento','Solicitud ciudadana'],['Modalidad',record.format||'Digital']];
 return `<dl class="record-facts">${fields.map(([label,value])=>`<div class="record-facts__item"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
}

function setDraftSaveStatus(state){
 const target=document.querySelector('.send-save-status');if(!target)return;
 target.dataset.state=state;target.setAttribute('role','status');target.setAttribute('aria-live','polite');
 const labels={saving:'Guardando cambios…',saved:'Borrador guardado',error:'No se pudo guardar'};
 target.innerHTML=uiIcon(state==='error'?'alert':state==='saving'?'clock':'check')+'<span>'+labels[state]+'</span>';
}

// Shared metric composition.
function metricCards(metrics,directory=false){
 return `<div class="stats${directory?' stats--directory':''}">${metrics.map(([label,value,icon,context])=>`<div class="stat"><div class="stat__heading"><span class="stat__label">${label}</span><span class="stat-icon">${uiIcon(icon)}</span></div><strong>${String(value).padStart(2,'0')}</strong><small>${context}</small></div>`).join('')}</div>`;
}

function formatFileSize(size){
 if(!Number.isFinite(size)||size<0)return 'Tamaño no disponible';
 const options={maximumFractionDigits:size<1048576?0:2};
 return new Intl.NumberFormat('es-SV',options).format(size<1048576?Math.ceil(size/1024):size/1048576)+(size<1048576?' KB':' MB');
}

// Notifications remain visible without covering the keyboard-focused control.
function keepToastClearOfFocus(){
 const notice=document.querySelector('#toast'),focused=document.activeElement;
 if(!notice||getComputedStyle(notice).display==='none'||!focused||notice.contains(focused))return;
 notice.style.top='';notice.style.bottom='';
 const target=focused.getBoundingClientRect(),rect=notice.getBoundingClientRect();
 const overlaps=(top,bottom)=>target.left<rect.right&&target.right>rect.left&&target.top<bottom&&target.bottom>top;
 if(overlaps(rect.top,rect.bottom)&&!overlaps(16,16+rect.height)){
  notice.style.top='16px';notice.style.bottom='auto';
 }
}
