import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import css from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1" },
      { title: "انگرام — کاتالوگ و آرشیو روح‌ها" },
      { name: "description", content: "کاتالوگ فارسی انگرام‌ها و منابعی که صریحاً برای انتشار عمومی انتخاب شده‌اند." }
    ],
    links: [{ rel: "stylesheet", href: css }]
  }),
  component: Root
});
function Root() {
  return <html lang="fa" dir="rtl"><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>;
}
