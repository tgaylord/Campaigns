import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { snapshots } from "./data";
import { useFetched } from "./world";

/* The realm's reach and temper at each checkpoint (tools/realm_extras.py): societal values, laws,
   privileges, reforms, fleet and army by type, buildings abroad, expeditions. One small file for the
   whole series (public/realm/series.json), fetched by the World hall and the Golden Century. */

export type Abroad = { type: string; level: number; building: number; location: string; holder: string | null; xy: [number, number] | null };
export type RealmAt = {
  checkpoint: string; date: string;
  societalValues: Record<string, number>;
  laws: Record<string, string>;
  privileges: string[]; reforms: string[]; institutions: string[];
  advances: { count: number };
  legitimacy: number | null;
  dominance: Record<string, number> | null;
  expeditions: { type: string | null; location: string | null; start: string | null; end: string | null; failed: boolean }[];
  fleet: Record<string, number>; army: Record<string, number>;
  abroad: Abroad[];
};
export type RealmSeries = { series: RealmAt[]; names: Record<string, string> };

export const useRealmSeries = () => useFetched<RealmSeries>("realm/series.json");

/** The game's English name for a realm key, never the raw key. */
export function nameOf(names: Record<string, string> | undefined, key: string): string {
  return names?.[key] ?? key.replace(/^(nd_|gra_|adu_|n_)/, "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
export const sum = (r: Record<string, number> | undefined) => Object.values(r ?? {}).reduce((a, b) => a + b, 0);

/** Kinds of building abroad, in the order the World hall lists them. */
export const ABROAD_KIND: Record<string, { label: string; plural: string; rank: number }> = {
  embassy: { label: "Embassy", plural: "Embassies", rank: 0 },
  trade_office: { label: "Trade office", plural: "Trade offices", rank: 1 },
  overseas_trading_post: { label: "Overseas trading post", plural: "Overseas trading posts", rank: 2 },
};

/**
 * The checkpoint a hall shows, kept in the address as ?at=<id> so a view can be linked and
 * every hall that reads ?at= opens on the same year. Defaults to the latest checkpoint.
 */
export function useCheckpointParam(): [number, (i: number) => void] {
  const loc = useLocation();
  const nav = useNavigate();
  const read = () => {
    const at = new URLSearchParams(loc.search).get("at");
    const n = snapshots.findIndex((s) => s.id === at);
    return n >= 0 ? n : snapshots.length - 1;
  };
  const [i, setI] = useState(read);
  useEffect(() => { setI(read()); }, [loc.search]);
  const set = (n: number) => {
    setI(n);
    const q = new URLSearchParams(loc.search);
    if (n === snapshots.length - 1) q.delete("at"); else q.set("at", snapshots[n].id);
    const qs = q.toString();
    nav({ pathname: loc.pathname, search: qs ? `?${qs}` : "", hash: loc.hash }, { replace: true });
  };
  return [i, set];
}
