// Presentation-only navigation. Native dialog provides mobile focus containment.
(() => {
 const sidebar=document.querySelector('#appSidebar');
 const drawer=document.querySelector('#mobileNavigation');
 const slot=document.querySelector('#mobileNavSlot');
 const opener=document.querySelector('[data-open-menu]');
 const home=document.createComment('sidebar-home');
 sidebar.before(home);
 const desktop=matchMedia('(min-width: 900px)');
 const contextMenu=document.querySelector('#accountMenu');
 const contextTrigger=contextMenu.querySelector('summary');
 const contextOptions=document.querySelector('#contextOptions');
 function positionContextOptions(){
  if(!contextMenu.open)return;
  if(!desktop.matches){contextOptions.style.removeProperty('left');contextOptions.style.removeProperty('top');return}
  const margin=16,trigger=contextTrigger.getBoundingClientRect();
  const width=contextOptions.getBoundingClientRect().width,height=contextOptions.offsetHeight;
  const left=Math.max(margin,Math.min(sidebar.getBoundingClientRect().right+12,innerWidth-width-margin));
  const top=Math.max(margin,Math.min(trigger.bottom-height,innerHeight-height-margin));
  contextOptions.style.left=left+'px';contextOptions.style.top=top+'px';
 }
 contextMenu.addEventListener('toggle',()=>{
  contextTrigger.setAttribute('aria-expanded',String(contextMenu.open));
  positionContextOptions();
  if(contextMenu.open&&!desktop.matches)contextMenu.scrollIntoView({block:'nearest',behavior:'auto'});
 });
 new ResizeObserver(positionContextOptions).observe(contextOptions);
 window.addEventListener('resize',positionContextOptions);
 sidebar.addEventListener('scroll',positionContextOptions);
 function restoreSidebar(){home.after(sidebar);opener.setAttribute('aria-expanded','false')}
 function closeMenu(){contextMenu.open=false;if(drawer.open)drawer.close();restoreSidebar()}
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
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&contextMenu.open){event.preventDefault();event.stopPropagation();contextMenu.open=false;contextTrigger.focus()}});
 document.addEventListener('focusin',keepToastClearOfFocus);
})();
