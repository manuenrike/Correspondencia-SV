// Shared keyboard and focus lifecycle for existing overlays and stacked PDF views.
const modalLayers = [];
let modalSequence = 0;
function activateModal(layer, onClose) {
 const previous = modalLayers.find(entry => entry.layer === layer);
 if (previous) modalLayers.splice(modalLayers.indexOf(previous), 1);
 const opener=previous?.opener || document.activeElement;
 const entry = {layer,onClose,opener,action:previous?.action || opener?.getAttribute('onclick'),page:previous?.page || opener?.dataset?.page};
 modalLayers.push(entry);
 const dialog = layer.querySelector('.dialog');
 dialog.setAttribute('role', 'dialog');
 dialog.setAttribute('aria-modal', 'true');
 dialog.tabIndex = -1;
 const heading = dialog.querySelector('h2');
 if (heading) {heading.id = 'modal-title-' + ++modalSequence; dialog.setAttribute('aria-labelledby', heading.id)}
 syncModalBackground();
 queueMicrotask(() => {if (modalLayers.at(-1) === entry) {const target = heading || dialog; target.tabIndex = -1; target.focus()}});
}
function syncModalBackground() {
 const top = modalLayers.at(-1)?.layer;
 for (const element of document.body.children) {
  if (!element.matches('aside,.shell,.overlay')) continue;
  if (top && element !== top) {
   if (!element.hasAttribute('data-modal-inert')) {element.dataset.modalInert = String(element.inert); element.inert = true}
  } else if (element.hasAttribute('data-modal-inert')) {
   element.inert = element.dataset.modalInert === 'true'; delete element.dataset.modalInert;
  }
 }
}
function deactivateModal(layer) {
 const index = modalLayers.findIndex(entry => entry.layer === layer);
 if (index < 0) return;
 const [entry] = modalLayers.splice(index, 1);
 syncModalBackground();
 if (entry.opener?.isConnected && !entry.opener.closest('[inert]')) entry.opener.focus();
 else {const replacement=[...document.querySelectorAll('button')].find(button=>entry.action?button.getAttribute('onclick')===entry.action:entry.page&&button.dataset.page===entry.page);(modalLayers.at(-1)?.layer.querySelector('.dialog') || replacement || document.querySelector('nav button.active'))?.focus()}
}
document.addEventListener('keydown', event => {
 if (confirmationOpen) return; // Native confirmation owns its keyboard lifecycle.
 const entry = modalLayers.at(-1);
 if (!entry) return;
 if (event.key === 'Escape') {event.preventDefault(); event.stopImmediatePropagation(); entry.onClose(); return}
 if (event.key !== 'Tab') return;
 const controls = [...entry.layer.querySelectorAll('button,input,select,textarea,a[href],iframe,[tabindex]')]
  .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[hidden],[inert]'));
 const first = controls[0], last = controls.at(-1), focused = document.activeElement;
 if (!first) {event.preventDefault(); entry.layer.querySelector('.dialog').focus()}
 else if (event.shiftKey && (focused === first || !controls.includes(focused))) {event.preventDefault(); last.focus()}
 else if (!event.shiftKey && (focused === last || !controls.includes(focused))) {event.preventDefault(); first.focus()}
}, true);
