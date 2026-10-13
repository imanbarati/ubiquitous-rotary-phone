import {createFileRoute} from "@tanstack/react-router";
import {env} from "cloudflare:workers";
import {dbError,json,safeSoul,type SoulRow} from "../lib/server";
export const Route=createFileRoute("/api/public/souls/$slug")({server:{handlers:{GET:async({params})=>{
 const e=dbError();if(e)return e;const r=await env.DB.prepare("SELECT * FROM souls WHERE slug=? AND visibility IN ('unlisted','public')").bind(params.slug).first<SoulRow>();if(!r)return json({error:"Soul is private or missing."},404,{"X-Robots-Tag":"noindex, nofollow"});return json({soul:safeSoul(r)},200,r.visibility==="unlisted"?{"X-Robots-Tag":"noindex, nofollow"}:undefined);
}}}});