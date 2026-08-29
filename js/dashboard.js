import {supabase,shell,setApp,money,fmtDate,esc,canManage,logActivity} from "./app.js";
const p=await shell("Dashboard");if(!p)throw 0;
async function load(){
 const [inv,req,bor,funds,tx]=await Promise.all([
  supabase.from("inventory_items").select("id").neq("status","archived"),
  supabase.from("borrow_requests").select("id").eq("status","pending"),
  supabase.from("borrowings").select("id,quantity").in("status",["active","overdue"]),
  supabase.from("cash_funds").select("id,name,balance,status").eq("status","active").order("name"),
  supabase.from("finance_transactions").select("*,cash_funds(name)").order("transaction_date",{ascending:false}).order("created_at",{ascending:false}).limit(8)
 ]);
 for(const r of [inv,req,bor,funds,tx])if(r.error)throw r.error;
 const net=(tx.data||[]).reduce((s,x)=>s+(x.type==="income"?1:-1)*Number(x.amount||0),0);
 setApp(`<div class="flex flex-wrap justify-between gap-4 mb-7"><div><div class="text-orange-600 font-bold">FEBIAS College of Bible · OSI</div><h1 class="text-4xl font-black mt-1">Good day, ${esc(p.full_name?.split(" ")[0]||"there")}.</h1><p class="text-slate-500">Operational snapshot for inventory and finances.</p></div>${canManage(p)?`<a href="inventory.html" class="btn btn-primary h-fit">+ Add inventory</a>`:""}</div>
 <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
 ${stat("INVENTORY ITEMS",inv.data?.length||0,"Active records")}${stat("PENDING REQUESTS",req.data?.length||0,"Need review")}${stat("CURRENTLY BORROWED",(bor.data||[]).reduce((s,x)=>s+Number(x.quantity||0),0),"Open borrowings")}${stat("CASH FUNDS",money((funds.data||[]).reduce((s,x)=>s+Number(x.balance||0),0),),"Active funds")}${stat("RECENT NET",money(net),"Latest ledger records")}
 </div>
 <div class="grid xl:grid-cols-[1.7fr_1fr] gap-6">
 <section class="card"><div class="p-5 border-b flex justify-between"><div><h2 class="text-lg font-black">Recent financial activity</h2><p class="text-sm text-slate-500">Latest income and expense records</p></div><a href="finance.html" class="text-orange-600 font-bold">Open finance →</a></div>
 <div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Fund</th><th>Amount</th></tr></thead><tbody>${(tx.data||[]).map(x=>`<tr><td>${fmtDate(x.transaction_date)}</td><td><span class="badge ${x.type==="income"?"badge-green":"badge-red"}">${esc(x.type)}</span></td><td>${esc(x.description)}</td><td>${esc(x.cash_funds?.name||"—")}</td><td class="font-bold">${money(x.amount)}</td></tr>`).join("")||emptyRow(5,"No finance records yet.")}</tbody></table></div></section>
 <section class="card"><div class="p-5 border-b"><h2 class="text-lg font-black">Cash funds</h2><p class="text-sm text-slate-500">Current balances</p></div><div class="p-5 grid gap-3">${(funds.data||[]).map(f=>`<div class="rounded-xl border p-4"><div class="flex justify-between font-black"><span>${esc(f.name)}</span><span>${money(f.balance)}</span></div><div class="text-sm text-slate-500 mt-1">${esc(f.status)}</div></div>`).join("")||`<p class="text-slate-500">No active funds.</p>`}</div></section>
 </div>`);
}
const stat=(a,b,c)=>`<div class="stat"><div class="text-xs font-black tracking-wider text-slate-500">${a}</div><div class="text-3xl font-black mt-3">${b}</div><div class="text-sm text-slate-500 mt-2">${c}</div></div>`;
const emptyRow=(n,t)=>`<tr><td colspan="${n}" class="text-center py-8 text-slate-500">${t}</td></tr>`;
load().catch(e=>toast(e.message,false));
