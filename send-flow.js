function showFieldError(control,message,focus=true){
 let error=control.parentElement.querySelector('.field-error');
 if(!error){error=document.createElement('span');error.className='field-error';error.id='field-error-'+control.name+'-'+control.id;error.setAttribute('role','alert');control.parentElement.append(error)}
 error.textContent=message;control.setAttribute('aria-invalid','true');
 const descriptions=new Set((control.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));descriptions.add(error.id);control.setAttribute('aria-describedby',[...descriptions].join(' '));if(focus)control.focus();
 const clear=()=>{
  error.remove();control.removeAttribute('aria-invalid');
  const remaining=(control.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==error.id);
  if(remaining.length)control.setAttribute('aria-describedby',remaining.join(' '));else control.removeAttribute('aria-describedby');
  const form=control.closest('form'),summary=form?.querySelector('.form-error-summary');
  summary?.querySelector(`[data-error-for="${control.id}"]`)?.remove();
  if(summary&&!summary.querySelector('li'))summary.remove();
  control.removeEventListener('input',clear);control.removeEventListener('change',clear);
 };
 control.addEventListener('input',clear,{once:true});control.addEventListener('change',clear,{once:true});
}
function mountSendFlow(kind){
 const form=$('#correspondenceForm'),dialog=form.closest('.dialog');
 dialog.classList.add('is-composer');
 form.noValidate=true;
 form.insertAdjacentHTML('afterbegin','<p class="form-requirements hint">Los campos con <span class="required-mark">*</span> son obligatorios. Los cambios se guardan automáticamente.</p>');
 form.querySelectorAll('[required]').forEach((control,index)=>{
  if(!control.id)control.id='send-field-'+index;
  const label=control.labels?.[0];
  if(label){const line=document.createElement('span');line.className='field-label';line.append(label.firstChild);const marker=document.createElement('span');marker.className='required-mark';marker.setAttribute('aria-hidden','true');marker.textContent='*';line.append(marker);label.insertBefore(line,control)}
 });
 const upload=form.querySelector('#files'),help=upload.closest('.drop').querySelector('.hint');
 help.id='sendFilesHelp';upload.setAttribute('aria-describedby',help.id);upload.setAttribute('aria-required','true');
 const sections=[...form.children].filter(element=>element.classList.contains('form-section'));
 const groups=kind==='ciudadana'?[[sections[0],sections[1]],[sections[2],sections[3],sections[4]]]:[[sections[0]],[sections[1],sections[2]]];
 const labels=['Información','Destino y documentos','Revisión'];
 const stepper=dialog.querySelector('.stepbar');stepper.className='send-stepper';stepper.setAttribute('aria-label','Progreso del envío');
 stepper.innerHTML=labels.map((label,index)=>`<button type="button" data-step="${index}" ${index===2?'disabled':''}><span>${index+1}</span>${label}</button>`).join('');
 const footer=form.querySelector(':scope > .form-actions');footer.className='form-actions send-footer';
 footer.innerHTML=`<span class="send-save-status" role="status" aria-live="polite">${uiIcon('check')} Guardado automático</span><button type="button" class="btn" data-save>Guardar borrador</button><button type="button" class="btn" data-back>Atrás</button><button type="submit" class="btn primary" data-next>Continuar ${uiIcon('arrow')}</button>`;
 footer.querySelector('[data-save]').onclick=()=>storeDraft();
 const originalSubmit=form.onsubmit;
 const resumeReview=Number(editing.sendStep)===2;
 let current=Math.min(1,Math.max(0,Number(editing.sendStep)||0));
 function showStep(index,focus=false){
  current=index;editing.sendStep=index;
  groups.forEach((group,position)=>group.forEach(section=>{section.hidden=position!==index}));
  stepper.querySelectorAll('[data-step]').forEach(button=>{const position=Number(button.dataset.step);button.classList.toggle('current',position===index);button.classList.toggle('complete',position<index);button.disabled=position>index;button.setAttribute('aria-current',position===index?'step':'false');button.setAttribute('aria-label',`${position+1}. ${labels[position]}${position<index?', completado':position===index?', paso actual':''}`)});
  footer.querySelector('[data-back]').hidden=index===0;
  footer.querySelector('[data-next]').innerHTML=(index===1?'Revisar envío':'Continuar')+' '+uiIcon('arrow');
  const notice=[...form.children].find(element=>element.classList.contains('notice'));if(notice)notice.hidden=index!==1;
  if(focus){dialog.scrollTop=0;const heading=groups[index][0].querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
  storeDraft();
 }
 function validateStep(index){
  form.querySelector('.form-error-summary')?.remove();
  const inputs=groups[index].flatMap(section=>[...section.querySelectorAll('input,select,textarea')]);
  const errors=inputs.filter(input=>!input.disabled&&!input.checkValidity()).map(control=>[control,control.validationMessage]);
  const add=(control,message)=>{if(!errors.some(([existing])=>existing===control))errors.push([control,message])};
  if(index===0&&kind==='ciudadana'&&!editing.citizen)add(form.querySelector('[name=identity]'),'Verifica la identidad del ciudadano antes de continuar');
  if(index===1&&!files.length)add(form.querySelector('#files'),'Adjunta al menos un documento PDF');
  if(index===1&&kind==='ciudadana'&&!editing.validated)add(form.querySelector('#validation'),'Completa la validación del descargo de responsabilidad');
  if(errors.length){
   showStep(index);
   errors.forEach(([control,message],position)=>{if(!control.id)control.id='send-invalid-'+index+'-'+position;showFieldError(control,message,false)});
   if(errors.length===1)errors[0][0].focus();
   else{
    const summary=document.createElement('div');summary.className='form-error-summary';summary.tabIndex=-1;summary.setAttribute('role','alert');summary.setAttribute('aria-labelledby','sendErrorTitle');
    summary.innerHTML=`<h3 id="sendErrorTitle">Revisa ${errors.length} campos para continuar</h3><ul>${errors.map(([control,message])=>`<li data-error-for="${control.id}"><a href="#${control.id}">${esc(control.labels?.[0]?.childNodes[0]?.textContent?.trim()||control.getAttribute('aria-label')||control.name)}: ${esc(message)}</a></li>`).join('')}</ul>`;
    summary.querySelectorAll('a').forEach(link=>link.onclick=event=>{event.preventDefault();document.getElementById(link.hash.slice(1))?.focus()});
    form.prepend(summary);summary.focus();
   }
   return false;
  }
  return true;
 }
 footer.querySelector('[data-back]').onclick=()=>showStep(Math.max(0,current-1),true);
 stepper.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.step);if(index<=current)showStep(index,true)});
 form.onsubmit=event=>{
  event.preventDefault();storeDraft();
  if(!validateStep(current))return;
  if(current<1){showStep(current+1,true);return}
  for(let index=0;index<2;index++)if(!validateStep(index))return;
  originalSubmit(event);
 };
 showStep(current);
 if(resumeReview&&validateStep(0)&&validateStep(1))review();
}
function refreshAccountPresentation(entry){
 const name=$('#accountName'),office=$('#accountOffice'),institution=$('#activeInstitutionLabel');
 if(name)name.textContent=entry?.user.name||'Sin usuario activo';
 if(office)office.textContent=entry?.window.name||'Selecciona un usuario';
 if(institution)institution.textContent=inst(active)?.name||'Selecciona institución';
 for(const source of [institution,name,office])if(source)source.title=source.textContent;
 const institutionSelect=$('#session'),userSelect=$('#sessionUser');
 if(institutionSelect)institutionSelect.title=institution?.textContent||'';
 if(userSelect)userSelect.title=[name?.textContent,office?.textContent].filter(Boolean).join(' · ');
}
document.addEventListener('click',event=>{const menu=$('#accountMenu');if(menu?.open&&!menu.contains(event.target))menu.open=false});
