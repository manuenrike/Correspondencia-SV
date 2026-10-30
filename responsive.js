// Keep mobile table labels in sync with live filters and dynamically opened dialogs
function prepareResponsiveTables(){
 document.querySelectorAll('table').forEach(table=>{
  if(table.parentElement?.classList.contains('table-wrap')!==true){
   const wrapper=document.createElement('div');wrapper.className='table-wrap';
   table.before(wrapper);wrapper.append(table);
  }
  const headings=[...table.querySelectorAll('thead th')].map(heading=>heading.textContent.trim());
  table.querySelectorAll('tbody tr').forEach(row=>{
   const cells=[...row.children];
   cells.forEach((cell,index)=>{
    const label=headings[index]||'';
    if(cell.getAttribute('data-label')!==label)cell.setAttribute('data-label',label);
    cell.classList.toggle('table-empty-cell',cell.colSpan>1);
   });
  });
 });
}
let responsiveFrame;
const responsiveObserver=new MutationObserver(()=>{
 cancelAnimationFrame(responsiveFrame);
 responsiveFrame=requestAnimationFrame(prepareResponsiveTables);
});
responsiveObserver.observe(document.body,{childList:true,subtree:true});
prepareResponsiveTables();
