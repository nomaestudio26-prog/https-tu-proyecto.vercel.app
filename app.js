(() => {
"use strict";
const cfg = window.CONTENT_GRID_CONFIG || {};
const $ = (s) => document.querySelector(s);

const els = {
  grid: $("#grid"), empty: $("#empty"), notice: $("#modeNotice"),
  modal: $("#postModal"), modalMedia: $("#modalMedia"),
  prev: $("#prevMedia"), next: $("#nextMedia"), dots: $("#mediaDots")
};

const sampleProfile = {
  avatar:"/samples/avatar.svg", user:"@thejeweler", name:"Your trusted Jeweler",
  bio:"Silver. Stones. Stories.", link:"https://example.com", linkText:"thejeweler.com"
};
const sampleHighlights = ["New in","Collabs","Trends","Styling","Studio"].map((name,i)=>({
  name, image:`/samples/highlight-${String(i+1).padStart(2,"0")}.svg`
}));
const demoTitles = [
  "El stack perfecto para el día a día","Piedras que deberías conocer","Combinaciones 101: Plata y Oro",
  "Mini guía: cómo capear tus anillos","Joyas que nunca pasan de moda","Cómo usar perlas en 2025",
  "Por qué el plata se ve bien con todo","Outfit + joyas: tono tierra","La pulsera que uso todos los días",
  "Cómo limpiar tus joyas en casa","Aretes para cada ocasión","El anillo que lo cambia todo",
  "Behind the scenes: nuestra última sesión","Tendencias de joyería este año","Minimalismo en joyas: menos es más"
];
const demoPillars = ["Colaboración","Comunidad","Lifestyle","Behind the scenes","Lifestyle","Educativo","Inspiracional","Entretenimiento","Promocional"];
const demoPosts = demoTitles.map((title,i)=>({
  id:`demo-${i+1}`, title, date:`2026-04-${String(30-i).padStart(2,"0")}`,
  status:["En proceso","Listo","Idea","Diseñando","Programado","Publicado"][i%6],
  format:["Reel","Photo","Reel","Reel","Carousel","Photo"][i%6],
  source:"Link", pillar:demoPillars[i%demoPillars.length],
  media:[{url:`/samples/post-${String(i+1).padStart(2,"0")}.svg`,kind:"image"}],
  caption:"Las piezas más bonitas también pueden formar parte de todos los días.",
  hashtags:"#jewelry #pearls #slowfashion #contentplanning",
  music:i%3===0?"Pearls — Sade":"Música original", likes:100+i*23,
  pinned:i<3, hidden:false, order:i+1
}));

let state = {
  posts:[], profile:sampleProfile, highlights:sampleHighlights,
  tab:"grid", map:false, plan:false, profilePreview:false,
  columns:Number(cfg.defaultColumns)||3, dragId:null, modalIndex:0, modalPost:null
};

function setText(id,value){ const node=$(id); if(node) node.textContent=value || ""; }
function setLink(id,url,text){ const node=$(id); if(!node) return; node.href=url || "#"; node.textContent=text || url || ""; }
function profileToDom(){
  const p=state.profile || sampleProfile;
  ["#profileAvatar","#largeAvatar","#modalAvatar"].forEach(id=>{ const n=$(id); if(n) n.src=p.avatar || sampleProfile.avatar; });
  setText("#profileUser",p.user); setText("#largeUser",p.user); setText("#modalUser",p.user);
  setText("#profileName",p.name); setText("#largeName",p.name);
  setText("#profileBio",p.bio); setText("#largeBio",p.bio);
  setLink("#profileLink",p.link,p.linkText); setLink("#largeLink",p.link,p.linkText);
  $("#captionUser").textContent=p.user || "@usuario";
}
function renderHighlights(){
  const box=$("#highlights"); box.innerHTML="";
  state.highlights.forEach(h=>{
    const item=document.createElement("div"); item.className="highlight";
    const img=document.createElement("img"); img.src=h.image || "/samples/highlight-01.svg"; img.alt=h.name || "";
    const span=document.createElement("span"); span.textContent=h.name || "";
    item.append(img,span); box.appendChild(item);
  });
}
function notice(message){
  els.notice.textContent=message; els.notice.hidden=!message;
}
async function loadData(){
  $("#refreshBtn").disabled=true;
  $("#refreshBtn").textContent="↻ Loading";
  try{
    const r=await fetch("/api/data",{cache:"no-store"});
    const payload=await r.json();
    if(!r.ok) throw new Error(payload.error || "No se pudo cargar Notion");
    state.posts=payload.posts?.length ? payload.posts : demoPosts;
    state.profile=payload.profile || sampleProfile;
    state.highlights=payload.highlights?.length ? payload.highlights : sampleHighlights;
    notice(payload.demo ? "Demo: conecta tus fuentes de datos de Notion para ver tu contenido." : "");
  }catch(e){
    state.posts=demoPosts; state.profile=sampleProfile; state.highlights=sampleHighlights;
    notice("Demo local: el diseño funciona; falta conectar la base de Notion.");
  }finally{
    $("#refreshBtn").disabled=false; $("#refreshBtn").textContent="↻ Refresh";
    normalize(); profileToDom(); renderHighlights(); render();
  }
}
function normalize(){
  state.posts=state.posts
    .filter(p=>!p.hidden)
    .map((p,i)=>({...p,order:Number(p.order)||i+1,media:Array.isArray(p.media)?p.media:[]}))
    .sort((a,b)=>(Number(b.pinned)-Number(a.pinned)) || a.order-b.order || String(b.date).localeCompare(String(a.date)));
}
function visiblePosts(){
  return state.posts.filter(p=>{
    if(state.tab==="reels") return /reel/i.test(p.format||"");
    return true;
  }).slice(0,60);
}
function render(){
  const posts=visiblePosts();
  els.grid.innerHTML="";
  els.grid.className=`grid ${state.columns===5?"cols-5":""} ${state.map?"content-map":""}`;
  posts.forEach(p=>els.grid.appendChild(tile(p)));
  els.empty.hidden=posts.length>0;
  $("#profilePreview").hidden=!state.profilePreview;
  $("#mapBtn").classList.toggle("active",state.map);
  $("#planBtn").classList.toggle("active",state.plan);
  $("#profileBtn").classList.toggle("active",state.profilePreview);
  $("#columnsBtn").textContent=String(state.columns);
}
function tile(post){
  const el=document.createElement("article");
  el.className=`tile ${state.plan?"plan-mode":""}`;
  el.tabIndex=0; el.dataset.id=post.id; el.style.setProperty("--pillar-color",pillarColor(post.pillar));
  const media=post.media?.[0];
  el.appendChild(mediaNode(media,post.title,true));
  if(/carousel/i.test(post.format||"") || (post.media?.length||0)>1){
    const icon=document.createElement("span"); icon.className="format-icon"; icon.textContent="▱"; el.appendChild(icon);
  }else if(/reel/i.test(post.format||"")){
    const icon=document.createElement("span"); icon.className="format-icon"; icon.textContent="▻"; el.appendChild(icon);
  }
  if(post.pinned){ const pin=document.createElement("span"); pin.className="pin-icon"; pin.textContent="⌖"; el.appendChild(pin); }
  const label=document.createElement("span"); label.className="pillar-label"; label.textContent=post.pillar || "Sin pilar"; el.appendChild(label);
  const hover=document.createElement("div"); hover.className="hover-info";
  const strong=document.createElement("strong"); strong.textContent=post.title || "Sin título";
  const time=document.createElement("time"); time.textContent=formatDate(post.date);
  hover.append(strong,time); el.appendChild(hover);
  if(state.plan){ const date=document.createElement("span"); date.className="plan-date"; date.textContent=formatDate(post.date); el.appendChild(date); }
  el.addEventListener("click",()=>{ if(!state.plan) openPost(post); });
  el.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&!state.plan) openPost(post); });
  el.draggable=state.plan && !String(post.id).startsWith("demo-");
  el.addEventListener("dragstart",()=>{ state.dragId=post.id; el.classList.add("dragging"); });
  el.addEventListener("dragend",()=>{ state.dragId=null; el.classList.remove("dragging"); document.querySelectorAll(".drag-over").forEach(n=>n.classList.remove("drag-over")); });
  el.addEventListener("dragover",e=>{ if(!state.plan)return; e.preventDefault(); el.classList.add("drag-over"); });
  el.addEventListener("dragleave",()=>el.classList.remove("drag-over"));
  el.addEventListener("drop",e=>{ e.preventDefault(); el.classList.remove("drag-over"); swapDates(state.dragId,post.id); });
  return el;
}
function mediaNode(media,alt,tileMode=false){
  if(!media?.url){
    const img=document.createElement("img"); img.src="/samples/post-01.svg"; img.alt=alt||""; return img;
  }
  if(media.kind==="video"){
    const v=document.createElement("video"); v.src=media.url; v.muted=tileMode; v.loop=tileMode; v.playsInline=true; v.controls=!tileMode;
    if(tileMode) v.addEventListener("mouseenter",()=>v.play().catch(()=>{}));
    return v;
  }
  if(media.kind==="embed"){
    const iframe=document.createElement("iframe"); iframe.src=toEmbedUrl(media.url); iframe.loading="lazy"; iframe.allow="fullscreen"; iframe.title=alt||"Canva"; return iframe;
  }
  const img=document.createElement("img"); img.src=media.url; img.alt=alt||""; img.loading="lazy";
  img.onerror=()=>{img.src="/samples/post-01.svg";}; return img;
}
function toEmbedUrl(url){
  if(!url)return "";
  try{
    const u=new URL(url);
    if(u.hostname.includes("canva.com") && !u.searchParams.has("embed")) u.searchParams.set("embed","");
    return u.toString();
  }catch{return url;}
}
function pillarColor(value){
  const map={
    "Colaboración":"#c85d46","Comunidad":"#4f8b62","Lifestyle":"#3473a2",
    "Behind the scenes":"#8c5682","Educativo":"#d38442","Inspiracional":"#52778c",
    "Entretenimiento":"#9d6d3e","Promocional":"#4b7e8f"
  };
  return map[value] || "#5f7181";
}
function formatDate(value){
  if(!value)return "";
  const d=new Date(`${value}T12:00:00`);
  if(Number.isNaN(d.getTime()))return value;
  return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
async function swapDates(sourceId,targetId){
  if(!sourceId || sourceId===targetId)return;
  const a=state.posts.find(p=>p.id===sourceId), b=state.posts.find(p=>p.id===targetId);
  if(!a||!b)return;
  const oldA=a.date, oldB=b.date; a.date=oldB; b.date=oldA;
  state.posts.sort((x,y)=>String(y.date).localeCompare(String(x.date))); render();
  if(cfg.writeDatesToNotion===false)return;
  try{
    const r=await fetch("/api/update-dates",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({updates:[{id:a.id,date:a.date},{id:b.id,date:b.date}],dateProperty:cfg.datePropertyName||"Fecha de publicación"})});
    const payload=await r.json(); if(!r.ok)throw new Error(payload.error||"Error");
    notice("Fechas actualizadas en Notion.");
    setTimeout(()=>notice(""),1800);
  }catch(e){
    a.date=oldA;b.date=oldB;normalize();render();
    notice("Notion no guardó el cambio. Revisa el permiso de actualización y el nombre de la propiedad de fecha.");
  }
}
function openPost(post){
  state.modalPost=post; state.modalIndex=0;
  setText("#modalMusic",`♫ ${post.music || "Música original"}`);
  setText("#modalLikes",String(post.likes ?? 0));
  setText("#modalCaption",post.caption || "");
  setText("#modalHashtags",post.hashtags || "");
  setText("#modalDate",formatDate(post.date));
  renderModalMedia();
  els.modal.showModal();
}
function renderModalMedia(){
  const p=state.modalPost, media=p?.media || [];
  els.modalMedia.innerHTML="";
  els.modalMedia.appendChild(mediaNode(media[state.modalIndex],p?.title,false));
  const multi=media.length>1;
  els.prev.hidden=!multi; els.next.hidden=!multi;
  els.dots.innerHTML="";
  if(multi)media.forEach((_,i)=>{const dot=document.createElement("i");dot.classList.toggle("active",i===state.modalIndex);els.dots.appendChild(dot);});
}
function shiftMedia(dir){
  const count=state.modalPost?.media?.length||0;if(count<2)return;
  state.modalIndex=(state.modalIndex+dir+count)%count;renderModalMedia();
}

$("#refreshBtn").addEventListener("click",loadData);
$("#planBtn").addEventListener("click",()=>{state.plan=!state.plan; if(state.plan)notice("Plan grid: arrastra un post sobre otro para intercambiar sus fechas."); else notice(""); render();});
$("#mapBtn").addEventListener("click",()=>{state.map=!state.map;render();});
$("#profileBtn").addEventListener("click",()=>{state.profilePreview=!state.profilePreview;render();});
$("#columnsBtn").addEventListener("click",()=>{state.columns=state.columns===3?5:3;render();});
$("#themeBtn").addEventListener("click",()=>{
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=next;localStorage.setItem("content-grid-theme",next);
});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));state.tab=t.dataset.tab;render();
}));
$("#closeModal").addEventListener("click",()=>els.modal.close());
els.modal.addEventListener("click",e=>{if(e.target===els.modal)els.modal.close();});
els.prev.addEventListener("click",()=>shiftMedia(-1));els.next.addEventListener("click",()=>shiftMedia(1));

document.documentElement.dataset.theme=localStorage.getItem("content-grid-theme")||cfg.defaultTheme||"light";
loadData();
if(Number(cfg.refreshSeconds)>0)setInterval(loadData,Number(cfg.refreshSeconds)*1000);
})();
