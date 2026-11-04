// NODE_PATH may point at an existing Playwright installation; no package install required.
async function main(){
 const playwright=require('playwright');
 let failed=0;
 for(const name of ['phase1','phase2','window-scope','premium-ui','operational-ui','document-regression','modal-ui']){
  try{console.log(name+': '+await require('./'+name+'.cjs')(playwright,process.env.BROWSER_PATH))}
  catch(error){failed++;console.error(name+': FAIL',error)}
 }
 if(failed)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1});
