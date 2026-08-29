import {supabase,shell,setApp,esc,toast,openModal,isAdmin,isSuperAdmin,qs,roleName,logActivity} from "./app.js";
const p=await shell("Admin");if(!p)throw 0;
if(!isAdmin(p)){setApp(`<div class="card p-8"><h1 class="text-2xl font-black">Admin access required</h1><p class="mt-2 text-slate-500">Your role does not have access to this area.</p></div>`);throw 0}
async function load(){
 const [{data:users,error:uerr},{data:roles,error:rerr}]=await Promise.all([supabase.from("profiles").select("*,roles(id,name,permissions)").order("full_name"),supabase.from("roles").select("*").order("name")]);
 if(uerr||rerr)throw uerr||rerr;
 setApp(`<div class="mb-5"><h1 class="text-3xl font-black">Administration</h1><p class="text-sm text-slate-500">Manage account access and roles.</p><div class="mt-3 rounded-xl border bg-white p-4 text-sm"><b>Role policy:</b> Admin can grant Admin; only Super Admin can grant or modify Super Admin.</div></div><div class="card table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${(users||[]).map(u=>`<tr><td class="font-bold">${esc(u.full_name)}</td><td>${esc(u.email||"")}</td><td><span class="badge badge-orange">${esc(u.roles?.name||"unassigned")}</span></td><td>${esc(u.status)}</td><td><button data-id="${u.id}" class="edit btn btn-secondary !py-1.5">Edit access</button></td></tr>`).join("")||`<tr><td colspan="5" class="text-center py-8 text-slate-500">No users.</td></tr>`}</tbody></table></div>`);
 document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>edit(users.find(x=>x.id===b.dataset.id),roles));
}
function edit(u,roles){
 const current=roleName(u), selectable=roles.filter(r=>isSuperAdmin(p)||r.name!=="super_admin"&&current!=="super_admin");
 if(isSuperAdmin(p)&&!selectable.some(r=>r.name===current)){selectable.push(roles.find(r=>r.name===current))}
 const options=selectable.map(r=>`<option value="${r.id}" ${u.role_id===r.id?"selected":""}>${esc(r.name)}</option>`).join("");
 const m=openModal("Edit user access",`<form id="f" class="space-y-4"><div><label class="label">User</label><div class="rounded-xl bg-slate-50 p-3">${esc(u.full_name)} · ${esc(u.email||"")}</div></div><div><label class="label">Role</label><select name="role_id" class="select">${options}</select></div><div><label class="label">Status</label><select name="status" class="select"><option value="active" ${u.status==="active"?"selected":""}>active</option><option value="inactive" ${u.status==="inactive"?"selected":""}>inactive</option></select></div><button class="btn btn-primary w-full">Save access</button></form>`);
 qs("#f",m).onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(roleName(u)==="super_admin"&&!isSuperAdmin(p)){toast("Only a Super Admin can modify a Super Admin.",false);return}const s=await supabase.from("profiles").update({status:d.status,updated_at:new Date().toISOString()}).eq("id",u.id);if(s.error){toast(s.error.message,false);return}const rr=await supabase.rpc("set_user_role",{p_user_id:u.id,p_role_id:d.role_id});if(rr.error){toast(rr.error.message,false);return}await logActivity("Changed user access","profiles",u.id,{role_id:d.role_id,status:d.status});toast("Access updated");m.remove();load()};
}
load().catch(e=>toast(e.message,false));
