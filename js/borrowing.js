import {supabase,shell,setApp,esc,toast,canManage,fmtDate} from "./app.js";
const p=await shell("Borrowing");if(!p)throw 0;
async function load(){
 const {data,error}=await supabase.from("borrowings").select("*,inventory_items(name,item_code),profiles:borrower_id(full_name,email)").order("borrowed_at",{ascending:false});if(error)throw error;
 setApp(`<div class="mb-5"><h1 class="text-3xl font-black">Borrowing</h1><p class="text-slate-500">Track active and historical borrowings.</p></div><div class="card table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Borrower</th><th>Qty</th><th>Borrowed</th><th>Due</th><th>Status</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td class="font-bold">${esc(x.inventory_items?.name||"—")}<div class="text-xs text-slate-500">${esc(x.inventory_items?.item_code||"")}</div></td><td>${esc(x.profiles?.full_name||"—")}</td><td>${x.quantity}</td><td>${fmtDate(x.borrowed_at)}</td><td>${fmtDate(x.return_due)}</td><td><span class="badge ${x.status==="returned"?"badge-green":x.status==="lost"?"badge-red":"badge-orange"}">${esc(x.status)}</span></td></tr>`).join("")||`<tr><td colspan="6" class="text-center py-8 text-slate-500">No borrowings.</td></tr>`}</tbody></table></div>`);
}
load().catch(e=>toast(e.message,false));
