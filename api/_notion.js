const NOTION_VERSION = "2026-03-11";

function headers(){
  const token=process.env.NOTION_TOKEN || process.env.NOTION_ACCESS_TOKEN;
  if(!token)throw new Error("Falta NOTION_TOKEN.");
  return {"Authorization":`Bearer ${token}`,"Notion-Version":NOTION_VERSION,"Content-Type":"application/json"};
}
async function request(path,options={}){
  const r=await fetch(`https://api.notion.com${path}`,{...options,headers:{...headers(),...(options.headers||{})}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.message||`Notion respondió ${r.status}`);
  return data;
}
async function querySource(id){
  if(!id)return [];
  let cursor=null;const rows=[];
  do{
    const body={page_size:100};if(cursor)body.start_cursor=cursor;
    const data=await request(`/v1/data_sources/${id}/query`,{method:"POST",body:JSON.stringify(body)});
    rows.push(...(data.results||[]));cursor=data.has_more?data.next_cursor:null;
  }while(cursor&&rows.length<1000);
  return rows;
}
function prop(properties,names){for(const name of names)if(properties?.[name])return properties[name];}
function text(p){return [...(p?.title||[]),...(p?.rich_text||[])].map(x=>x.plain_text||x.text?.content||"").join("");}
function select(p){return p?.select?.name||p?.status?.name||"";}
function number(p){return p?.number??null;}
function date(p){return p?.date?.start||"";}
function checkbox(p){return Boolean(p?.checkbox);}
function url(p){return p?.url||"";}
function files(p){
  return (p?.files||[]).map(x=>({
    url:x.file?.url||x.external?.url||"",
    kind:(x.type==="file"?x.file?.url:x.external?.url||"").match(/\.(mp4|mov|webm)(\?|$)/i)?"video":"image"
  })).filter(x=>x.url);
}
function singleFile(p){return files(p)[0]?.url||"";}
function pageTitle(page){return text(prop(page.properties,["Título","Titulo","Contenido","Name","Title"]))||"Sin título";}

function contentPage(page){
  const p=page.properties||{};
  const attached=files(prop(p,["Archivos","Attachment","Adjuntos","Media","Portada"]));
  const external=url(prop(p,["Link","URL","Imagen URL","External URL"]));
  const canva=url(prop(p,["Canva","Canva URL","Link Canva"]));
  const source=select(prop(p,["Imagen","Fuente","Source"]));
  let media=attached;
  if(!media.length && canva)media=[{url:canva,kind:"embed"}];
  if(!media.length && external)media=[{url:external,kind:external.match(/\.(mp4|mov|webm)(\?|$)/i)?"video":"image"}];
  return {
    id:page.id,title:pageTitle(page),
    date:date(prop(p,["Fecha de publicación","Fecha","Publication Date"])),
    status:select(prop(p,["Estado","Status"])),
    format:select(prop(p,["Formato","Format","Tipo"])),
    source,pillar:select(prop(p,["Pilar","Pilar de contenido","Content Pillar"])),
    media,caption:text(prop(p,["Caption","Copy","Descripción"])),
    hashtags:text(prop(p,["Hashtags","Etiquetas"])),
    music:text(prop(p,["Música","Musica","Song"])),
    likes:number(prop(p,["Likes","Me gusta"]))??0,
    pinned:checkbox(prop(p,["Fijado","Fijar","Pinned"])),
    hidden:checkbox(prop(p,["Ocultar","Hide"])),
    order:number(prop(p,["Orden","Order"]))??9999
  };
}
function profilePage(page){
  const p=page?.properties||{};
  const avatar=singleFile(prop(p,["Foto de perfil","Avatar","Profile photo"]))||url(prop(p,["Foto URL","Avatar URL"]));
  const user=text(prop(p,["Usuario","Username"]));
  const rawLink=url(prop(p,["Link","Website","Sitio web"]));
  return {
    avatar,user:user?(user.startsWith("@")?user:`@${user}`):"@usuario",
    name:text(prop(p,["Nombre","Name"])),bio:text(prop(p,["Descripción","Bio","Description"])),
    link:rawLink,linkText:text(prop(p,["Texto link","Link text"]))||rawLink.replace(/^https?:\/\//,"").replace(/\/$/,"")
  };
}
function highlightRows(pages){
  if(!pages.length)return [];
  const first=pages[0], props=first.properties||{}, wide=[];
  for(let i=1;i<=10;i++){
    const name=text(prop(props,[`Highlight ${i} Nombre`,`Highlight ${i} Name`]));
    const image=singleFile(prop(props,[`Highlight ${i} Foto`,`Highlight ${i} Image`]))||url(prop(props,[`Highlight ${i} URL`]));
    if(name||image)wide.push({name,image});
  }
  if(wide.length)return wide;
  return pages.map(page=>{
    const p=page.properties||{};
    return {name:text(prop(p,["Nombre","Name","Título","Title"])),image:singleFile(prop(p,["Foto","Imagen","Image"]))||url(prop(p,["Foto URL","Image URL"]))};
  }).filter(x=>x.name||x.image);
}
module.exports={request,querySource,contentPage,profilePage,highlightRows};
