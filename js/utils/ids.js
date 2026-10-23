/* MI WRESTLING 2.0 | ID UTILITIES */
(function(){
  "use strict";
  const RESERVED=new Set(["__proto__","prototype","constructor"]);
  function normalizeId(value){
    if(value===null||value===undefined)return "";
    return String(value).trim();
  }
  function isValidId(value){
    const id=normalizeId(value);
    return Boolean(id)&&!RESERVED.has(id)&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id);
  }
  function slugify(value){
    return String(value??"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"");
  }
  function findDuplicates(items,key="id"){
    const seen=new Set();
    const duplicates=new Set();
    for(const item of Array.isArray(items)?items:[]){
      const value=normalizeId(item?.[key]);
      if(!value)continue;
      if(seen.has(value))duplicates.add(value);
      seen.add(value);
    }
    return [...duplicates];
  }
  function createUniqueId(base,existingIds){
    const root=slugify(base);
    if(!root)throw new Error("No se puede crear un ID sin un nombre válido");
    const used=new Set([...existingIds||[]].map(normalizeId));
    if(!used.has(root))return root;
    let index=2;
    while(used.has(root+"-"+index))index++;
    return root+"-"+index;
  }
  window.MIW_IDS=Object.freeze({normalizeId,isValidId,slugify,findDuplicates,createUniqueId});
})();
