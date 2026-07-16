
const STORAGE_KEY = "the-sign-menu-v4";
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

function loadMenuData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return clone(window.MENU_SEED);
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

function resetMenuData(){
  localStorage.removeItem(STORAGE_KEY);
}

function euro(value){
  const n = Number(value);
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2).replace(".", ",")}`;
}

function activeLang(){
  return localStorage.getItem("the-sign-language") || "en";
}

function setActiveLang(lang){
  localStorage.setItem("the-sign-language", lang);
}

function bySort(a,b){
  return (a.sort ?? 9999) - (b.sort ?? 9999) || a.name.localeCompare(b.name);
}
