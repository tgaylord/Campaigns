import { visit } from "unist-util-visit";

/**
 * Story entries link to the campaign's records with short schemes:
 *   [Yūsuf I](person:yusuf-i)   [Gharnāṭa](place:gharnata)   [the war](war:some-war)
 * This rewrites them to site URLs and tags them so the CSS can style them.
 */
const ROUTES = { person: "people", place: "places", war: "wars", era: "chronicle#era" };

export function remarkEntityLinks({ base = "" } = {}) {
  return (tree) => {
    visit(tree, "link", (node) => {
      const m = /^(person|place|war|era):([a-z0-9-]+)$/.exec(node.url);
      if (!m) return;
      const [, kind, id] = m;
      node.url = kind === "era" ? `${base}/chronicle/#era-${id}` : `${base}/${ROUTES[kind]}/${id}/`;
      node.data = node.data || {};
      node.data.hProperties = { ...(node.data.hProperties || {}), className: ["entity", `entity-${kind}`] };
    });
  };
}
