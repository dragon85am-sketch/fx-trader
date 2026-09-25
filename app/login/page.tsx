"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, TrendingUp, UserRound } from "lucide-react";
import { setCurrentStorageUser } from "@/lib/userScopedStorage";

type LoginResponse={error?:string;details?:string;user?:{id:string;email:string;name:string|null;role:string}};

export default function LoginPage(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [showPassword,setShowPassword]=useState(false);
 const [remember,setRemember]=useState(true); const [loading,setLoading]=useState(false); const [pinLoading,setPinLoading]=useState(false); const [error,setError]=useState("");
 const [pin,setPin]=useState(["","","",""]); const refs=useRef<Array<HTMLInputElement|null>>([]);
 useEffect(()=>{ const saved=localStorage.getItem("fxtrade_login_email"); if(saved)setEmail(saved); },[]);
 const finish=(data:LoginResponse)=>{if(data.user?.id)setCurrentStorageUser(data.user.id); if(remember)localStorage.setItem("fxtrade_login_email",email.trim().toLowerCase()); else localStorage.removeItem("fxtrade_login_email"); window.location.replace("/dashboard");};
 async function handleLogin(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");try{const res=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email,password})});const data=await res.json() as LoginResponse;if(!res.ok){setError(data.details||data.error||`Błąd logowania (${res.status})`);return;}finish(data);}catch{setError("Problem z połączeniem z serwerem");}finally{setLoading(false)}}
 async function handlePinLogin(){const code=pin.join("");if(!email.trim()){setError("Wpisz e-mail powyżej, aby zalogować się kodem PIN.");return;}if(!/^\d{4}$/.test(code)){setError("Wprowadź 4-cyfrowy kod PIN.");return;}setPinLoading(true);setError("");try{const res=await fetch("/api/login/pin",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email,pin:code})});const data=await res.json() as LoginResponse;if(!res.ok){setError(data.error||"Nieprawidłowy PIN");setPin(["","","",""]);refs.current[0]?.focus();return;}finish(data);}catch{setError("Problem z połączeniem z serwerem");}finally{setPinLoading(false)}}
 const pinChange=(i:number,v:string)=>{const d=v.replace(/\D/g,"").slice(-1);const n=[...pin];n[i]=d;setPin(n);if(d&&i<3)refs.current[i+1]?.focus();};
 return <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
  <div className="pointer-events-none fixed inset-0 bg-cover bg-center" style={{backgroundImage:"linear-gradient(rgba(2,8,23,.28),rgba(2,8,23,.52)),url('/login-bg.png')"}}/>
  <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-7">
   <div className="w-full max-w-[700px] rounded-[30px] border border-cyan-300/80 bg-[linear-gradient(145deg,rgba(5,28,59,.91),rgba(2,16,35,.95))] p-6 shadow-[0_0_28px_rgba(34,211,238,.55),0_0_70px_rgba(37,99,235,.24)] backdrop-blur-xl sm:p-9">
    <div className="mb-5 flex justify-center"><img src="/fx-trade-professional-trading.png" alt="FX Trade Professional Trading" className="h-auto w-full max-w-[430px] object-contain drop-shadow-[0_0_24px_rgba(37,99,235,.38)]"/></div>
    <form onSubmit={handleLogin} className="space-y-4">
     <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-cyan-400"/>E-mail</label><div className="relative"><UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300"/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Wprowadź swój e-mail" required className="w-full rounded-xl border border-sky-400/55 bg-[#06172f]/90 px-12 py-3.5 outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(34,211,238,.18)]"/></div></div>
     <div><div className="mb-2 flex justify-between"><label className="flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4 text-cyan-400"/>Hasło</label><Link href="/forgot-password" className="text-xs font-semibold text-cyan-300">Nie pamiętasz hasła?</Link></div><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300"/><input type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Wprowadź hasło" required className="w-full rounded-xl border border-sky-400/55 bg-[#06172f]/90 px-12 py-3.5 pr-14 outline-none focus:border-cyan-300"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div></div>
     <label className="flex w-fit cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-5 w-5 accent-sky-500"/>Zapamiętaj mnie</label>
     {error&&<div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</div>}
     <button disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(90deg,#12c9ee,#087ef5,#1748ff)] py-4 text-base font-bold shadow-[0_0_24px_rgba(14,165,233,.34)] disabled:opacity-60"><TrendingUp className="h-5 w-5"/>{loading?"Logowanie...":"Zaloguj się"}</button>
    </form>
    <div className="my-5 flex items-center gap-4"><div className="h-px flex-1 bg-sky-300/35"/><span className="text-[11px] font-semibold text-slate-400">LUB</span><div className="h-px flex-1 bg-sky-300/35"/></div>
    <div className="text-center"><div className="flex items-center justify-center gap-2 text-lg font-semibold"><LockKeyhole className="h-5 w-5 text-cyan-400"/>Zaloguj się kodem PIN</div><p className="mt-1 text-xs text-slate-300">Wprowadź 4-cyfrowy kod PIN</p>
     <div className="my-4 flex justify-center gap-3">{pin.map((v,i)=><input key={i} ref={el=>{refs.current[i]=el}} inputMode="numeric" maxLength={1} value={v} onChange={e=>pinChange(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!pin[i]&&i>0)refs.current[i-1]?.focus();if(e.key==="Enter")handlePinLogin();}} className="h-[70px] w-[70px] rounded-xl border border-cyan-400/75 bg-[#06172f]/90 text-center text-2xl font-bold outline-none focus:border-cyan-200 focus:shadow-[0_0_18px_rgba(34,211,238,.3)]"/> )}</div>
     <button type="button" onClick={handlePinLogin} disabled={pinLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-300/80 bg-[linear-gradient(90deg,rgba(6,78,145,.85),rgba(7,45,111,.95))] py-4 font-bold shadow-[0_0_20px_rgba(14,165,233,.38)] disabled:opacity-60"><LockKeyhole className="h-5 w-5"/>{pinLoading?"Logowanie...":"Zaloguj się kodem PIN"}</button>
     <p className="mt-4 text-sm text-slate-300">Nie masz kodu PIN? <Link href="/settings" className="ml-2 font-bold text-cyan-300">Utwórz PIN &nbsp;›</Link></p>
    </div>
    <Link href="/" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-[#06172f]/75 py-3.5 font-semibold text-sky-200"><ArrowLeft className="h-5 w-5"/>Wróć do strony głównej</Link>
   </div>
  </div>
 </main>
}
