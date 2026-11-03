// Optional visual QA: writes synthetic screenshots to the git-ignored artifacts directory.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function capture(){
 const browser=await require('playwright').chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  const tab=await browser.newPage({reducedMotion:'reduce',timezoneId:'America/El_Salvador'});
  const output=path.resolve(__dirname,'../artifacts/operational');fs.mkdirSync(output,{recursive:true});
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  for(const width of [1440,375]){
   await tab.setViewportSize({width,height:1000});
   await tab.evaluate(()=>{db.records=[];page='inicio';render()});
   await tab.screenshot({path:path.join(output,`after-empty-${width}.png`),fullPage:true});
   await tab.evaluate(require('./operational-fixture.cjs'));
   for(const [name,view] of [['dashboard','inicio'],['tray','institucional'],['attention','atencion']]){
    await tab.evaluate(view=>{page=view;resetTrayFilters();render()},view);
    await tab.screenshot({path:path.join(output,`after-${name}-${width}.png`),fullPage:true});
   }
   await tab.locator('.tray-refinements summary').click();
   await tab.waitForFunction(()=>getComputedStyle(document.querySelector('#toast')).display==='none');
   await tab.screenshot({path:path.join(output,`after-filters-${width}.png`),fullPage:true});
   await tab.evaluate(()=>detail('RESPUESTA'));
   await tab.screenshot({path:path.join(output,`after-detail-${width}.png`)});
   await tab.keyboard.press('Escape');
   await tab.evaluate(()=>newCorrespondence('institucional'));
   await tab.screenshot({path:path.join(output,`after-form-${width}.png`)});
   await tab.keyboard.press('Escape');
  }
  console.log('Capturas: '+output);
 }finally{await browser.close()}
}
capture().catch(error=>{console.error(error);process.exitCode=1});
