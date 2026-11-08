# Designer B: round one

Angle: data journalism and scroll-driven storytelling.

---

## Idea 1: Six Numbers (an annual long read)

**Question:** *What actually happened to this realm, and how do we know?*

A newspaper-style long read built on six numbers the data proves: **42%** (the plague, the cities hit worst); **39.7** (sovereignty at its lowest, July 1348, then up to 100 by 1360); **18 → 241 → 196** (conquer, then hand the land to ṭāʾifas, five times over); **97% → 31% → 60%** (Sunni share of the people, swamped by conquest, then won back: the Book of the Call in one line); **−37 → +26** (the land-or-sea temper, 63 points in ten years after 1432); **#2** (world rank in 1414, up from nowhere). In each chapter one graphic stays pinned and changes step by step as the text scrolls past: dots of people dying off, a map breathing in and out, a needle swinging from land to sea. Each chapter closes on a line from the chronicle and saves as a share card.

**Data:** checkpoints (population, religion, locations, sovereignty), realm-readings, world-rankings, places.held. The estates' power is mostly *estimated*, so the long read has to mark it as such.

**Carries over:** the scroll engine and a "story finder" that scans any campaign's series for its steepest drops, reversals and peaks, then proposes them to the writer. The chosen six and the words belong to this campaign.

**Effort:** medium to large. **Risk:** the story finder can only propose; good scrollytelling needs human editing, and on phones it has to scroll freely, never hijacking the reader's scroll.

---

## Idea 2: The Breath of the Realm (a scrubbable map with vital signs)

**Question:** *What did al-Andalus look like on any given day, and what was it doing?*

One full-screen map of Iberia and the seas, with the timeline as the scroll itself: 105 years, 72 saves, one notch each. Land held directly is solid, land held through a ṭāʾifa is hatched (places.json marks `via`), and the reader watches the realm **breathe**, swelling with every conquest and then shedding provinces to vassal houses. Battles flash where they were fought (194 of them, 60 at sea) and leave faint scars. After 1379 the frame widens as trade posts light up from Bissau to Cairo and the fleet grows from 5 ships to 58. Down the side runs a "seismograph" of vital signs (people, treasury, sovereignty, the estates' temper, land or sea), so a jolt on the map lines up with a jolt in the numbers. Tap any moment to open that save's note and the chronicle entries from it.

**Data:** checkpoints, places, battle-places, realm-readings.abroad (already has map xy). **Missing:** outlines of the realm's borders; the brief says they can be traced from the game map for each checkpoint, and that tracing is the main build cost.

**Carries over:** almost all of it. Any campaign has saves, holdings, battles and a set of vital signs, so only the colours and the frame's extent are specific to this one.

**Effort:** large. **Risk:** generating outlines for each checkpoint, and keeping 300+ years of saves light enough to scrub smoothly on a phone.
