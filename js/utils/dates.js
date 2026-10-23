/* MI WRESTLING 2.0 | DATE UTILITIES */
(function(){
  "use strict";
  function parseDate(value){
    if(value===null||value===undefined||value==="")return null;
    if(value instanceof Date)return Number.isNaN(value.getTime())?null:value;
    if(typeof value==="number"){
      const date=new Date(value);
      return Number.isNaN(date.getTime())?null:date;
    }
    const raw=String(value).trim();
    if(!raw)return null;
    let match;
    if((match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw))){
      const date=new Date(Date.UTC(+match[1],+match[2]-1,+match[3]));
      if(date.getUTCFullYear()!==+match[1]||date.getUTCMonth()!==+match[2]-1||date.getUTCDate()!==+match[3])return null;
      return date;
    }
    if(!/^\d{4}-\d{2}-\d{2}T/.test(raw))return null;
    const date=new Date(raw);
    return Number.isNaN(date.getTime())?null:date;
  }
  function toISODate(value){
    const date=parseDate(value);
    return date?date.toISOString().slice(0,10):null;
  }
  function compareDates(a,b){
    const first=parseDate(a);
    const second=parseDate(b);
    if(!first&&!second)return 0;
    if(!first)return 1;
    if(!second)return -1;
    return first.getTime()-second.getTime();
  }
  function sortByDate(items,key="date",direction="asc"){
    const factor=direction==="desc"?-1:1;
    return [...(Array.isArray(items)?items:[])].sort((a,b)=>factor*compareDates(a?.[key],b?.[key]));
  }
  function formatDate(value,locale="es-AR"){
    const date=parseDate(value);
    if(!date)return "Fecha desconocida";
    return new Intl.DateTimeFormat(locale,{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(date);
  }
  window.MIW_DATES=Object.freeze({parseDate,toISODate,compareDates,sortByDate,formatDate});
})();
