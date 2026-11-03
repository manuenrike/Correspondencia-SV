function showFieldError(control,message){
 let error=control.parentElement.querySelector('.field-error');
 if(!error){error=document.createElement('span');error.className='field-error';error.id='field-error-'+control.name+'-'+control.id;error.setAttribute('role','alert');control.parentElement.append(error)}
 error.textContent=message;control.setAttribute('aria-invalid','true');
 const descriptions=new Set((control.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));descriptions.add(error.id);control.setAttribute('aria-describedby',[...descriptions].join(' '));control.focus();
 control.addEventListener('input',()=>{error.remove();control.removeAttribute('aria-invalid');descriptions.delete(error.id);control.setAttribute('aria-describedby',[...descriptions].join(' '))},{once:true});
}
function mountSendFlow(kind){
 const form=$('#correspondenceForm'),dialog=form.closest('.dialog');
 dialog.classList.add('is-composer');
 form.noValidate=true;
 const sections=[...form.children].filter(element=>element.classList.contains('form-section'));
 const groups=kind==='ciudadana'?[[sections[0],sections[1]],[sections[2],sections[3],sections[4]]]:[[sections[0]],[sections[1],sections[2]]];
 const labels=['Información','Destino y documentos','Revisión'];
 const stepper=dialog.querySelector('.stepbar');stepper.className='send-stepper';stepper.setAttribute('aria-label','Progreso del envío');
 stepper.innerHTML=labels.map((label,index)=>`<button type="button" data-step="${index}" ${index===2?'disabled':''}><span>${index+1}</span>${label}</button>`).join('');
 const footer=form.querySelector(':scope > .form-actions');footer.className='form-actions send-footer';
 footer.innerHTML=`<span class="send-save-status" role="status" aria-live="polite">${uiIcon('check')} Guardado automático</span><button type="button" class="btn" data-back>Anterior</button><button type="submit" class="btn primary" data-next>Continuar ${uiIcon('arrow')}</button>`;
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
  const inputs=groups[index].flatMap(section=>[...section.querySelectorAll('input,select,textarea')]);
  const invalid=inputs.find(input=>!input.disabled&&!input.checkValidity());
  if(invalid){showStep(index);showFieldError(invalid,invalid.validationMessage);return false}
  if(index===0&&kind==='ciudadana'&&!editing.citizen){showFieldError(form.querySelector('[name=identity]'),'Verifica la identidad del ciudadano antes de continuar');return false}
  if(index===1&&!files.length){showFieldError(form.querySelector('#files'),'Adjunta al menos un documento PDF');return false}
  if(index===1&&kind==='ciudadana'&&!editing.validated){showFieldError(form.querySelector('#validation'),'Completa la validación del descargo de responsabilidad');return false}
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
}
document.addEventListener('click',event=>{const menu=$('#accountMenu');if(menu?.open&&!menu.contains(event.target))menu.open=false});
