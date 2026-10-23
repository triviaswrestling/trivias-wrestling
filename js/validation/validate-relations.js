/* MI WRESTLING 2.0 | RELATION VALIDATION */
(function(){
  "use strict";
  function idsOf(items){
    return new Set((Array.isArray(items)?items:[]).map(item=>String(item?.id??"").trim()).filter(Boolean));
  }
  function validateRelations(data,rules=[]){
    const errors=[];
    const warnings=[];
    for(const rule of rules){
      const source=Array.isArray(data[rule.from])?data[rule.from]:[];
      const targetIds=idsOf(data[rule.to]);
      for(let index=0;index<source.length;index++){
        const record=source[index];
        const raw=record?.[rule.field];
        if(raw===null||raw===undefined||raw===""){
          if(rule.required)errors.push({code:"MISSING_RELATION",from:rule.from,to:rule.to,index,field:rule.field,message:rule.from+"["+index+"] necesita una referencia en "+rule.field});
          continue;
        }
        const values=Array.isArray(raw)?raw:[raw];
        for(const value of values){
          const id=String(value?.id??value??"").trim();
          if(!targetIds.has(id)){
            const issue={code:"BROKEN_RELATION",from:rule.from,to:rule.to,index,field:rule.field,value:id,message:rule.from+"["+index+"] referencia un ID inexistente en "+rule.to+": "+id};
            (rule.severity==="warning"?warnings:errors).push(issue);
          }
        }
      }
    }
    return {valid:errors.length===0,errors,warnings};
  }
  window.MIW_RELATIONS=Object.freeze({validateRelations});
})();
