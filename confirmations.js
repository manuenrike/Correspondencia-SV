let confirmationOpen = false;
function confirmAction({title='Confirmar acción',message,confirmLabel='Confirmar',danger=false}) {
  if(confirmationOpen)return Promise.resolve(false);
  confirmationOpen=true;
  const previousFocus=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.className='confirmation-dialog';
  dialog.setAttribute('aria-labelledby','confirmation-title');
  dialog.setAttribute('aria-describedby','confirmation-description');
  dialog.innerHTML=`<div class="confirmation-top"><span class="confirmation-icon ${danger?'is-danger':''}" aria-hidden="true">${danger?'!':'✓'}</span><button type="button" class="close" data-cancel aria-label="Cerrar">×</button></div><div class="eyebrow">CORRESPONDENCIA SV</div><h2 id="confirmation-title">${esc(title)}</h2><p id="confirmation-description">${esc(message)}</p><div class="confirmation-actions"><button type="button" class="btn" data-cancel autofocus>Cancelar</button><button type="button" class="btn ${danger?'confirm-danger':'primary'}" data-confirm>${esc(confirmLabel)}</button></div>`;
  document.body.append(dialog);
  return new Promise(resolve=>{
    const finish=accepted=>{
      if(!confirmationOpen)return;
      dialog.close();dialog.remove();confirmationOpen=false;
      if(previousFocus?.isConnected)previousFocus.focus();
      resolve(accepted);
    };
    dialog.querySelectorAll('[data-cancel]').forEach(button=>button.onclick=()=>finish(false));
    dialog.querySelector('[data-confirm]').onclick=()=>finish(true);
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});
    // Escape only closes this confirmation, preserving the underlying form
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finish(false)}});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)finish(false)}});
    dialog.showModal();
  });
}
