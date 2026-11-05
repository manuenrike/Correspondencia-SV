// Synthetic context data; captures stay in the existing git-ignored artifacts directory.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function capture(){
 const stage=process.argv[2]||'after';
 if(!['before','after'].includes(stage))throw Error('Use before or after');
 const output=path.resolve(__dirname,'../artifacts/context-selector');fs.mkdirSync(output,{recursive:true});
 const browser=await require('playwright').chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  const tab=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await tab.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await tab.evaluate(()=>{active='I4';session();render()});
  await tab.locator('#accountMenu').screenshot({path:path.join(output,`${stage}-selector-desktop.png`)});
  await tab.screenshot({path:path.join(output,`${stage}-desktop.png`)});
  await tab.locator('#accountMenu summary').click();
  await tab.screenshot({path:path.join(output,`${stage}-desktop-open.png`)});
  await tab.keyboard.press('Escape');
  await tab.setViewportSize({width:375,height:900});
  await tab.locator('[data-open-menu]').click();
  await tab.locator('#accountMenu summary').scrollIntoViewIfNeeded();
  await tab.screenshot({path:path.join(output,`${stage}-mobile.png`)});
  await tab.locator('#accountMenu summary').click();
  await tab.screenshot({path:path.join(output,`${stage}-mobile-open.png`)});
  console.log('Context captures: '+output);
 }finally{await browser.close()}
}
capture().catch(error=>{console.error(error);process.exitCode=1});
