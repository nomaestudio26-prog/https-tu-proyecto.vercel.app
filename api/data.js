const {querySource,contentPage,profilePage,highlightRows}=require("./_notion");

module.exports=async function handler(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Método no permitido."});}
  try{
    const token=process.env.NOTION_TOKEN||process.env.NOTION_ACCESS_TOKEN;
    const contentId=process.env.NOTION_CONTENT_SOURCE_ID;
    if(!token||!contentId)return res.status(200).json({demo:true,posts:[],profile:null,highlights:[]});
    const [content,profile,highlights]=await Promise.all([
      querySource(contentId),
      querySource(process.env.NOTION_PROFILE_SOURCE_ID),
      querySource(process.env.NOTION_HIGHLIGHTS_SOURCE_ID)
    ]);
    const posts=content.map(contentPage).filter(x=>!x.hidden).sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||a.order-b.order||String(b.date).localeCompare(String(a.date)));
    res.setHeader("Cache-Control","s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json({
      demo:false,posts,
      profile:profile.length?profilePage(profile[0]):null,
      highlights:highlightRows(highlights)
    });
  }catch(e){return res.status(500).json({error:e.message||"No se pudieron consultar las bases."});}
};
