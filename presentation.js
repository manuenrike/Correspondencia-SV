// Presentation-only navigation. Native dialog provides mobile focus containment.
(() => {
 const sidebar=document.querySelector('#appSidebar');
 const drawer=document.querySelector('#mobileNavigation');
 const slot=document.querySelector('#mobileNavSlot');
 const opener=document.querySelector('[data-open-menu]');
 const home=document.createComment('sidebar-home');
 sidebar.before(home);
 const desktop=matchMedia('(min-width: 900px)');
 function restoreSidebar(){home.after(sidebar);opener.setAttribute('aria-expanded','false')}
 function closeMenu(){if(drawer.open)drawer.close();restoreSidebar()}
 function openMenu(){
  if(desktop.matches)return;
  slot.append(sidebar);opener.setAttribute('aria-expanded','true');drawer.showModal();
  drawer.querySelector('[data-close-menu]').focus();
 }
 opener.addEventListener('click',openMenu);
 drawer.querySelector('[data-close-menu]').addEventListener('click',closeMenu);
 drawer.addEventListener('close',restoreSidebar);
 drawer.addEventListener('cancel',event=>{event.preventDefault();closeMenu()});
 drawer.addEventListener('click',event=>{if(event.target===drawer){const rect=drawer.getBoundingClientRect();if(event.clientX>rect.right||event.clientY>rect.bottom)closeMenu()}});
 desktop.addEventListener('change',()=>{if(desktop.matches)closeMenu()});
 document.addEventListener('click',event=>{
  const nav=event.target.closest('#appSidebar [data-page]');
  if(nav){closeMenu();document.querySelector('#main').focus({preventScroll:true});return}
  if(event.target.closest('[data-open-workspace]')){
   closeMenu();document.querySelector('#accountMenu').open=true;
   queueMicrotask(()=>document.querySelector('#session').focus());return;
  }
  const action=event.target.closest('[data-ui-page]');
  if(action){resetTrayFilters();page=action.dataset.uiPage;box=action.dataset.uiBox||'all';filter=action.dataset.uiFilter||'';render();document.querySelector('#main').focus({preventScroll:true})}
 });
 document.addEventListener('keydown',event=>{const menu=document.querySelector('#accountMenu');if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus()}});
 document.addEventListener('focusin',keepToastClearOfFocus);
})();
