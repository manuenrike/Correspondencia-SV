// Demonstration catalogues shared by the browser and the central initializer.
const names=['Ministerio de Gobernación','Ministerio de Salud','Ministerio de Educación','Alcaldía de San Salvador Centro','Defensoría del Consumidor'];
const seed=()=>({institutions:names.map((name,i)=>({id:'I'+(i+1),name,acronym:['MIGOBDT','MINSAL','MINED','AMSSC','DC'][i],active:true,windows:Array.from({length:5},(_,j)=>({id:`V${i+1}${j+1}`,name:['Correspondencia general','Atención ciudadana','Secretaría general','Gestión documental','Dirección administrativa'][j],users:Array.from({length:5},(_,k)=>({id:`U${i}${j}${k}`,name:['Ana Martínez','Carlos Hernández','María López','José García','Sofía Rodríguez'][k],email:['ana','carlos','maria','jose','sofia'][k]+'@institucion.gob.sv',active:true}))}))})),citizens:[{type:'DUI',number:'01234567-8',name:'Roberto Hernández'},{type:'DUI',number:'02345678-9',name:'María Isabel López'},{type:'Pasaporte Salvadoreño',number:'A12345678',name:'Carlos Méndez'},{type:'Carnet de residente',number:'R0012345',name:'Lucía Ramírez'},{type:'DUI',number:'03456789-0',name:'José Antonio Pérez'}],records:[],drafts:[]});
const additionalTestCitizens = [
  {type:'DUI',number:'05308231-0',name:'Ciudadano de prueba 1'},
  {type:'DUI',number:'06186995-4',name:'Ciudadano de prueba 2'},
  {type:'DUI',number:'05303430-9',name:'Ciudadano de prueba 3'},
  {type:'DUI',number:'05225248-3',name:'Ciudadano de prueba 4'},
  {type:'DUI',number:'05396177-6',name:'Ciudadano de prueba 5'}
];
if(typeof module!=='undefined'&&module.exports)module.exports={seed,additionalTestCitizens};
