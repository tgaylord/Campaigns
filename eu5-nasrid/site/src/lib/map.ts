import raw from "../generated/map.json";

/** A location on the game map. Coordinates are game-map pixels inside the frame; y grows downward. */
export type MapLocation = { kind: "land" | "waste" | "lake"; d: string; c: [number, number]; province: string | null; area: string | null };
export type Realm = { d: string; px: number; c: [number, number] };
export type Province = { d: string; c: [number, number]; px: number; area: string | null; region: string | null; locations: string[] };
type GameMap = {
  frame: { x: number; y: number; width: number; height: number };
  coast: string;
  locations: Record<string, MapLocation>;
  /** checkpoint id → location key → owner tag */
  owners: Record<string, Record<string, string>>;
  /** checkpoint id → owner tag → outline of everything it owns */
  realms: Record<string, Record<string, Realm>>;
  /** province outlines and members (tools/build_map.py) */
  provinces: Record<string, Province>;
  /** area outlines */
  areas: Record<string, { d: string; c: [number, number]; region: string | null }>;
  /** land location → its size in map pixels */
  px: Record<string, number>;
  /** the game's English names (tools/place_names.py); the gazetteer's names win where a place has an entry */
  names: { locations: Record<string, string>; provinces: Record<string, string>; areas: Record<string, string> };
};
export const gameMap = raw as unknown as GameMap;
export const MAP_W = gameMap.frame.width;
export const MAP_H = gameMap.frame.height;

/** "velez_malaga" → "Velez malaga": a readable stand-in for locations the gazetteer doesn't name. */
export const keyLabel = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const centre = (key: string): [number, number] | undefined => gameMap.locations[key]?.c;
