export type Visibility="private"|"unlisted"|"public";
export type SoulInput={title:string;description:string;data:Record<string,unknown>;visibility:Visibility};
export function slugify(v:string){return v.normalize("NFKC").toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"").slice(0,64)||"soul";}
export function validateSoulInput(v:unknown):{ok:true;value:SoulInput}|{ok:false;error:string}{
 if(!v||typeof v!=="object"||Array.isArray(v))return{ok:false,error:"Expected a JSON object."};
 const x=v as Record<string,unknown>;
 if(typeof x.title!=="string"||x.title.trim().length<1||x.title.trim().length>100)return{ok:false,error:"Title must be 1–100 characters."};
 const description=x.description===undefined?"":x.description;
 if(typeof description!=="string"||description.length>500)return{ok:false,error:"Description must be 500 characters or fewer."};
 const data=x.data===undefined?{}:x.data;
 if(!data||typeof data!=="object"||Array.isArray(data))return{ok:false,error:"Soul data must be a JSON object."};
 const encoded=JSON.stringify(data);
 if(new TextEncoder().encode(encoded).byteLength>24576)return{ok:false,error:"Soul data must be under 24 KiB."};
 const visibility=x.visibility===undefined?"private":x.visibility;
 if(!["private","unlisted","public"].includes(String(visibility)))return{ok:false,error:"Invalid visibility."};
 return{ok:true,value:{title:x.title.trim(),description:description.trim(),data:data as Record<string,unknown>,visibility:visibility as Visibility}};
}