import { lazy, Suspense, useEffect } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { campaign, latest, hijri, arabicDigits } from "./lib/data";
import EntityCard from "./components/EntityCard";
// Each hall is its own chunk, loaded when it is first opened.
const Atlas = lazy(() => import("./views/Atlas"));
const ChronicleIndex = lazy(() => import("./views/ChronicleIndex"));
const ChronicleFolio = lazy(() => import("./views/ChronicleFolio"));
const ChronicleBook = lazy(() => import("./views/ChronicleBook"));
const Strait = lazy(() => import("./views/Strait"));
const Council = lazy(() => import("./views/Council"));
const Scroll = lazy(() => import("./views/Scroll"));
const Court = lazy(() => import("./views/Court"));
const House = lazy(() => import("./views/House"));
const PersonPage = lazy(() => import("./views/PersonPage"));
const WarsIndex = lazy(() => import("./views/WarsIndex"));
const WarPage = lazy(() => import("./views/WarPage"));
const Gazetteer = lazy(() => import("./views/Gazetteer"));
const PlacePage = lazy(() => import("./views/PlacePage"));
const Lands = lazy(() => import("./views/Lands"));
const Kingdoms = lazy(() => import("./views/Kingdoms"));
const World = lazy(() => import("./views/World"));
const GoldenCentury = lazy(() => import("./views/GoldenCentury"));
const Codex = lazy(() => import("./views/Codex"));
const CodexLeaf = lazy(() => import("./views/CodexLeaf"));
const CodexBook = lazy(() => import("./views/CodexBook"));
const CodexColophon = lazy(() => import("./views/CodexColophon"));
const Desk = lazy(() => import("./views/Desk"));

const NAV = [
  { to: "/", latin: "The Atlas", ar: "الأطلس", end: true },
  { to: "/world", latin: "The World", ar: "الآفاق" },
  { to: "/golden-century", latin: "The Golden Century", ar: "القرن الذهبي" },
  { to: "/chronicle", latin: "The Chronicle", ar: "الأخبار" },
  { to: "/codex", latin: "The Codex", ar: "السفر" },
  { to: "/council", latin: "The Council", ar: "الديوان" },
  { to: "/provinces", latin: "The Provinces", ar: "الكور" },
  { to: "/scroll", latin: "The Long Scroll", ar: "الدرج" },
  { to: "/court", latin: "The Court", ar: "البلاط" },
  { to: "/kingdoms", latin: "The Kingdoms", ar: "الممالك" },
  { to: "/house", latin: "House of Naṣr", ar: "بنو نصر" },
  { to: "/wars", latin: "Wars", ar: "الحروب" },
  { to: "/places", latin: "Gazetteer", ar: "البلدان" },
  { to: "/desk", latin: "The Desk", ar: "المكتب" },
  // the Strait's question was settled in 1370; its hall stays for the record
  { to: "/strait", latin: "The Strait", ar: "الزقاق" },
];

export default function App() {
  const { pathname, search } = useLocation();
  // the checkpoint travels with you from hall to hall (?at=), so the halls agree on the year
  // (not to the Atlas: the router writes the home page without its trailing slash, which a query can't follow)
  const at = new URLSearchParams(search).get("at");
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const h = latest ? hijri(latest.date) : null;

  return (
    <div className="shell">
      <aside className="rail">
        <NavLink to="/" className="rail-mark" aria-label="The Nasrid Chronicle, home">
          <span className="ar">أخبار بني نصر</span>
          <span className="latin">The Nasrid Chronicle</span>
        </NavLink>
        <nav aria-label="Halls of the chronicle">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={at && n.to !== "/" ? `${n.to}?at=${at}` : n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")}>
                  <span className="latin">{n.latin}</span>
                  <span className="ar" aria-hidden="true">{n.ar}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="rail-foot">
          {h && <div>Last checkpoint: <span className="ar" style={{ color: "var(--gilt)" }}>{arabicDigits(h.y)}</span> AH</div>}
          {campaign.sample && (
            <span className="sample-tag" role="note">
              Sample data. Nothing here is campaign history yet; the first real checkpoint replaces it.
            </span>
          )}
        </div>
      </aside>

      <main className="main" id="main">
        <Suspense fallback={<div className="page loading ui" role="status">Unrolling the folio…</div>}>
        <Routes>
          <Route path="/" element={<Atlas />} />
          <Route path="/chronicle" element={<ChronicleIndex />} />
          <Route path="/chronicle/book/:era" element={<ChronicleBook />} />
          <Route path="/chronicle/:id" element={<ChronicleFolio />} />
          <Route path="/codex" element={<Codex />} />
          <Route path="/codex/colophon" element={<CodexColophon />} />
          <Route path="/codex/book/:era" element={<CodexBook />} />
          <Route path="/codex/:addr" element={<CodexLeaf />} />
          <Route path="/desk" element={<Desk />} />
          <Route path="/strait" element={<Strait />} />
          <Route path="/council" element={<Council />} />
          <Route path="/provinces" element={<Lands />} />
          <Route path="/scroll" element={<Scroll />} />
          <Route path="/court" element={<Court />} />
          <Route path="/kingdoms" element={<Kingdoms />} />
          <Route path="/world" element={<World />} />
          <Route path="/golden-century" element={<GoldenCentury />} />
          <Route path="/house" element={<House />} />
          <Route path="/people/:id" element={<PersonPage />} />
          <Route path="/wars" element={<WarsIndex />} />
          <Route path="/wars/:id" element={<WarPage />} />
          <Route path="/places" element={<Gazetteer />} />
          <Route path="/places/:id" element={<PlacePage />} />
          <Route path="*" element={<div className="page"><h1>Nothing is written here</h1><p className="muted">This page doesn't exist. Choose a hall from the list of halls.</p></div>} />
        </Routes>
        </Suspense>
      </main>
      <EntityCard />
    </div>
  );
}
