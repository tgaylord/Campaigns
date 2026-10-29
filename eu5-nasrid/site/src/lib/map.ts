import raw from "../generated/map.json";

/** A location on the game map. Coordinates are game-map pixels inside the frame; y grows downward. */
export type MapLocation = { kind: "land" | "waste" | "lake"; d: string; c: [number, number]; province: string | null; area: string | null };
export type Realm = { d: string; px: number; c: [number, number] };
type GameMap = {
  frame: { x: number; y: number; width: number; height: number };
  coast: string;
  locations: Record<string, MapLocation>;
  /** checkpoint id → location key → owner tag */
  owners: Record<string, Record<string, string>>;
  /** checkpoint id → owner tag → outline of everything it owns */
  realms: Record<string, Record<string, Realm>>;
};
export const gameMap = raw as unknown as GameMap;
export const MAP_W = gameMap.frame.width;
export const MAP_H = gameMap.frame.height;

/** "velez_malaga" → "Velez malaga": a readable stand-in for locations the gazetteer doesn't name. */
export const keyLabel = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const centre = (key: string): [number, number] | undefined => gameMap.locations[key]?.c;
