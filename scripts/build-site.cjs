const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');
fs.mkdirSync(output,{recursive:true});
// Publish only browser assets, never server modules, tests or environment files.
for(const file of fs.readdirSync(root)){
 if(/\.(html|css|js)$/.test(file))fs.copyFileSync(path.join(root,file),path.join(output,file));
}
fs.cpSync(path.join(root,'vendor'),path.join(output,'vendor'),{recursive:true});
fs.writeFileSync(path.join(output,'storage-config.js'),'globalThis.CSV_SHARED_STORAGE ??= true;\n');
console.log('Static application prepared in dist/');
