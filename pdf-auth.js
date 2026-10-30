// PDF originals remain in IndexedDB; the stamped copy is stored separately
const authenticationJobs = new Map();
function recordDocuments(record) {
  return [...(record.files || []), ...(record.disclaimer ? [record.disclaimer] : []), ...(record.messages || []).flatMap(message => message.files || [])];
}
function resolveDocumentContext(id) {
  const sent = findDocumentRecord(id);
  if(sent)return {record:sent,file:recordDocuments(sent).find(file=>file.id===id),source:'sent'};
  if(editing){
    const file=recordDocuments(editing).find(file=>file.id===id);
    if(file)return {record:editing,file,source:'draft'};
  }
  for(const draft of db.drafts){
    const file=recordDocuments(draft).find(file=>file.id===id);
    if(file)return {record:draft,file,source:'draft'};
  }
  for(const [key,draft] of replyDrafts){
    const file=draft.files.find(file=>file.id===id);
    if(!file)continue;
    const record=db.records.find(record=>key===record.id+':'+active);
    if(record){file.submittedBy=active;return {record,file,source:'reply'}};
  }
  return null;
}
function findDocumentRecord(id) {
  return db.records.find(r => recordDocuments(r).some(f => f.id === id));
}
async function authenticatedPDF(record, file) {
  const jobKey=record.id+':'+file.id;
  if (authenticationJobs.has(jobKey)) return authenticationJobs.get(jobKey);
  const previous=authenticationJobs.get(file.id);
  if(previous)await previous;
  const job = stampPDF(record, file).finally(() => {authenticationJobs.delete(jobKey);if(authenticationJobs.get(file.id)===job)authenticationJobs.delete(file.id)});
  authenticationJobs.set(jobKey, job);authenticationJobs.set(file.id,job);
  return job;
}
async function stampPDF(record, file) {
  if (file.authenticatedId && file.authenticatedRecordId === record.id && file.authenticationVersion === 3 && file.authenticatedPageCount) {
    const cached = await getFile(file.authenticatedId);
    if (cached) return cached;
  }
  if (!window.PDFLib || !window.QRCode) throw Error('No se cargaron las bibliotecas de autenticación');
  const original = await getFile(file.id);
  if (!original) throw Error('El documento original no está disponible en este navegador');
  const bytes = await original.arrayBuffer();
  const pdf = await PDFLib.PDFDocument.load(new Uint8Array(bytes));
  // Never overwrite a signed source; all changes go into a separate copy
  const token = file.token || uid() + uid();
  const verificationURL = location.href.split('#')[0] + '#verificar=' + encodeURIComponent(token);
  const holder = document.createElement('div');
  new QRCode(holder, {text: verificationURL, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M});
  const canvas = holder.querySelector('canvas');
  if (!canvas) throw Error('No se pudo generar el QR');
  const qrImage = await pdf.embedPng(canvas.toDataURL('image/png'));
  const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
  const lastIndex = pdf.getPageCount() - 1;
  const last = pdf.getPages()[lastIndex];
  const crop = last.getCropBox();
  const rotation = ((last.getRotation().angle % 360) + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const width = sideways ? crop.height : crop.width;
  const height = sideways ? crop.width : crop.height;
  const footerHeight = 126;
  // Place the original vector content above a reserved footer, without covering it
  const embedded = await pdf.embedPage(last, {left:crop.x,bottom:crop.y,right:crop.x+crop.width,top:crop.y+crop.height});
  const page = pdf.addPage([width, height + footerHeight]);
  const offsets = {0:[0,0],90:[0,crop.width],180:[crop.width,crop.height],270:[crop.height,0]};
  const [offsetX, offsetY] = offsets[rotation] || offsets[0];
  page.drawPage(embedded, {x:offsetX,y:footerHeight+offsetY,width:crop.width,height:crop.height,rotate:PDFLib.degrees(-rotation)});
  pdf.removePage(lastIndex);
  const navy = PDFLib.rgb(28/255,30/255,77/255);
  const gray = PDFLib.rgb(.40,.43,.50);
  const qrSize = Math.min(92, width * .25);
  const margin = Math.min(20, width * .04);
  const qrX = width - margin - qrSize;
  page.drawRectangle({x:0,y:0,width,height:footerHeight,color:PDFLib.rgb(1,1,1)});
  page.drawLine({start:{x:margin,y:footerHeight-1},end:{x:width-margin,y:footerHeight-1},thickness:.6,color:PDFLib.rgb(.86,.87,.92)});
  page.drawImage(qrImage,{x:qrX,y:22,width:qrSize,height:qrSize});
  const safe = value => String(value || '').replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
  const textWidth = qrX-margin-14;
  const line = (text,y,size=8,color=gray) => {
    let label=safe(text);
    while(label.length && font.widthOfTextAtSize(label,size)>textWidth)label=label.slice(0,-1);
    page.drawText(label,{x:margin,y,size,font,color});
  };
  const registeredAt = file.authenticatedAt || now();
  line('Correspondencia SV | Registro de autenticidad',101,9,navy);
  line('Documento: '+file.id,84);
  line('Correspondencia: '+record.id,69);
  line('Remitente: '+inst(file.submittedBy || record.from)?.name,54);
  line('Registrado: '+date(registeredAt),39);
  line('Consulta local de demostración | No es firma electrónica certificada',23,6);
  page.drawText('Verificar registro',{x:qrX,y:11,size:7,font,color:navy});
  pdf.setProducer('Correspondencia SV');
  const stamped = new Blob([await pdf.save()], {type:'application/pdf'});
  const authenticatedId = file.id + '-autenticado-v3';
  await putFile(authenticatedId, stamped);
  Object.assign(file, {token, authenticatedId, authenticatedRecordId:record.id, authenticationVersion:3, authenticatedPageCount:pdf.getPageCount(), authenticatedAt:registeredAt, authenticatedSize:stamped.size});
  return stamped;
}
