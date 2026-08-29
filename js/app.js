import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = window.SUPABASE_URL || "https://mglrgspdqhptwffyqahc.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_-fqD6MRqOzBKVJkYP3SsZQ_llLFofeV";
if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY. Set them before deploying.");
}
export const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

export const qs=(s,root=document)=>root.querySelector(s);
export const qsa=(s,root=document)=>[...root.querySelectorAll(s)];
export const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
export const money=v=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(v||0));
export const fmtDate=v=>v?new Intl.DateTimeFormat("en-PH",{year:"numeric",month:"short",day:"numeric"}).format(new Date(v)): "—";

let profileCache=null;
export async function getProfile(force=false){
  if(profileCache && !force) return profileCache;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return null;
  const {data,error}=await supabase.from("profiles").select("*,roles(id,name,permissions)").eq("id",user.id).maybeSingle();
  if(error) throw error;
  profileCache=data||null;
  return profileCache;
}
export async function shell(title){
  const p=await getProfile();
  if(!p){location.href="login.html";return null}
  if(p.status!=="active"){await supabase.auth.signOut();location.href="login.html";return null}
  renderShell(title,p);
  return p;
}
export const roleName=p=>p?.roles?.name||"user";
export const isAdmin=p=>["admin","super_admin"].includes(roleName(p));
export const isSuperAdmin=p=>roleName(p)==="super_admin";
export const canManage=(p,permission="manage_inventory")=>{
  const perms=p?.roles?.permissions||{};
  return isSuperAdmin(p)||isAdmin(p)&&perms[permission]===true;
};
export function renderShell(title,p){
  const nav=[
    ["index.html","⌂","Dashboard"],
    ["inventory.html","▣","Inventory"],
    ["requests.html","↗","Requests"],
    ["borrowing.html","↔","Borrowing"],
    ["returns.html","↩","Returns"],
    ["categories.html","#","Categories"],
    ["finance.html","₱","Finance"],
    ["calculator.html","∑","Calculator"],
    ["reports.html","▤","Reports"],
    ["activity.html","◷","Activity Log"],
    ["users.html","♟","Users"],
    ["admin.html","⚙","Admin"],
    ["settings.html","☰","Settings"],
  ];
  const current=location.pathname.split("/").pop()||"index.html";
  document.body.innerHTML=`
  <aside class="sidebar">
    <div class="p-4 flex items-center gap-3"><div class="logo">OSI</div><div class="brand-text"><div class="font-black text-lg">OSI Inventory</div><div class="text-xs text-slate-500">FEBIAS College of Bible</div></div></div>
    <nav class="mt-5">${nav.map(([href,icon,label])=>`<a class="nav-link ${current===href?"active":""}" href="${href}"><span>${icon}</span><span class="nav-text">${label}</span></a>`).join("")}</nav>
    <div class="absolute bottom-3 left-0 right-0">
      <a class="nav-link ${current==="profile.html"?"active":""}" href="profile.html"><span>♟</span><span class="nav-text">My Profile</span></a>
      <button id="signout" class="btn btn-secondary w-[calc(100%-20px)] mx-[10px]"><span class="bottom-text">Sign out</span>↪</button>
    </div>
  </aside>
  <div class="main-shell"><header class="topbar"><div class="font-black text-lg">${esc(title)}</div><div class="flex items-center gap-3"><div class="text-right hidden sm:block"><div class="font-bold">${esc(p.full_name)}</div><div class="text-xs text-slate-500">${esc(roleName(p))}</div></div><div class="logo !w-10 !h-10 !rounded-full">${esc((p.full_name||"U").slice(0,1).toUpperCase())}</div></div></header><main id="app" class="content"></main></div>`;
  qs("#signout").onclick=async()=>{await supabase.auth.signOut();location.href="login.html"};
}
export function setApp(html){qs("#app").innerHTML=html}
export function toast(message,ok=true){
  let s=qs(".toast-stack"); if(!s){s=document.createElement("div");s.className="toast-stack";document.body.appendChild(s)}
  const t=document.createElement("div");t.className=`toast ${ok?"":"error"}`;t.textContent=message;s.appendChild(t);setTimeout(()=>t.remove(),4500);
}
export function openModal(title,body){
  const m=document.createElement("div");m.className="modal-backdrop";m.innerHTML=`<div class="modal"><div class="p-5 border-b flex items-center justify-between"><h2 class="text-xl font-black">${esc(title)}</h2><button class="close text-2xl">×</button></div><div class="p-5">${body}</div></div>`;
  document.body.appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.addEventListener("click",e=>{if(e.target===m)m.remove()});return m.querySelector(".modal");
}
export async function logActivity(action,entity_type=null,entity_id=null,details={}){
  try{const {data:{user}}=await supabase.auth.getUser();if(user) await supabase.from("activity_log").insert({user_id:user.id,action,entity_type,entity_id,details})}catch(e){console.warn("Activity log failed",e)}
}
export function csvDownload(rows,filename="osi-export.csv"){
  if(!rows.length){toast("Nothing to export.",false);return}
  const keys=Object.keys(rows[0]),csv=[keys.map(csvCell).join(","),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(","))].join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
const csvCell=v=>`"${String(v??"").replaceAll('"','""')}"`;
export async function safeQuery(fn){try{return await fn()}catch(e){toast(e.message||"Unexpected error.",false);throw e}}
