import {createFileRoute} from "@tanstack/react-router";
import {currentUser,json,dbError} from "../lib/server";
export const Route=createFileRoute("/api/me")({server:{handlers:{GET:async({request})=>{
 const e=dbError();if(e)return e;const u=await currentUser(request);return json({user:u?{id:u.id,githubId:u.github_id,username:u.username,avatarUrl:u.avatar_url}:null});
}}}});