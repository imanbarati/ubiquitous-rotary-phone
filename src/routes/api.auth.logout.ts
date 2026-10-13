import {createFileRoute} from "@tanstack/react-router";
import {env} from "cloudflare:workers";
import {clearCookie,currentUser,getCookie,hashToken,json,sameOrigin} from "../lib/server";
export const Route=createFileRoute("/api/auth/logout")({server:{handlers:{POST:async({request})=>{
 if(!sameOrigin(request))return json({error:"Invalid origin."},403);
 const t=getCookie(request,"enagram_session");if(t&&env.DB)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await hashToken(t)).run();
 return json({ok:true},200,{"Set-Cookie":clearCookie(request,"enagram_session")});
}}}});