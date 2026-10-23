
/* MI WRESTLING 2.0 | CORE CONFIG */
(function(){
  "use strict";
  const currentScript=document.currentScript;
  const scriptURL=currentScript?new URL(currentScript.src,location.href):new URL("./js/core/config.js",location.href);
  const marker="/js/core/config.js";
  const pathname=scriptURL.pathname;
  const basePath=pathname.endsWith(marker)?pathname.slice(0,-marker.length)+"/":new URL("../../",scriptURL).pathname;
  const config={
    name:"MI WRESTLING 2.0",
    version:"2.0.0",
    basePath:basePath.endsWith("/")?basePath:basePath+"/",
    paths:{
      data:"data/",
      indexes:"data/indexes/",
      images:"images/",
      css:"css/",
      js:"js/"
    },
    files:{
      wrestlers:"wrestlers-index.json",
      matches:"matches-index.json",
      events:"events-index.json",
      tournaments:"tournaments-index.json",
      championships:"championships-index.json",
      brands:"brands-index.json",
      seasons:"seasons-index.json",
      teams:"teams-index.json",
      personas:"personas-index.json",
      promotions:"promotions-index.json",
      recaps:"recaps-index.json"
    },
    cache:true,
    requestTimeout:15000
  };
  config.url=function(path){
    const clean=String(path||"").replace(/^\/+/,"");
    return new URL(clean,location.origin+config.basePath).href;
  };
  config.indexURL=function(name){
    const file=config.files[name];
    if(!file)throw new Error("Índice no registrado: "+name);
    return config.url(config.paths.indexes+file);
  };
  window.MIW_CONFIG=Object.freeze(config);
})();
