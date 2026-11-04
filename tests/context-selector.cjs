const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function run(playwright,executablePath){
 const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{
  const tab=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
  tab.on('pageerror',error=>errors.push(error.message));
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const menu=tab.locator('#accountMenu'),trigger=menu.locator('summary'),panel=tab.locator('#contextOptions');
  async function openContext(){
   if(tab.viewportSize().width<900&&!await tab.locator('#mobileNavigation').evaluate(e=>e.open))await tab.locator('[data-open-menu]').click();
   if(!await menu.evaluate(e=>e.open))await trigger.click();
   await tab.waitForFunction(()=>document.querySelector('#accountMenu summary').getAttribute('aria-expanded')==='true');
  }
  await trigger.focus();await tab.keyboard.press('Enter');
  await tab.waitForFunction(()=>document.querySelector('#accountMenu').open);
  await tab.keyboard.press('Tab');assert.equal(await tab.locator('#session').evaluate(e=>e===document.activeElement),true);
  await tab.locator('#session').selectOption('I4');
  const institution='Alcaldía de San Salvador Centro';
  assert.equal(await tab.locator('#activeInstitutionLabel').textContent(),institution);
  assert.equal(await tab.locator('#session').getAttribute('title'),institution);
  assert.equal(await panel.locator('select').count(),2);
  assert.equal(await panel.locator('dl,.account-popover-heading').count(),0);
  assert.equal(await tab.locator('#activeInstitutionLabel').getAttribute('title'),institution);
  const key=await tab.evaluate(()=>availableSessionUsers().find(entry=>entry.window.id==='V42').key);
  await tab.locator('#sessionUser').selectOption(key);
  assert.equal(await tab.locator('#accountOffice').textContent(),'Atención ciudadana');
  assert.match(await tab.locator('#sessionUser').getAttribute('title'),/Atención ciudadana/);
  assert.equal(await tab.evaluate(()=>localStorage.getItem('csv-user-I4')),key);
  await tab.locator('#session').selectOption('I1');await tab.locator('#session').selectOption('I4');
  assert.equal(await tab.locator('#sessionUser').inputValue(),key);
  await tab.keyboard.press('Escape');
  assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert.equal(await trigger.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  await tab.keyboard.press('Space');await tab.waitForFunction(()=>document.querySelector('#accountMenu').open);
  const client=await tab.context().newCDPSession(tab);
  const documentNode=await client.send('DOM.getDocument');
  const {nodeId}=await client.send('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector:'#accountMenu summary'});
  const ax=await client.send('Accessibility.getPartialAXTree',{nodeId});
  const accessible=ax.nodes.find(node=>!node.ignored&&node.name?.value?.includes(institution));
  assert.ok(accessible,'full institution must remain in the browser accessibility tree');
  assert.match(accessible.name.value,/Ana Martínez/);assert.match(accessible.name.value,/Atención ciudadana/);
  assert.ok(accessible.properties.some(property=>property.name==='expanded'&&property.value.value===true));
  await tab.keyboard.press('Escape');
  // Only the pre-existing routing and persistence handlers perform session changes.
  await openContext();await tab.locator('#session').selectOption('I1');
  const general=await tab.evaluate(()=>availableSessionUsers().find(entry=>entry.window.id==='V11').key);
  await tab.locator('#sessionUser').selectOption(general);
  await tab.evaluate(()=>{
   const record=(id,toWindow)=>({id,kind:'institucional',from:'I2',fromWindow:'V21',to:'I1',toWindow,subject:id,created:now(),status:'pending',files:[],messages:[],events:[]});
   db.records=[record('GENERAL','V11'),record('CIUDADANA','V12')];page='institucional';render();
  });
  assert.deepEqual(await tab.locator('#results .card-meta .code').allTextContents(),['GENERAL']);
  const citizenWindow=await tab.evaluate(()=>availableSessionUsers().find(entry=>entry.window.id==='V12').key);
  await tab.locator('#sessionUser').selectOption(citizenWindow);
  assert.deepEqual(await tab.locator('#results .card-meta .code').allTextContents(),['CIUDADANA']);
  const snapshot=await tab.evaluate(()=>JSON.stringify(db.records));
  await tab.locator('#session').selectOption('I4');assert.equal(await tab.evaluate(()=>JSON.stringify(db.records)),snapshot);
  await tab.keyboard.press('Escape');
  for(const width of [320,375,768,1024,1440]){
   await tab.setViewportSize({width,height:900});await openContext();
   assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow '+width);
   assert.equal(await panel.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'panel overflow '+width);
   assert.ok(await trigger.evaluate(e=>e.getBoundingClientRect().height>=44));
   if(width>=900){
    assert.equal(await tab.locator('#appSidebar').evaluate(e=>e.getBoundingClientRect().width),232);
    assert.ok(await trigger.evaluate(e=>e.getBoundingClientRect().height<=88),'compact context selector '+width);
    const rect=await panel.boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=900);
   }
   await tab.keyboard.press('Tab');assert.equal(await tab.locator('#session').evaluate(e=>e===document.activeElement),true);
   const box=await tab.locator('#session').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=900,'focused select visible '+width);
   await tab.keyboard.press('Escape');await tab.waitForFunction(()=>document.querySelector('#accountMenu summary').getAttribute('aria-expanded')==='false');
   if(width<900){assert.equal(await tab.locator('#mobileNavigation').evaluate(e=>e.open),true);await tab.keyboard.press('Escape')}
  }
  await openContext();await tab.locator('#main h1').click();assert.equal(await menu.evaluate(e=>e.open),false);
  // Extreme content wraps in the trigger and is fully available in the open panel.
  const longName='InstituciónDeCoordinaciónInterinstitucionalYGestiónDocumental'.repeat(3);
  await tab.evaluate(longName=>{
   inst(active).name=longName;
   const entry=availableSessionUsers().find(entry=>entry.key===document.querySelector('#sessionUser').value);
   entry.user.name='María Alejandra Hernández de la Coordinación Institucional';
   entry.window.name='Ventanilla de correspondencia y seguimiento de documentación institucional';session();
  },longName);
  await openContext();assert.equal(await tab.locator('#session').getAttribute('title'),longName);
  assert.equal(await tab.locator('#activeInstitutionLabel').getAttribute('title'),longName);
  assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await trigger.evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  assert.equal(await panel.evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  assert.equal(await tab.locator('.account-chevron').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await tab.keyboard.press('Escape');
  // The empty-user state continues to use the existing session fallback.
  await tab.evaluate(()=>{for(const window of inst(active).windows)for(const user of window.users)user.active=false;session()});
  assert.equal(await tab.locator('#accountName').textContent(),'Sin usuario activo');
  assert.equal(await tab.locator('#sessionUser').isDisabled(),true);
  assert.deepEqual(errors,[]);
  return 'PASS: full context names, keyboard, accessibility tree, Escape, long text, 5 widths, session persistence, window isolation and empty-user state';
 }finally{await browser.close()}
}
module.exports=run;
if(require.main===module)run(require('playwright'),process.env.BROWSER_PATH).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
