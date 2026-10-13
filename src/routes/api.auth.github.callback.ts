import {createFileRoute} from "@tanstack/react-router";
import {env} from "cloudflare:workers";
import {appUrl,clearCookie,cookie,getCookie,hashToken,json,randomToken,dbError} from "../lib/server";
type GHUser={id:number;login:string;avatar_url?:string};
export const Route=createFileRoute("/api/auth/github/callback")({server:{handlers:{GET:async({request})=>{
 const u=new URL(request.url),base=appUrl(),h=new Headers({"Cache-Control":"no-store"});h.append("Set-Cookie",clearCookie(request,"enagram_oauth_state"));
 const fail=(reason:string)=>{h.set("Location",base?new URL("/?auth="+encodeURIComponent(reason),base).toString():"/");return new Response(null,{status:302,headers:h});};
 if(!base)return json({error:"APP_URL missing."},503);
 if(!u.searchParams.get("state")||u.searchParams.get("state")!==getCookie(request,"enagram_oauth_state"))return fail("invalid_state");
 if(u.searchParams.get("error"))return fail("cancelled");
 const code=u.searchParams.get("code");if(!code||!env.ENAGRAM_GITHUB_CLIENT_ID||!env.ENAGRAM_GITHUB_CLIENT_SECRET)return fail("configuration");
 const err=dbError();if(err)return err;
 try{
  const tr=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({client_id:env.ENAGRAM_GITHUB_CLIENT_ID,client_secret:env.ENAGRAM_GITHUB_CLIENT_SECRET,code,redirect_uri:new URL("/api/auth/github/callback",base).toString()})});
  if(!tr.ok)return fail("token_exchange");const tp=await tr.json() as {access_token?:string};if(!tp.access_token)return fail("token_exchange");
  const pr=await fetch("https://api.github.com/user",{headers:{Authorization:"Bearer "+tp.access_token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"enagram-platform"}});
  if(!pr.ok)return fail("profile");const gh=await pr.json() as GHUser;if(!Number.isSafeInteger(gh.id)||typeof gh.login!=="string")return fail("profile");
  await env.DB.prepare("INSERT INTO users(github_id,username,avatar_url) VALUES(?,?,?) ON CONFLICT(github_id) DO UPDATE SET username=excluded.username,avatar_url=excluded.avatar_url").bind(gh.id,gh.login,gh.avatar_url??null).run();
  const user=await env.DB.prepare("SELECT id FROM users WHERE github_id=?").bind(gh.id).first<{id:number}>();if(!user)return fail("storage");
  const token=randomToken();await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await hashToken(token),user.id,Math.floor(Date.now()/1000)+2592000).run();
  h.set("Location",new URL("/",base).toString());h.append("Set-Cookie",cookie(request,"enagram_session",token,2592000));return new Response(null,{status:302,headers:h});
 }catch{return fail("server");}
}}}});