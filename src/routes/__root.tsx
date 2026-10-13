import {createRootRoute,HeadContent,Outlet,Scripts} from "@tanstack/react-router";
import css from "../styles.css?url";
export const Route=createRootRoute({head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width,initial-scale=1"},{title:"Enagram — your inner world, clearly mapped"},{name:"description",content:"Create, keep, and share your Enagram Souls."}],links:[{rel:"stylesheet",href:css}]}),component:Root});
function Root(){return <html lang="en"><head><HeadContent/></head><body><Outlet/><Scripts/></body></html>;}