/* MI WRESTLING 2.0 | DATA LOADER */
(function(){
  "use strict";
  const config=window.MIW_CONFIG;
  if(!config)throw new Error("Cargá js/core/config.js antes de data-loader.js");
  const cache=new Map();
  const pending=new Map();
  async function loadJSON(path,options={}){
    const url=config.url(path);
    const useCache=options.cache!==false&&config.cache;
    if(useCache&&cache.has(url))return cache.get(url);
    if(pending.has(url))return pending.get(url);
    const request=(async()=>{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),config.requestTimeout);
      try{
        const response=await fetch(url,{
          method:"GET",
          headers:{Accept:"application/json"},
          cache:options.refresh?"no-cache":"default",
          signal:controller.signal
        });
        if(!response.ok)throw new Error("HTTP "+response.status+" al cargar "+path);
        const type=response.headers.get("content-type")||"";
        if(type&&!/json/i.test(type)&&!/\+json/i.test(type))throw new Error("La respuesta no parece JSON: "+path);
        let data;
        try{data=await response.json()}
        catch(error){throw new Error("JSON inválido en "+path+": "+error.message)}
        if(useCache)cache.set(url,data);
        return data;
      }catch(error){
        if(error.name==="AbortError")throw new Error("Tiempo agotado al cargar "+path);
        throw error;
      }finally{
        clearTimeout(timeout);
        pending.delete(url);
      }
    })();
    pending.set(url,request);
    return request;
  }
  async function loadIndex(name,options={}){
    const path=config.paths.indexes+config.files[name];
    if(!config.files[name])throw new Error("Índice desconocido: "+name);
    return loadJSON(path,options);
  }
  async function loadMany(paths,options={}){
    const entries=Object.entries(paths||{});
    const results=await Promise.all(entries.map(async([key,path])=>[key,await loadJSON(path,options)]));
    return Object.fromEntries(results);
  }
  function clearCache(path){
    if(path)cache.delete(config.url(path));
    else cache.clear();
  }
  function getCached(path){
    return cache.get(config.url(path));
  }
  window.MIW_DATA=Object.freeze({
    loadJSON,
    loadIndex,
    loadMany,
    clearCache,
    getCached
  });
})();
