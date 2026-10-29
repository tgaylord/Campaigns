import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/gentium-book-plus/latin-400.css";
import "@fontsource/gentium-book-plus/latin-400-italic.css";
import "@fontsource/gentium-book-plus/latin-700.css";
import "@fontsource/gentium-book-plus/latin-ext-400.css";
import "@fontsource/gentium-book-plus/latin-ext-400-italic.css";
import "@fontsource/gentium-book-plus/latin-ext-700.css";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/reem-kufi/arabic-500.css";
import "@fontsource/reem-kufi/latin-500.css";
import "@fontsource/reem-kufi/latin-ext-500.css";
import "./styles/base.css";
import App from "./App";

// GitHub Pages serves one 404 page for the whole repo. It sends deep links
// (…/eu5-nasrid/people/yusuf-i) back here as ?p=/people/yusuf-i; restore the path.
{
  const p = new URLSearchParams(location.search).get("p");
  if (p) history.replaceState(null, "", import.meta.env.BASE_URL.replace(/\/$/, "") + p + location.hash);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
