
/* MI WRESTLING 2.0 | APP CORE */
(function(){
  "use strict";
  const config=window.MIW_CONFIG;
  const app={
    started:false,
    page:"",
    version:config?.version||"unknown",
    errors:[],
    registerError(error,context="general"){
      const entry={
        message:error instanceof Error?error.message:String(error),
        context,
        time:new Date().toISOString()
      };
      this.errors.push(entry);
      document.dispatchEvent(new CustomEvent("miw:error",{detail:entry}));
      return entry;
    },
    setPage(name){
      this.page=String(name||"").trim();
      document.documentElement.dataset.page=this.page;
    },
    async start(){
      if(this.started)return this;
      this.started=true;
      this.setPage(document.body.dataset.page||location.pathname.split("/").pop().replace(/\.html$/i,"")||"home");
      document.documentElement.dataset.app="mi-wrestling";
      document.documentElement.dataset.version=this.version;
      document.dispatchEvent(new CustomEvent("miw:ready",{detail:{page:this.page,version:this.version}}));
      return this;
    }
  };
  window.MIW_APP=app;
  function boot(){
    app.start().catch(error=>app.registerError(error,"startup"));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
  window.addEventListener("unhandledrejection",event=>{
    app.registerError(event.reason,"promise");
  });
})();
