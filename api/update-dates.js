const {request}=require("./_notion");
module.exports=async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Método no permitido."});}
  try{
    const updates=Array.isArray(req.body?.updates)?req.body.updates:[];
    const dateProperty=req.body?.dateProperty||process.env.NOTION_DATE_PROPERTY||"Fecha de publicación";
    if(!updates.length||updates.length>20)return res.status(400).json({error:"Actualizaciones inválidas."});
    for(const item of updates){
      if(!item.id)continue;
      await request(`/v1/pages/${item.id}`,{method:"PATCH",body:JSON.stringify({
        properties:{[dateProperty]:{date:item.date?{start:item.date}:null}}
      })});
    }
    return res.status(200).json({ok:true,updated:updates.length});
  }catch(e){return res.status(500).json({error:e.message||"No se actualizaron las fechas."});}
};
