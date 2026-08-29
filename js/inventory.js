import {supabase,shell,setApp,esc,toast,openModal,canManage,qs,csvDownload,logActivity} from "./app.js";
const p=await shell("Inventory");if(!p)throw 0;
let categories=[],rows=[];
async function load(){
 const [c,i]=await Promise.all([
  supabase.from("categories").select("id,name").eq("status","active").order("name"),
  supabase.from("inventory_items").select("*,categories(name)").neq("status","archived").order("created_at",{ascending:false})
 ]);
 if(c.error||i.error)throw c.error||i.error;categories=c.data||[];rows=i.data||[];
 setApp(`<div class="flex flex-wrap items-end justify-between gap-3 mb-5"><div><h1 class="text-3xl font-black">Inventory</h1><p class="text-sm text-slate-500">Manage OSI property, equipment and supplies.</p></div><div class="flex gap-2"><button id="export" class="btn btn-secondary">Export CSV</button>${canManage(p)?`<button id="add" class="btn btn-primary">+ Add item</button>`:""}</div></div>
 <div class="card"><div class="p-4 border-b flex flex-wrap gap-3"><input id="search" class="input max-w-sm" placeholder="Search item, code, location..."><select id="condition" class="select max-w-xs"><option value="">All conditions</option>${["good","fair","damaged","lost"].map(v=>`<option value="${v}">${v[0].toUpperCase()+v.slice(1)}</option>`).join("")}</select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Item</th><th>Category</th><th>Qty</th><th>Available</th><th>Condition</th><th>Location</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div></div>`);
 const render=()=>{const q=qs("#search").value.toLowerCase(),co=qs("#condition").value;qs("#rows").innerHTML=rows.filter(x=>(!q||`${x.item_code||""} ${x.name||""} ${x.location||""}`.toLowerCase().includes(q))&&(!co||x.condition===co)).map(x=>`<tr><td>${esc(x.item_code||"—")}</td><td><div class="font-bold">${esc(x.name)}</div><div class="text-xs text-slate-500">${esc(x.unit||"pcs")}</div></td><td>${esc(x.categories?.name||"Uncategorized")}</td><td>${x.quantity}</td><td class="font-bold">${Math.max(0,x.quantity-x.borrowed_quantity)}</td><td><span class="badge ${x.condition==="good"?"badge-green":x.condition==="damaged"||x.condition==="lost"?"badge-red":"badge-orange"}">${esc(x.condition)}</span></td><td>${esc(x.location||"—")}</td><td>${canManage(p)?`<button data-id="${x.id}" class="edit btn btn-secondary !py-1.5">Edit</button>`:"—"}</td></tr>`).join("")||`<tr><td colspan="8" class="text-center py-8 text-slate-500">No inventory items found.</td></tr>`};
 qs("#search").oninput=render;qs("#condition").onchange=render;render();
 if(canManage(p)){qs("#add").onclick=()=>formModal();qsa(".edit").forEach(b=>b.onclick=()=>formModal(rows.find(x=>x.id===b.dataset.id)))}
 qs("#export").onclick=()=>csvDownload(rows.map(x=>({code:x.item_code,name:x.name,category:x.categories?.name||"",quantity:x.quantity,borrowed:x.borrowed_quantity,available:x.quantity-x.borrowed_quantity,condition:x.condition,location:x.location||"",value:x.value||0,supplier:x.supplier||"",acquisition_date:x.acquisition_date||""})),"osi-inventory.csv");
}
function qsa(s){return [...document.querySelectorAll(s)]}
function formModal(item={}){
 const m=openModal(item.id?"Edit inventory item":"Add inventory item",`<form id="f" class="grid gap-4 sm:grid-cols-2">
 <div><label class="label">Item name *</label><input name="name" class="input" required value="${esc(item.name||"")}"></div>
 <div><label class="label">Item code</label><input name="item_code" class="input" value="${esc(item.item_code||"")}"></div>
 <div><label class="label">Category</label><select name="category_id" class="select"><option value="">Uncategorized</option>${categories.map(c=>`<option value="${c.id}" ${item.category_id===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div><label class="label">Quantity *</label><input name="quantity" type="number" min="${item.id?item.borrowed_quantity||0:0}" class="input" required value="${item.quantity??0}"></div>
 <div><label class="label">Unit</label><input name="unit" class="input" value="${esc(item.unit||"pcs")}"></div>
 <div><label class="label">Condition</label><select name="condition" class="select">${["good","fair","damaged","lost"].map(v=>`<option value="${v}" ${item.condition===v?"selected":""}>${v}</option>`).join("")}</select></div>
 <div><label class="label">Location</label><input name="location" class="input" value="${esc(item.location||"")}"></div>
 <div><label class="label">Value (PHP)</label><input name="value" type="number" step="0.01" min="0" class="input" value="${item.value??0}"></div>
 <div><label class="label">Supplier</label><input name="supplier" class="input" value="${esc(item.supplier||"")}"></div>
 <div><label class="label">Acquisition date</label><input name="acquisition_date" type="date" class="input" value="${item.acquisition_date||""}"></div>
 <div class="sm:col-span-2"><label class="label">Description / notes</label><textarea name="description" class="textarea">${esc(item.description||"")}</textarea></div>
 <div class="sm:col-span-2 flex gap-2"><button class="btn btn-primary flex-1">${item.id?"Save changes":"Add item"}</button>${item.id?`<button type="button" id="archive" class="btn btn-danger">Archive</button>`:""}</div></form>`);
 qs("#f",m).onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.quantity=Number(d.quantity);d.value=Number(d.value||0);if(d.quantity<Number(item.borrowed_quantity||0)){toast("Quantity cannot be below currently borrowed quantity.",false);return}delete d.notes;d.updated_at=new Date().toISOString();if(!item.id)d.created_by=p.id;const r=item.id?await supabase.from("inventory_items").update(d).eq("id",item.id):await supabase.from("inventory_items").insert(d);if(r.error){toast(r.error.message,false);return}await logActivity(item.id?"Updated inventory item":"Created inventory item","inventory_items",item.id||null,{name:d.name});toast(item.id?"Item updated":"Item added");m.remove();load().catch(e=>toast(e.message,false))};
 if(item.id)qs("#archive").onclick=async()=>{if(!confirm("Archive this inventory item?"))return;const r=await supabase.from("inventory_items").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",item.id);if(r.error){toast(r.error.message,false);return}toast("Item archived");m.remove();load()};
}
load().catch(e=>toast(e.message,false));
