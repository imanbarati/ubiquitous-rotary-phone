import {readFileSync,writeFileSync} from "node:fs";
const keys=["CLOUDFLARE_D1_DATABASE_ID","APP_URL","ENAGRAM_GITHUB_CLIENT_ID"],missing=keys.filter(k=>!process.env[k]?.trim());
if(missing.length){console.error("Missing deployment values: "+missing.join(", "));process.exit(1)}
const id=process.env.CLOUDFLARE_D1_DATABASE_ID.trim();
if(!/^[0-9a-f-]{36}$/i.test(id)){console.error("D1 database ID must be a UUID.");process.exit(1)}
let url;try{url=new URL(process.env.APP_URL.trim())}catch{console.error("APP_URL must be absolute.");process.exit(1)}
if(url.protocol!=="https:"){console.error("Production APP_URL must use HTTPS.");process.exit(1)}
const source=readFileSync("wrangler.jsonc","utf8");
const output=source.replace('"database_id":"00000000-0000-0000-0000-000000000000"','"database_id":'+JSON.stringify(id)).replace('"APP_URL":"http://localhost:3000"','"APP_URL":'+JSON.stringify(url.origin)).replace('"ENAGRAM_GITHUB_CLIENT_ID":"__ENAGRAM_GITHUB_CLIENT_ID__"','"ENAGRAM_GITHUB_CLIENT_ID":'+JSON.stringify(process.env.ENAGRAM_GITHUB_CLIENT_ID.trim()));
if(output===source||output.includes("00000000-0000-0000-0000-000000000000")||output.includes("__ENAGRAM_GITHUB_CLIENT_ID__")){console.error("Could not replace Wrangler placeholders.");process.exit(1)}
writeFileSync(".wrangler.deploy.jsonc",output);console.log("Generated ignored .wrangler.deploy.jsonc; source files remain unchanged.");