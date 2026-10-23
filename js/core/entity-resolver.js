
/* MI WRESTLING 2.0 | ENTITY RESOLVER */
(function(){
  "use strict";
  function normalize(value){
    return String(value??"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim()
      .replace(/\s+/g," ")
      .toLocaleLowerCase("es");
  }
  function validCollection(items){
    if(Array.isArray(items))return items;
    if(items&&typeof items==="object")return Object.values(items);
    return [];
  }
  function getId(entity){
    return entity&&typeof entity==="object"&&entity.id!=null?String(entity.id).trim():"";
  }
  function byId(items,id){
    const target=String(id??"").trim();
    if(!target)return null;
    return validCollection(items).find(item=>getId(item)===target)||null;
  }
  function byName(items,name,fields=["name","nombre","title","nombreCompleto"]){
    const target=normalize(name);
    if(!target)return null;
    const matches=validCollection(items).filter(item=>
      item&&fields.some(field=>normalize(item[field])===target)
    );
    return matches.length===1?matches[0]:null;
  }
  function findAllByName(items,name,fields=["name","nombre","title","nombreCompleto"]){
    const target=normalize(name);
    if(!target)return [];
    return validCollection(items).filter(item=>
      item&&fields.some(field=>normalize(item[field])===target)
    );
  }
  function resolve(items,reference,options={}){
    if(reference&&typeof reference==="object"){
      const id=getId(reference);
      if(id){
        const match=byId(items,id);
        if(match)return {status:"resolved",entity:match,method:"id"};
      }
      reference=reference.name??reference.nombre??reference.title??"";
    }
    const value=String(reference??"").trim();
    if(!value)return {status:"missing",entity:null,method:null};
    const idMatch=byId(items,value);
    if(idMatch)return {status:"resolved",entity:idMatch,method:"id"};
    const matches=findAllByName(items,value,options.fields);
    if(matches.length===1)return {status:"resolved",entity:matches[0],method:"name"};
    if(matches.length>1)return {status:"ambiguous",entity:null,matches,method:"name"};
    return {status:"not-found",entity:null,method:null};
  }
  window.MIW_ENTITY=Object.freeze({
    normalize,
    getId,
    byId,
    byName,
    findAllByName,
    resolve
  });
})();
