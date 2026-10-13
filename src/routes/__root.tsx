import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import css from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1" },
      { name: "theme-color", content: "#101017" },
      { name: "color-scheme", content: "dark" }
    ],
    links: [{ rel: "stylesheet", href: css }]
  }),
  component: Root
});
function Root() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fa";
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>;
}
