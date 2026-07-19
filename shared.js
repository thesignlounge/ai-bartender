const STORAGE_KEY = "the-sign-menu-v4";
const CATALOG_STORAGE_KEY = "the-sign-catalog-v12";
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

function loadMenuData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return clone(window.LIVE_MENU_DATA || window.MENU_SEED);
  try{
    const parsed = JSON.parse(raw);
    return parsed && parsed.drinks ? parsed : clone(window.MENU_SEED);
  }catch{
    return clone(window.MENU_SEED);
  }
}

function saveMenuData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("the-sign-menu-updated"));
}

function resetMenuData(){ localStorage.removeItem(STORAGE_KEY); }

function loadCatalogData(){
  const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
  const seed = Array.isArray(window.LIVE_CATALOG_DATA) ? window.LIVE_CATALOG_DATA : (Array.isArray(window.V11_CATALOG) ? window.V11_CATALOG : []);
  if(!raw) return clone(seed);
  try{
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(seed);
  }catch{
    return clone(seed);
  }
}

function saveCatalogData(data){
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("the-sign-catalog-updated"));
}

function resetCatalogData(){ localStorage.removeItem(CATALOG_STORAGE_KEY); }

function euro(value){
  const n = Number(value);
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2).replace(".", ",")}`;
}

function activeLang(){ return localStorage.getItem("the-sign-language") || "en"; }
function setActiveLang(lang){ localStorage.setItem("the-sign-language", lang); }
function bySort(a,b){ return (a.sort ?? 9999) - (b.sort ?? 9999) || a.name.localeCompare(b.name); }
