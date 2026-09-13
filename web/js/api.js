const API_URL = "https://script.google.com/macros/s/AKfycbyH37YSjvJ76UeOoKpF3BAkz6pI0Gy22CTouq8xpXtjz_LESCIETBZpwlXLvQatt8g/exec"; // Paste your Google Apps Script /exec URL here.

async function api(action, payload={}) {
  if (!API_URL) return {ok:false, offline:true, error:"Backend is not connected yet. Add the Apps Script /exec URL in js/api.js."};
  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({action,...payload})
    });
    return await res.json();
  } catch (err) {
    return {ok:false,error:"Unable to reach the BUYE backend. Check the Apps Script deployment and URL."};
  }
}
function setSession(user){localStorage.setItem("buye_session",JSON.stringify(user))}
function getSession(){try{return JSON.parse(localStorage.getItem("buye_session")||"null")}catch(e){return null}}
function clearSession(){localStorage.removeItem("buye_session")}
