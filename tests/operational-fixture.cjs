// Synthetic records used only in isolated browser contexts.
module.exports = function operationalFixture() {
 const record=(id,extra={})=>({id,kind:'institucional',from:'I2',fromWindow:'V21',to:'I1',toWindow:'V11',user:'Usuario de prueba',subject:'Solicitud de información '+id,summary:'Documentación para revisión de la ventanilla',type:'Oficio',priority:'Media',format:'Digital',requires:false,status:'pending',created:'2026-11-02T16:00:00.000Z',files:[],messages:[],events:[{text:'Correspondencia creada y enviada',at:'2026-11-02T16:00:00.000Z'}],...extra});
 db.records=[
  record('PENDIENTE',{priority:'Alta',subject:'Revisión del informe institucional'}),
  record('RESPUESTA',{status:'accepted',requires:true,subject:'Consulta sobre documentos recibidos',created:'2026-11-01T16:00:00.000Z',events:[{text:'Correspondencia aceptada',at:'2026-11-03T15:00:00.000Z'}]}),
  record('ENVIADO',{from:'I1',fromWindow:'V11',to:'I2',toWindow:'V21',requires:true}),
  record('ESPERANDO',{status:'accepted',requires:true,messages:[{institution:'I1',requires:true,text:'Esperamos su respuesta',at:'2026-11-03T14:00:00.000Z'}]}),
  record('FINALIZADO',{status:'accepted',requires:false}),
  record('RECHAZADO',{status:'rejected',requires:true}),
  record('CIUDADANO',{kind:'ciudadana',type:undefined,priority:undefined,subject:'Solicitud ciudadana de constancia',created:'2026-10-30T16:00:00.000Z'}),
  record('OTRA-VENTANILLA',{toWindow:'V14',subject:'Expediente privado de otra ventanilla'}),
  record('OTRO-ORIGEN',{from:'I1',fromWindow:'V14',to:'I2',toWindow:'V21'}),
  record('RESPUESTA-ORIGEN',{from:'I1',fromWindow:'V11',to:'I2',toWindow:'V21',status:'accepted',requires:true,messages:[{institution:'I2',requires:true,text:'Información adicional requerida',at:'2026-11-03T13:00:00.000Z'}]})
 ];
 render();
};
