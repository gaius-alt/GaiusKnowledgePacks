# Vanilla Knowledge Packs for SkyrimNet

A bundle of 45 SkyrimNet knowledge packs covering vanilla Skyrim + DLCs. Notable people, buildings, quests, dungeons, mines, and Orc strongholds — every entry faction-scoped so it doesn't leak to NPCs who'd have no reason to know.

Ships with a one-click **Bulk Importer** so you don't have to click *Import Pack* 45 times.

---

## Contents

- [What's in the bundle](#whats-in-the-bundle)
- [Install the packs](#install-the-packs)
- [How the packs are scoped](#how-the-packs-are-scoped)
- [Stage-gated quest content](#stage-gated-quest-content)
- [Bulk Importer tool](#bulk-importer-tool)
- [Repository layout](#repository-layout)
- [Compatibility and scope](#compatibility-and-scope)
- [Author / credits](#author--credits)

---

## What's in the bundle

45 packs, 500 entries total. Every pack name is prefixed `_VKP - ` so they sort together in the SkyrimNet pack list.

| Category | Packs | Examples |
|---|---|---|
| Hold quest packs (×9) | Whiterun, Reach, Haafingar, Eastmarch, Rift, Winterhold, Pale, Falkreath, Hjaalmarch | The Whispering Door, Forsworn Conspiracy, Blood on the Ice, Waking Nightmare |
| City building layouts (×9) | Whiterun, Falkreath, Morthal, Winterhold, Dawnstar, Solitude, Markarth, Windhelm, Riften | Dragonsreach, Jorrvaskr, Blue Palace, Understone Keep, Palace of the Kings, Mistveil Keep |
| Notable People (×9) | One per city | Jarls, court, the Companions Circle, the Thieves Guild, the Silver-Bloods, the Black-Briars, the Bards College, the College of Winterhold faculty |
| Hold dungeon packs (×9) | Per hold | Bleak Falls Barrow, Saarthal, Folgunthur, Mzulft, Volskygge, Karthspire, Avanchnzel |
| Hold mine packs (×8) | Winterhold has none | Cidhna Mine, Kolskeggr, Gloombound, Iron-Breaker, Quicksilver, Steamscorch |
| Orc Strongholds (×1) | All four | Largashbur, Mor Khazgur, Narzulbur, Dushnikh Yal + Code of Malacath |

---

## Install the packs

Three ways, listed best to worst:

1. **Bulk Importer (recommended)** — see [Bulk Importer tool](#bulk-importer-tool). Drag-and-drop a bookmarklet, pick the folder, done.
2. **Tampermonkey userscript** — adds a permanent **Bulk Import** button to the SkyrimNet web UI.
3. **Manual** — click **Import Pack** on the SkyrimNet web UI 45 times.

After import, packs appear in the web UI's Knowledge Packs list grouped under the `_VKP - ` prefix.

---

## How the packs are scoped

The big design principle: an entry should only be injected into an NPC's prompt if that NPC would plausibly know about it. The pack uses SkyrimNet's `condition_expr` to control this:

| Quest archetype | Scope |
|---|---|
| Personal favors (`Argonian Bloodwine for Brenuin`, `Frost Salts for Arcadia`) | `actorName == "GiverName"` — only the giver gossips about their own task |
| Hold-wide events (`Blood on the Ice`, `Forsworn Conspiracy`, Thane quests) | `TownCityFaction OR GuardFactionCity` |
| Court intrigue (`The Whispering Door`, `The Mind of Madness`) | Specific court members by `actorName` |
| Guild operations (`Dampened Spirits`, `Brynjolf's audition`) | `ThievesGuildFaction` |
| College quests | `CollegeofWinterholdFaction` |
| Orc strongholds | `CrimeFactionOrcs` — every tribal Orc knows all four strongholds |
| Buildings | Building-specific faction + town faction; private homes scoped to building only |

Net effect: a Whiterun guard never receives Riften quest entries in their prompt. A Dawnstar beggar never hears about Companions politics. Dunmer in the Gray Quarter don't gossip about Reach gold mines. This keeps the prompt context lean and the NPC dialogue grounded in their actual position in the world.

---

## Stage-gated quest content

Quest packs use Inja templates against `get_quest_stage(...)`. The same entry reads differently before, during, and after each quest. Example from *The Black Star*:

```jinja
{% if get_quest_stage("DA01", false) == 0 %}
A shrine to Azura stands above Winterhold. The priestess Aranea Ienith offers visions to any who climb to it. Azura herself has need of a mortal — to deal with Malyn Varen, the necromancer who corrupted her Star.
{% elif get_quest_stage("DA01", false) < 30 %}
{{ playerName }} is hunting Azura's Star at Ilinalta's Deep, where Malyn Varen withdrew with what he stole.
{% elif get_quest_stage("DA01", false) < 60 %}
{{ playerName }} entered the Star itself to face Malyn Varen — and chose whose hand it would be reforged in.
{% else %}
The Star is reforged. {{ playerName }} dedicated it to Azura — restoring its purity — or to Nelacar, leaving it the Black Star and able to hold black souls.
{% endif %}
```

NPCs answer questions about active quests with current state, not stale pre-quest setup. `{{ playerName }}` resolves to the player's character name at injection time.

Major story dungeons (Bleak Falls Barrow, Dustman's Cairn, etc.) also have stage-gated cleared / uncleared variants in the dungeon packs.

---

## Bulk Importer tool

A small JavaScript snippet that drives the existing **Import Pack** button in the SkyrimNet web UI. Picks a folder via the File System Access API, feeds each `.sknpack` file through the same code path the manual button uses, optionally deletes existing same-named packs first.

### Install

**Bookmarklet (one-click install, no extension):**
- Open [`install.html`](install.html) in Chrome or Edge.
- Drag the green **Bulk Import .sknpack** button to your bookmarks bar.
- Open the SkyrimNet web UI, click the bookmark, pick the folder of `.sknpack` files.

**Tampermonkey userscript (permanent button on the page):**
- Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
- Open [`skyrimnet-bulk-importer.user.js`](skyrimnet-bulk-importer.user.js) — your userscript manager will offer to install.
- A **Bulk Import** button appears next to **Import Pack** on every page load.

### Replace-existing behavior

Right after picking the folder, a confirm dialog appears:

> Found *N* `.sknpack` files.
> OK = Replace any existing pack with the same name (delete old, import new).
> Cancel = Add as new packs (duplicates get a `(1)` suffix).

**OK** — for each file, the importer parses the pack `name` field, finds the existing pack card on the page, clicks its Delete button (auto-accepting the confirm dialog), waits, then imports the new version.

**Cancel** — original behavior. Duplicates get the SkyrimNet UI's automatic `(1)` suffix.

Progress overlay shows three counters: ✓ imported · ↻ replaced · ✗ failed.

Full details in [`install.html`](install.html).

### Limitations

- Chrome / Edge only (Firefox does not yet support `showDirectoryPicker`).
- Replace mode matches pack names exactly — if your existing pack has a different name (capitalisation, trailing whitespace, no `_VKP - ` prefix), it won't match and the file will fall through to duplicate-creation.
- Default delay between imports is 2.5 s. Bump it in the userscript if your install is slow.

---

## Repository layout

```
/
├── README.md
├── LICENSE
├── install.html                            # bulk importer — one-page installer with draggable bookmarklet
├── bookmarklet.txt                         # raw bookmarklet URL
├── skyrimnet-bulk-importer.user.js         # Tampermonkey userscript
└── Knowledge Packs/
    └── Vanilla Knowledge Packs/            # the 45 .sknpack files (point the bulk importer here)
        └── _VKP_-_*.sknpack
```

Drop `_VKP_-_*.sknpack` files from `Knowledge Packs/Vanilla Knowledge Packs/` into the bulk importer.

---

## Compatibility and scope

- **Vanilla Skyrim + all four DLCs** (Dawnguard, Dragonborn, Hearthfire, the base game).
- **No modlist-specific content.** Companion to a separate Beyond Reach pack, not part of this bundle.
- **Compatible alongside other knowledge packs.** Every entry uses a unique `<category>.<hold>.<slug>` key and is faction-scoped — won't conflict with hand-authored or other community packs.
- **Faction names verified** against the live SkyrimNet faction registry (via the IntelEngine plugin's `factions.yaml` and the existing knowledge entry corpus) — `CrimeFactionReach`, `CrimeFactionRift`, `CrimeFactionOrcs`, `GuardFactionDawnstar`, `GuardFactionMorthal`, `GuardFactionWindhelm`, etc.

If any specific entry's `condition_expr` doesn't fire on an NPC you expect, the underlying CK faction name is the likely culprit — edit the entry in the SkyrimNet web UI's pack editor.

---

## Author / credits

Pack authored by `_gaius`.

Built on top of [SkyrimNet](https://goncalo22.github.io/SkyrimNet-GamePlugin/) by MinLL. SkyrimNet's knowledge pack format, Inja templating, and faction predicate functions are documented at the SkyrimNet docs site.

Lore, NPC details, quest beats, and faction names cross-referenced against the [Unofficial Elder Scrolls Pages (UESP)](https://en.uesp.net/wiki/Main_Page) — the authoritative community resource for Elder Scrolls content. The AI-drafted prose was checked against UESP entries and corrected where it diverged from canon.

---

## How this was made

This bundle was built as a collaboration between `_gaius` and Claude (Anthropic's LLM, accessed through Cowork mode). Plain accounting of who did what, so anyone reading can judge the work for what it is.

### Design and direction — `_gaius`

- Defined the scope: vanilla + DLCs only, every entry faction-scoped so it doesn't flood every NPC's prompt.
- Set the structural patterns the bundle follows — naming conventions, knowledge-key shape, per-category scope rules, pack naming, the workflow for exporting and importing into the SkyrimNet web UI.
- Identified the `.sknpack` format from existing SkyrimNet packs and defined what the conversion pipeline needed to produce.
- Reviewed every AI-authored entry against [UESP](https://en.uesp.net/wiki/Main_Page) and corrected the prose and faction references where the AI drift produced wrong names, wrong roles, wrong relationships, or non-canon details.
- Tested every iteration, caught failures (malformed templates, schema mismatches, duplicate-on-reimport behavior), and pushed corrections back.
- Made every editorial call. Drove every decision about what belongs in scope and what doesn't.

### Execution — Claude

- Queried the running Skyrim's plugin (FormIDs, editor IDs, quest stage indices) to ground every entry in actual game data rather than guesses.
- Wrote the prose for all 500 entries — building layouts, NPC bios, dungeon descriptions, mine summaries, multi-stage quest narratives.
- Applied the scoping rules to each entry: personal favors → `actorName` checks, hold-public events → `Town`/`Guard` factions, guild operations → guild faction, court intrigue → specific court rosters, Orc strongholds → `CrimeFactionOrcs`.
- Cross-verified faction names against the SkyrimNet faction registry and live entry corpus; corrected several initial guesses before final export.
- Wrote the conversion pipeline that wraps source data in the `.sknpack` schema.
- Wrote the Bulk Importer (bookmarklet + Tampermonkey userscript), including the replace-existing flow.
- Wrote this README and the install documentation.

### Process

Iterative: Claude proposed, `_gaius` reviewed, approved, redirected, or rewrote. Several rounds of test → catch failure → fix → re-test before the bundle was stable. The Bulk Importer itself came out of the test loop — manually importing 45 files one at a time wasn't sustainable.

The structural scaffolding (faction scoping, stage gating, key naming) was designed deliberately and should hold. The prose was AI-authored under direction, then reviewed against UESP and corrected by `_gaius` where the model drifted. Anything still in the bundle that doesn't fit the world — a wrong faction name, a name spelling that doesn't match the in-game NPC, a quest stage threshold that misses by a few indices — is fair to flag, and easy to fix in the SkyrimNet pack editor.

---

## License

[MIT](LICENSE) — use, fork, redistribute, modify. Attribution appreciated but not required.
