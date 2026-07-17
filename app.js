const PLAN_INFO = {
  trotar:{icon:"🏃",label:"Ir a trotar"}, salidita:{icon:"🌄",label:"Salidita"},
  sorprendeme:{icon:"🎁",label:"Sorpréndeme"}, juntos:{icon:"♥",label:"Solo estar juntos"},
  comer:{icon:"🍽️",label:"Salir a comer"}
};
const $ = (selector) => document.querySelector(selector);
let currentBlob = null;
let currentData = null;

function todayISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatDate(value) { return new Intl.DateTimeFormat("es-EC",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(`${value}T12:00:00`)); }
function openModal() { $("#appointmentForm").reset(); $("#fecha").value=todayISO(); $("#hora").value="19:00"; $("#appointmentModal").classList.add("open"); $("#appointmentModal").setAttribute("aria-hidden","false"); document.body.classList.add("modal-open"); setTimeout(()=>$("#plan").focus(),250); }
function closeModal() { $("#appointmentModal").classList.remove("open"); $("#appointmentModal").setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }
function closeResult() { $("#resultModal").classList.remove("open"); $("#resultModal").setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }
function openGallery() { $("#galleryView").classList.add("open"); $("#galleryView").setAttribute("aria-hidden","false"); document.body.classList.add("modal-open"); setTimeout(()=>$(".gallery-close").focus(),250); }
function closeGallery() { $("#galleryView").classList.remove("open"); $("#galleryView").setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2500); }

function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3) {
  const words=(text||"").split(/\s+/); let line=""; let lines=0;
  for (let i=0;i<words.length;i++) { const test=`${line}${words[i]} `; if(ctx.measureText(test).width>maxWidth&&line){ ctx.fillText(line.trim(),x,y); line=`${words[i]} `; y+=lineHeight; lines++; if(lines===maxLines-1){ line+=words.slice(i+1).join(" "); break; } } else line=test; }
  if(line) ctx.fillText(line.trim(),x,y); return y;
}

function roundedRect(ctx,x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
function drawInvitation(data) {
  const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1350; const ctx=canvas.getContext("2d");
  ctx.fillStyle="#080b0a"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="rgba(215,25,32,.75)"; ctx.lineWidth=3; ctx.strokeRect(55,55,970,1240);
  ctx.fillStyle="rgba(215,25,32,.055)"; ctx.font="bold 760px Arial"; ctx.textAlign="center"; ctx.fillText("7",800,1160);
  ctx.fillStyle="#d71920"; ctx.font="bold 52px Arial"; ctx.fillText("⚽",540,145);
  ctx.fillStyle="#ef3037"; ctx.font="bold 25px Arial"; ctx.letterSpacing="5px"; ctx.fillText("PLANES",540,210);
  ctx.fillStyle="#f6f7f5"; ctx.font="italic bold 76px Arial"; wrapText(ctx,PLAN_INFO[data.plan].label.toUpperCase(),540,330,850,85,2);
  ctx.fillStyle="#151c18"; roundedRect(ctx,125,515,830,330,8);
  ctx.textAlign="left"; ctx.fillStyle="#ef3037"; ctx.font="40px Arial"; ctx.fillText(PLAN_INFO[data.plan].icon,180,600);
  ctx.fillStyle="#f6f7f5"; ctx.font="bold 29px Arial"; ctx.fillText(PLAN_INFO[data.plan].label.toUpperCase(),245,598);
  ctx.font="27px Arial"; ctx.fillStyle="#c3cbc6";
  ctx.fillText(`FECHA   ${formatDate(data.fecha).toUpperCase()}`,180,675);
  ctx.fillText(`HORA     ${data.hora}`,180,730);
  if(data.descripcion){ ctx.textAlign="center"; ctx.fillStyle="#aab3ae"; ctx.font="italic 31px Arial"; wrapText(ctx,`“${data.descripcion}”`,540,960,780,48,3); }
  ctx.fillStyle="#f6f7f5"; ctx.font="bold 26px Arial"; ctx.fillText(data.creado_por?`ATT: ${data.creado_por.toUpperCase()}`:"JUNTOS SOMOS MÁS FUERTES",540,1160);
  ctx.fillStyle="#d71920"; ctx.font="42px Arial"; ctx.fillText("♥",540,1225);
  return canvas;
}

async function showInvitation(data) {
  const canvas=drawInvitation(data); currentData=data;
  currentBlob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png",1));
  $("#invitationPreview").src=URL.createObjectURL(currentBlob);
  closeModal(); $("#resultModal").classList.add("open"); $("#resultModal").setAttribute("aria-hidden","false"); document.body.classList.add("modal-open");
  const file=new File([currentBlob],"invitacion-nuestros-dias.png",{type:"image/png"});
  $("#shareButton").hidden=!(navigator.share&&navigator.canShare?.({files:[file]}));
}

function downloadImage() { const a=document.createElement("a"); a.href=URL.createObjectURL(currentBlob); a.download="invitacion-nuestros-dias.png"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function shareImage() {
  const file=new File([currentBlob],"invitacion-nuestros-dias.png",{type:"image/png"});
  try { await navigator.share({files:[file],title:"Nuestra cita",text:"Tengo una invitación para ti ♥"}); } catch(error) { if(error.name!=="AbortError") toast("No se pudo compartir; puedes descargarla"); }
}
function openWhatsApp() {
  const d=currentData; const text=`Tengo un plan para ti ♥\n\n${PLAN_INFO[d.plan].label}\n📅 ${formatDate(d.fecha)}\n🕐 ${d.hora}\n\n${d.descripcion||""}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener");
}

$("#appointmentForm").addEventListener("submit",async(event)=>{ event.preventDefault(); const f=new FormData(event.currentTarget); const data=Object.fromEntries(f.entries()); const button=event.currentTarget.querySelector("button[type=submit]"); button.disabled=true; button.textContent="Creando..."; try{ await showInvitation(data); }catch(error){ $("#formError").textContent="No se pudo crear la imagen. Intenta otra vez."; console.error(error); }finally{ button.disabled=false; button.innerHTML='Crear la invitación <span>→</span>'; } });
document.addEventListener("click",event=>{ if(event.target.closest("[data-open-modal]"))openModal(); if(event.target.closest("[data-close-modal]"))closeModal(); if(event.target.closest("[data-close-result]"))closeResult(); if(event.target.closest("[data-open-gallery]"))openGallery(); if(event.target.closest("[data-close-gallery]"))closeGallery(); });
$("#shareButton").addEventListener("click",shareImage); $("#downloadButton").addEventListener("click",downloadImage); $("#whatsappButton").addEventListener("click",openWhatsApp);
document.addEventListener("keydown",event=>{ if(event.key==="Escape"){closeModal();closeResult();closeGallery();} });
