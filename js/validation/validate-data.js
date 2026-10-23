/* MI WRESTLING 2.0 | DATA VALIDATION */
(function(){
  "use strict";
  function validateCollection(items,options={}){
    const errors=[];
    const warnings=[];
    const collection=options.name||"colección";
    const idField=options.idField||"id";
    if(!Array.isArray(items)){
      return {valid:false,errors:[{code:"NOT_ARRAY",collection,message:"La colección debe ser un array"}],warnings};
    }
    const seen=new Set();
    items.forEach((item,index)=>{
      const location=collection+"["+index+"]";
      if(!item||typeof item!=="object"||Array.isArray(item)){
        errors.push({code:"INVALID_RECORD",collection,index,message:location+" no es un objeto válido"});
        return;
      }
      const id=window.MIW_IDS?.normalizeId(item[idField])||"";
      if(!id){
        errors.push({code:"MISSING_ID",collection,index,message:location+" no tiene ID"});
      }else{
        if(!window.MIW_IDS?.isValidId(id)){
          errors.push({code:"INVALID_ID",collection,index,id,message:location+" tiene un ID inválido: "+id});
        }
        if(seen.has(id)){
          errors.push({code:"DUPLICATE_ID",collection,index,id,message:"ID duplicado en "+collection+": "+id});
        }
        seen.add(id);
      }
      for(const field of options.required||[]){
        if(item[field]===undefined||item[field]===null||item[field]===""){
          errors.push({code:"MISSING_FIELD",collection,index,field,message:location+" no tiene el campo obligatorio "+field});
        }
      }
      for(const field of options.dateFields||[]){
        if(item[field]!=null&&item[field]!==""&&!window.MIW_DATES?.parseDate(item[field])){
          warnings.push({code:"INVALID_DATE",collection,index,field,message:location+" tiene una fecha que necesita revisión: "+field});
        }
      }
    });
    return {valid:errors.length===0,errors,warnings,count:items.length};
  }
  function validateNumberRange(value,min=0,max=100){
    return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max;
  }
  window.MIW_VALIDATE=Object.freeze({validateCollection,validateNumberRange});
})();
