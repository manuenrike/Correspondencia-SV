function availableSessionUsers(){
  return (inst(active)?.windows||[]).flatMap(window=>window.users.filter(user=>user.active).map(user=>({user,window,key:window.id+':'+user.id})));
}
function refreshSessionUser(){
  const select=$('#sessionUser'),available=availableSessionUsers();
  const stored=localStorage.getItem('csv-user-'+active);
  const selected=available.find(entry=>entry.key===stored)||available[0];
  select.innerHTML=available.map(entry=>`<option value="${esc(entry.key)}" ${entry===selected?'selected':''}>${esc(entry.user.name)} · ${esc(entry.window.name)}</option>`).join('')||'<option value="">Sin usuarios activos</option>';
  select.disabled=!selected;
  if(selected)localStorage.setItem('csv-user-'+active,selected.key);
  const avatar=document.querySelector('.avatar.user');
  if(avatar)avatar.textContent=selected?selected.user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join(''):'—';
  select.onchange=()=>{localStorage.setItem('csv-user-'+active,select.value);refreshSessionUser()};
}
function currentActor(){
  const key=$('#sessionUser').value;
  const entry=availableSessionUsers().find(entry=>entry.key===key);
  if(!entry)throw Error('Selecciona un usuario activo para realizar esta acción');
  return {userId:entry.user.id,userName:entry.user.name,email:entry.user.email,institutionId:active,institutionName:inst(active).name,windowId:entry.window.id,windowName:entry.window.name};
}
function actorMarkup(actor){
  return `<small class="audit-actor"><b>${esc(actor.userName)}</b> · ${esc(actor.institutionName)}<br>Ventanilla: ${esc(actor.windowName)}</small>`;
}
function eventMarkup(event){
  const legacyDecision=!event.actor&&/^(Rechazad|Recepción aceptada|Correspondencia recibida)/i.test(event.text);
  return `<p>${esc(event.text)}${event.actor?actorMarkup(event.actor):legacyDecision?'<small>Usuario no registrado en este evento anterior</small>':''}<small>${date(event.at)}</small></p>`;
}
function canRejectCorrespondence(record){
  return record.status==='pending'?record.to===active:record.kind==='institucional'&&record.status==='accepted'&&[record.from,record.to].includes(active);
}
function responseRequirementMarkup(value){return `<span class="badge ${value?'b-yellow':'b-gray'}">${value?'Requiere respuesta':'No requiere respuesta'}</span>`}
function registerDecision(record,action,reason=''){
  const actor=currentActor();
  if(action==='accepted'?(record.to!==actor.institutionId||record.status!=='pending'):!canRejectCorrespondence(record))return null;
  if(action!=='accepted'&&reason.trim().length<5)throw Error('Indica una justificación de al menos 5 caracteres');
  const at=now(),accepted=action==='accepted';
  record.status=accepted?'accepted':'rejected';
  record.decision={action:record.status,actor,at,reason:accepted?'':reason};
  record.events.push({action:record.status,text:accepted?'Correspondencia aceptada':'Correspondencia rechazada: '+reason,actor,at});
  if(!accepted)record.messages.push({text:'Motivo del rechazo: '+reason,institution:actor.institutionId,actor,at,files:[]});
  return record.decision;
}
