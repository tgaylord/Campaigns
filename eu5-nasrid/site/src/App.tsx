import { useEffect } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { campaign, latest, hijri, arabicDigits } from "./lib/data";
import EntityCard from "./components/EntityCard";
import Atlas from "./views/Atlas";
import ChronicleIndex from "./views/ChronicleIndex";
import ChronicleFolio from "./views/ChronicleFolio";
import Strait from "./views/Strait";
import Council from "./views/Council";
import Scroll from "./views/Scroll";
import Court from "./views/Court";
import House from "./views/House";
import PersonPage from "./views/PersonPage";
import WarsIndex from "./views/WarsIndex";
import WarPage from "./views/WarPage";
import Gazetteer from "./views/Gazetteer";
import PlacePage from "./views/PlacePage";

const NAV = [
  { to: "/", latin: "The Atlas", ar: "الأطلس", end: true },
  { to: "/chronicle", latin: "The Chronicle", ar: "الأخبار" },
  { to: "/strait", latin: "The Strait", ar: "الزقاق" },
  { to: "/council", latin: "The Council", ar: "الديوان" },
  { to: "/scroll", latin: "The Long Scroll", ar: "الدرج" },
  { to: "/court", latin: "The Court", ar: "البلاط" },
  { to: "/house", latin: "House of Naṣr", ar: "بنو نصر" },
  { to: "/wars", latin: "Wars", ar: "الحروب" },
  { to: "/places", latin: "Gazetteer", ar: "البلدان" },
];

export default function App() {
  const { pathname } = useLocation();
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
                <NavLink to={n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")}>
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
        <Routes>
          <Route path="/" element={<Atlas />} />
          <Route path="/chronicle" element={<ChronicleIndex />} />
          <Route path="/chronicle/:id" element={<ChronicleFolio />} />
          <Route path="/strait" element={<Strait />} />
          <Route path="/council" element={<Council />} />
          <Route path="/scroll" element={<Scroll />} />
          <Route path="/court" element={<Court />} />
          <Route path="/house" element={<House />} />
          <Route path="/people/:id" element={<PersonPage />} />
          <Route path="/wars" element={<WarsIndex />} />
          <Route path="/wars/:id" element={<WarPage />} />
          <Route path="/places" element={<Gazetteer />} />
          <Route path="/places/:id" element={<PlacePage />} />
          <Route path="*" element={<div className="page"><h1>Nothing is written here</h1><p className="muted">This page doesn't exist. Choose a hall from the list of halls.</p></div>} />
        </Routes>
      </main>
      <EntityCard />
    </div>
  );
}
