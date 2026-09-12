# Vanilla Knowledge Packs for SkyrimNet

A bundle of 45 SkyrimNet knowledge packs covering vanilla Skyrim and DLCs. ~840 entries: notable people, buildings, quests, dungeons, mines, and Orc strongholds. Every entry is faction-scoped so it doesn't leak to NPCs who'd have no reason to know.

(Depricated) Ships with a one-click **Bulk Importer** so you don't have to click *Import Pack* 45 times.

---

## Contents

- [What's in the bundle](#whats-in-the-bundle)
- [Install the packs](#install-the-packs)
- [How the packs are scoped](#how-the-packs-are-scoped)
- [Stage-gated quest content](#stage-gated-quest-content)
- [Bulk Importer tool](#bulk-importer-tool)
- [Repository layout](#repository-layout)
- [Compatibility and scope](#compatibility-and-scope)
- [Changelog](#changelog)
- [Author and credits](#author-and-credits)

---

## What's in the bundle

45 packs, ~840 entries total. Every pack name is prefixed `_VKP - ` so they sort together in the SkyrimNet pack list.

| Category | Packs | Examples |
|---|---|---|
| Hold quest packs (x9) | Whiterun, Reach, Haafingar, Eastmarch, Rift, Winterhold, Pale, Falkreath, Hjaalmarch | The Whispering Door, Forsworn Conspiracy, Blood on the Ice, Waking Nightmare |
| City building layouts (x9) | Whiterun, Falkreath, Morthal, Winterhold, Dawnstar, Solitude, Markarth, Windhelm, Riften | Dragonsreach, Jorrvaskr, Blue Palace, Understone Keep, Palace of the Kings, Mistveil Keep |
| Notable People (x9) | One per city | Jarls, court, the Companions Circle, the Thieves Guild, the Silver-Bloods, the Black-Briars, the Bards College, the College of Winterhold faculty |
| Hold dungeon packs (x9) | Per hold | Bleak Falls Barrow, Saarthal, Folgunthur, Mzulft, Volskygge, Karthspire, Avanchnzel |
| Hold mine packs (x8) | Winterhold has none | Cidhna Mine, Kolskeggr, Gloombound, Iron-Breaker, Quicksilver, Steamscorch |
| Orc Strongholds (x1) | All four | Largashbur, Mor Khazgur, Narzulbur, Dushnikh Yal + Code of Malacath |

---

## Install the packs

Three ways, listed best to worst:

1. (Depricated, do not use.) **Bulk Importer (recommended).** See [Bulk Importer tool](#bulk-importer-tool). Drag-and-drop a bookmarklet, pick the folder, done.
2. **Tampermonkey userscript.** Adds a permanent **Bulk Import** button to the SkyrimNet web UI.
3. **Manual.** Click **Import Pack** on the SkyrimNet web UI 45 times.

After import, packs appear in the web UI's Knowledge Packs list grouped under the `_VKP - ` prefix.

---

## How the packs are scoped

The big design principle: an entry should only be injected into an NPC's prompt if that NPC would plausibly know about it. The pack uses SkyrimNet's `condition_expr` to control this:

| Quest archetype | Scope |
|---|---|
| Personal favors (`Argonian Bloodwine for Brenuin`, `Frost Salts for Arcadia`) | `actorName == "GiverName"`. Only the giver gossips about their own task |
| Hold-wide events (`Blood on the Ice`, `Forsworn Conspiracy`, Thane quests) | `TownCityFaction OR GuardFactionCity` |
| Court intrigue (`The Whispering Door`, `The Mind of Madness`) | Specific court members by `actorName` |
| Guild operations (`Dampened Spirits`, `Brynjolf's audition`) | `ThievesGuildFaction` |
| College quests | `CollegeofWinterholdFaction` |
| Orc strongholds | `CrimeFactionOrcs`. Every tribal Orc knows all four strongholds |
| Buildings | Building-specific faction + town faction; private homes scoped to building only |

Net effect: a Whiterun guard never receives Riften quest entries in their prompt. A Dawnstar beggar never hears about Companions politics. Dunmer in the Gray Quarter don't gossip about Reach gold mines. This keeps the prompt context lean and the NPC dialogue grounded in their actual position in the world.

---

## Stage-gated quest content

Quest packs use Inja templates against `get_quest_stage(...)`. The same entry reads differently before, during, and after each quest. Example from *The Black Star*:

```jinja
{% if get_quest_stage("DA01", false) == 0 %}
A shrine to Azura stands above Winterhold. The priestess Aranea Ienith offers visions to any who climb to it. Azura herself has need of a mortal to deal with Malyn Varen, the necromancer who corrupted her Star.
{% elif get_quest_stage("DA01", false) < 30 %}
{{ playerName }} is hunting Azura's Star at Ilinalta's Deep, where Malyn Varen withdrew with what he stole.
{% elif get_quest_stage("DA01", false) < 60 %}
{{ playerName }} entered the Star itself to face Malyn Varen and chose whose hand it would be reforged in.
{% else %}
The Star is reforged. {{ playerName }} dedicated it to Azura, restoring its purity, or to Nelacar, leaving it the Black Star and able to hold black souls.
{% endif %}
```

NPCs answer questions about active quests with current state, not stale pre-quest setup. `{{ playerName }}` resolves to the player's character name at injection time.

Major story dungeons (Bleak Falls Barrow, Dustman's Cairn, etc.) also have stage-gated cleared / uncleared variants in the dungeon packs.

---
## DEPRICATED. DO NOT USE. SKYRIMNET NOW HAS ITS OWN BULK IMPORTING TOOL!
## Bulk Importer tool

A small JavaScript snippet that drives the existing **Import Pack** button in the SkyrimNet web UI. Picks a folder via the File System Access API, feeds each `.sknpack` file through the same code path the manual button uses, optionally deletes existing same-named packs first.

> **v1.2 critical safety fix.** v1.1 had a bug where Replace mode could delete unrelated packs because its DOM walk for the matching pack-card could land on a parent containing multiple cards' Delete buttons and pick the wrong one. v1.2 fixes this with three guards: pack-name matching is restricted to heading elements only, the ancestor scope must contain exactly one Delete button, and Replace mode now shows a dry-run list with a second confirmation before deleting anything. Default mode is safe Add-as-duplicate; you have to explicitly opt into Replace.

### Install

**Bookmarklet (no extension required):**

1. Open [`install.html`](install.html) in Chrome or Edge.
2. Click the green **Open Bookmarklet URL** button. A new tab opens with the bookmarklet URL.
3. In the new tab, press <kbd>Ctrl</kbd>+<kbd>A</kbd> to select all, then <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy.
4. If your bookmarks bar isn't visible, press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> to show it.
5. Right-click the bookmarks bar. Choose **Add favorite** (Edge), **Add page** (Chrome), or **New Bookmark** (Firefox).
6. Name it `Bulk Import`. In the URL field, delete what's there and paste (<kbd>Ctrl</kbd>+<kbd>V</kbd>) the URL you copied.
7. Click **Save**. The bookmark now lives on your bookmarks bar.

To use it: open the SkyrimNet web UI on the Knowledge Packs page, click your new Bulk Import bookmark, pick the folder of `.sknpack` files, answer the prompt (Cancel for safe first install), wait.

**Tampermonkey userscript (permanent button on the page):**

Modern browsers (Chrome, Edge, Firefox) block automatic userscript installs for security reasons. You'll see a popup that says "We can't add apps, extensions, or user scripts from this website". That's normal. Tampermonkey can still install the script, but you have to paste it in manually. Follow these steps:

1. **Install Tampermonkey first.** Go to [tampermonkey.net](https://www.tampermonkey.net/) and click the install button for your browser. After installing, look at the top-right of your browser window. You should see a small icon shaped like two black-and-red squares. If you don't see it, click the puzzle-piece icon (also top-right) and pin Tampermonkey to your toolbar.

2. **Open the Tampermonkey Dashboard.** Click the Tampermonkey icon. A small menu pops up. In that menu, click **Dashboard**. A new tab opens. This is the control panel.

3. **Open the new-script editor.** At the top of the dashboard there's a row of tabs. Find the tab labeled with a **+** symbol and click it. The page switches to a code editor. Some placeholder text is already in the editor. Ignore it for now.

4. **Clear the editor.** Click inside the code area. Press <kbd>Ctrl</kbd>+<kbd>A</kbd> (hold the Ctrl key, then tap A) to highlight everything. Press the <kbd>Delete</kbd> key. The editor is now empty.

5. **Copy the script text.** Open [`skyrimnet-bulk-importer.user.js`](skyrimnet-bulk-importer.user.js):
   - **On GitHub:** click the file to view it, then click the small "Copy raw file" icon in the top-right of the file content (it looks like two overlapping pages).
   - **If you downloaded the ZIP:** find the file on your computer, right-click it, choose **Open with**, then **Notepad** (Windows) or **TextEdit** (Mac). Click anywhere in the text, then press <kbd>Ctrl</kbd>+<kbd>A</kbd> to select all, then <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy.

6. **Paste into the editor.** Switch back to the Tampermonkey editor tab. Click inside the empty editor area. Press <kbd>Ctrl</kbd>+<kbd>V</kbd> to paste. The script should appear; it starts with `// ==UserScript==` and is about 140 lines long.

7. **Save.** Press <kbd>Ctrl</kbd>+<kbd>S</kbd>. Or click **File** at the top of the editor, then **Save**.

8. **Test.** Reload your SkyrimNet web UI tab (`http://localhost:8080`). A green **Bulk Import** button should appear next to the existing **Import Pack** button. If it's there, you're done.

**If the button doesn't appear:** open the Tampermonkey Dashboard again and check that "SkyrimNet Bulk Pack Importer" appears in the list of scripts with a blue toggle switched on. If it's off, click the toggle to enable it.

### Replace-existing behavior

Right after picking the folder, a confirm dialog appears:

> Found *N* `.sknpack` files.
> **REPLACE MODE:** click OK ONLY IF you want any existing pack with the same name DELETED before the new one is imported. This is destructive.
> Click **CANCEL** to import safely (duplicates get `(1)` suffix). Recommended for first install.

**Cancel (default, safe):** all files import as new packs. If a name collides, the new one gets a `(1)` suffix. Nothing is deleted.

**OK (Replace mode):** a second dialog appears with a dry-run list of every pack that would be deleted and re-imported. You confirm again before anything is deleted. For each in-scope file:

1. Read the pack `name` field from the `.sknpack` JSON.
2. Find a heading element on the page whose text matches exactly. If zero or more than one match, abort the delete for this entry (the file imports as a duplicate).
3. Walk up the DOM to the smallest ancestor that contains exactly one Delete button. If multiple Delete buttons or none, abort.
4. Auto-accept the SkyrimNet delete dialog, click Delete, wait, then import.

During the import loop the script also auto-accepts the post-import "Pack created" confirmation dialog so you don't have to click OK 45 times.

The three guards above were added in v1.2 after the v1.1 bug. False negatives (a name doesn't match and the file gets a `(1)` suffix) are recoverable; false positives (wrong pack deleted) are not, so the importer errs heavily toward false negatives now.

Progress overlay shows three counters: imported, replaced, failed.

Full details in [`install.html`](install.html).

### Limitations

- Chrome and Edge only (Firefox does not yet support `showDirectoryPicker`).
- Replace mode matches pack names exactly. If your existing pack has a different name (capitalisation, trailing whitespace, no `_VKP - ` prefix), it won't match and the file will fall through to duplicate-creation.
- Default delay between imports is 2.5 s. Bump it in the userscript if your install is slow.

---

## Repository layout

```
/
├── README.md
├── LICENSE
├── install.html                            # bulk importer; one-page installer with draggable bookmarklet
├── bookmarklet.txt                         # raw bookmarklet URL
├── quest-stage-reference.csv               # per-quest stage data behind the quest packs' gating
├── skyrimnet-bulk-importer.user.js         # Tampermonkey userscript
└── Knowledge Packs/
    └── Vanilla Knowledge Packs/            # the 45 .sknpack files (point the bulk importer here)
        └── _VKP_-_*.sknpack
```

Drop `_VKP_-_*.sknpack` files from `Knowledge Packs/Vanilla Knowledge Packs/` into the bulk importer.

---

## Compatibility and scope

- **Vanilla Skyrim and all four DLCs** (Dawnguard, Dragonborn, Hearthfire, the base game).
- **No modlist-specific content.** A separate Beyond Reach pack exists alongside this bundle but is not part of it.
- **Compatible alongside other knowledge packs.** Every entry uses a unique `<category>.<hold>.<slug>` key and is faction-scoped, so it won't conflict with hand-authored or other community packs.
- **Faction names verified** against the live SkyrimNet faction registry (via the IntelEngine plugin's `factions.yaml` and the existing knowledge entry corpus). Examples: `CrimeFactionReach`, `CrimeFactionRift`, `CrimeFactionOrcs`, `GuardFactionDawnstar`, `GuardFactionMorthal`, `GuardFactionWindhelm`.

If any specific entry's `condition_expr` doesn't fire on an NPC you expect, the underlying CK faction name is the likely culprit. Edit the entry in the SkyrimNet web UI's pack editor.

---

## Changelog

### Quest text follow-up: hooks read as acceptance (2026-08-31)

Follow-up to the stage-gating pass below, from a user report of Markarth NPCs describing quests the player had not begun. That pass set each entry's first branch to the quest's first journal stage, on the assumption that a journal entry means the player has taken the job. Often it does not - the first journal entry is frequently the *hook* (a note pressed into your hand, a rumour overheard, a body found on the way through town), and acceptance is a stage or two later. Nine entries changed. Re-run the Bulk Importer in Replace mode after pulling.

- **The Forsworn Conspiracy fired on arrival in Markarth.** `MS01` stage 15 is "I've received a note from a man named Eltrys ... He wants me to meet him at the Shrine of Talos" - handed to the player during the market attack, which happens automatically on first entering the city. Acceptance is stage 20, "Eltrys has asked me to uncover evidence". Boundary moved 15 -> 20.
- **No One Escapes Cidhna Mine described the player as imprisoned before the quest started.** Not a threshold problem: the not-started branch itself read "{{ playerName }} has been thrown into Cidhna Mine", so every Markarth and Reach NPC said it from a fresh save, and had since the first commit. The branches now shift down one, and the not-started branch was rewritten rather than just moved: describing the mine and Madanach restated what `mine.reach.cidhna` and `reach.people.madanach` already tell the same TownMarkarthFaction NPCs, so it now carries only what those two do not - that the Silver-Bloods use the mine to make inconvenient people disappear, which is the hook for both Reach quests. The in-progress branch carries the imprisonment.
- **Five more entries were gated on a hook stage.** *Laid to Rest* 20 -> 30 (stage 20 is "the Jarl **might** pay me to investigate"; 30 is "the Jarl **has asked** me to"). *Waking Nightmare* 20 -> 25 (20 is overhearing two citizens; 25 is "I have agreed to assist him"), and its second boundary 30 -> 50, where Erandur actually reaches the inner sanctum. *In My Time of Need* 10 -> 25 (10 is only "a group of men calling themselves the Alik'r are looking for a Redguard woman" - which is what the not-started branch already says). *Ill Met by Moonlight* 10 -> 20 (10 is "there are stories in Falkreath"; 20 is meeting Sinding), second boundary 20 -> 50. *Pieces of the Past* 10 -> 13 (10 is Silus wanting to hire you; 13 is the job accepted).
- **Two entries still gated their first branch on `== 0`.** `MS11` has a silent stage 1 (quest running, murder not yet discovered) and `DA07`'s lowest stage is 5, also silent - both below their first journal stage, so a background stage counted as the player being involved.
- **Blood on the Ice gained a fifth branch.** Its first branch named Susanna the Wicked, whose murder is what starts the quest at stage 10 - so before the quest ran, NPCs described a killing that had not happened. The not-started branch is now the standing Butcher rumour with no victim named, and a new branch covers stages 10-59 (body found, the guard has asked for help) ahead of the Hjerim search at 60.
- **`get_quest_stage` semantics confirmed against a live game.** An unstarted quest returns `0`; an editor ID that does not resolve returns `-1`, which falls into the first branch - so a typo'd quest ID fails safe rather than announcing a quest complete.
- **Three more not-started branches restated a pack that already said it better.** A quest entry and the buildings/people/dungeon entry for the same subject are scoped to the same faction, so they arrive together and spend two slots on one fact. *Pieces of the Past* opened by describing Silus and his museum, which is `pale.people.silus`'s job; it now leads with the job on offer and what Dawnstar thinks of reassembling a Daedric dagger. *The Pale Lady* was strictly contained by `dungeon.pale.frostmere_crypt`; it now carries the rule that governs the spirit - she cannot be put down while the Pale Blade is out of its pedestal. *The Black Star* lost two sentences about the shrine and Aranea's visions, both already in `winterhold.people.aranea`, and keeps the Azura and Malyn Varen hook. The division of labour: the place and people packs own the standing description, the quest entry's not-started branch owns the hook.
- **The rest of the bundle was re-read for the same fault.** Of the 82 gated entries, no other first branch presupposes the player has begun, and every remaining `== 0` test sits on a quest whose lowest stage above zero is the point the job is genuinely offered.

### Quest stage-gating pass (2026-08-29)

Re-checked every `get_quest_stage(...)` call in the bundle against the actual `QUST` records read out of the plugin files, rather than against a save or from memory. 82 entries across the nine quest packs and the Whiterun dungeon pack reference 81 distinct quests; all 81 editor IDs resolve, and every stage number referenced exists as a real stage. 68 entries changed. Re-run the Bulk Importer in Replace mode after pulling.

- **The big one: quests that had not started were being described as finished.** 52 entries gated their "done" text on `get_quest_stage(...) == 0`, on the assumption that a non-zero stage means the player has begun the quest. It does not. Skyrim starts most freeform and favor quests in the background - stage 10 means the quest object is running and the job is available, stage 20 means the player accepted, 200 means done - so the `{% else %}` branch fired the moment the cell loaded. Every Riften freeform quest, the Markarth and Solitude deliveries and the Whiterun favors would tell an NPC the player had already done a job nobody had offered. Those entries now gate on the quest's real completion stage.
- **Thirteen multi-branch entries flipped to their "resolved" text mid-quest.** Worst cases: *Waking Nightmare* called the nightmares over at stage 60 of 200 (the player has just been told to follow Erandur to the laboratory); *The Wolf Queen Awakened* announced Potema destroyed at stage 50, when that stage is Falk handing over Styrr's key and she is not defeated until 100. Also corrected: *The House of Horrors*, *Blood on the Ice*, *No One Escapes Cidhna Mine*, *In My Time of Need*, *Laid to Rest*, *The Black Star*, *Ill Met by Moonlight*, *The Forsworn Conspiracy*, *A Daedra's Best Friend*, *Supply and Demand*, *The Whispering Door*.
- **Two entries pointed at the wrong quest entirely.** The Bleak Falls Barrow cleared/uncleared pair gated on `MQ102` (*Before the Storm*, carrying word of Helgen to Balgruuf) instead of `MQ103` (*Bleak Falls Barrow*); they now split on `MQ103` stage 80, where the Dragonstone is in hand. The Dustman's Cairn entry gated on `C00` (*Take Up Arms*) instead of `C01` (*Proving Honor*), and on stage 200 - which `C00` never reaches, since it tops out at 150. That condition was therefore always true and the entry never retired. It now uses `C01 < 200`.
- **The same three dungeon conditions were parenthesised.** They were written `is_in_faction(Town) or is_in_faction(Guard) and get_quest_stage(...) < N`, and `and` binds tighter than `or`, so the stage check only ever applied to the guard clause - every town-faction NPC received both the cleared and uncleared entries regardless of quest state.
- **Blood on the Ice gained a fourth branch.** `MS11` has two real endings, each flagged Complete Quest in the record: stage 100 (Wuunferth the Unliving accused early and jailed) and stage 250 (Calixto Corrium killed). The Calixto path runs 105-205, above the first ending's stage, so no single threshold covers both. The entry now tests `== 100` before the range. Tags gained `Wuunferth the Unliving` and `Jorleif`.
- **Baseline is vanilla + DLC records.** Values were cross-checked against vanilla + USSEP and against a large modded load order: 75 of 81 quests give identical boundaries in all three. USSEP moves three (`FreeformMarkarthE`, `FreeformMorthalA`, `FreeformWinterholdC`) and mods moved three more (`DA02`, `DA08`, `DB01`); in each case the vanilla value is the one that is correct under both, so the packs stay USSEP-optional.
- **New file: `quest-stage-reference.csv`** - per quest, the full stage list, which stages carry journal entries, which carry the Complete Quest flag, the derived accepted/done boundaries, and the branch thresholds each entry now uses. Regenerate this before any future quest-gating edit rather than working from memory.
- **Deliberate omissions.** The 52 two-branch entries did not gain new "in progress" prose - they now show their setup text until the quest actually completes, which is accurate but less specific than the three-branch quest entries. Writing a middle branch for each is a content pass, not a gating fix. `FreeformMorthalA` keeps `< 200` even though USSEP adds a Complete Quest flag at stage 10; that early-out is the "Falion is harmless" path, and gating on 10 would call the quest finished mid-investigation on vanilla. `DA02` uses stage 40, where the journal reads "she has made me her new champion", rather than the script-set flag at 50. `MS02` uses stage 100, the lower of its two endings, which is safe because everything still in progress sits at or below stage 80.

### Notable People completeness pass (2026-05-20)

Cross-checked every Notable People pack against the in-game `TownXFaction` membership (dumped via an xEdit Pascal script over the vanilla masters) and filled in the gaps the 2026-05-18 expansion missed. Same install workflow; re-run the Bulk Importer in Replace mode after pulling.

- **Seven entries added across three holds.**
  - **Dawnstar:** Alesan - the Redguard orphan who runs food and water out to the miners at Iron-Breaker and Quicksilver, HearthFires-adoptable. Pack 28 -> 29.
  - **Solitude:** Elenwen (Thalmor First Emissary at the Embassy, ran Ulfric's Great War interrogation), Pelagius the Mad (the dead Septim emperor whose fractured mind Sheogorath keeps in the sealed wing of the Blue Palace), Ma'zaka (the Khajiit who tends the Solitude Lighthouse). Pack 82 -> 85.
  - **Whiterun:** Thorald Gray-Mane (Fralia and Vignar's missing son, held by the Thalmor at Northwatch Keep - *Missing in Action*), Sickly Farmer and Wounded Soldier (the two patients on the healing altars at the Temple of Kynareth). Pack 77 -> 80.
- **Oengul surname fix (Windhelm).** The Stormcloak smith was written as "Oengul One-Eye" in display_name, content, and tags; the in-game FULL name is "Oengul War-Anvil". All three references corrected; entry count unchanged.
- **Deliberate skips.** Ten other `TownXFaction` members were left out after UESP lookup. Captain Metilius (Solitude), Terek (Whiterun), Benkum, Brond, Edorfin, Huki Seven-Swords, Liesl, and Sulvar the Steady (all Windhelm) are unused/cut content - the Windhelm arena, the Wheelhouse, and a Dragon Rising legion variant that didn't ship. Gadnor is a Saints & Seducers Creation Club body in Crystaldrift Cave, not a Solitude resident. Valie is a dead-from-start corpse in a tent at Alftand. Gemma Uriel is a Kynesgrove resident who never enters Windhelm despite the faction membership.

### Pack content updates (2026-05-18)

Several rounds of edits to the pack data itself. None of these change the install process; just re-run the Bulk Importer in Replace mode after pulling the new files and your existing packs will be swapped out.

- **Notable People rosters roughly tripled.** The Notable People packs originally had only the most prominent characters per city. Added the rest of each city's named residents: shopkeepers, smiths, mages, beggars, retired soldiers, mill workers, dockhands, minor court members, faction members, and so on. New counts: Dawnstar 28, Falkreath 31, Markarth 86, Morthal 18, Riften 96, Solitude 82, Whiterun 77, Windhelm 66, Winterhold 35. About 340 new people-entries across the bundle.
- **Expanded tags on every Notable People entry.** Previously the tags were almost all proper nouns (the character's name, their family, their building). Added concept tags so the SkyrimNet tag search can surface a character by topic. Example: the court mage now has `magic` as a tag, so asking "does anyone here know magic?" can pull them up. Common new tags include `governance`, `military`, `mining`, `hospitality`, `music`, `faith`, `worship`, `redemption`, `feud`, `rivalry`, `domestic`, `veteran`.
- **Expanded tags on every quest entry.** Quest entries used to be tagged only with the quest's own name plus a generic `quest` tag, which made tag search useless for quests. Replaced with topical tags: hold name, quest category (`assassination`, `delivery`, `investigation`, `fetch`, `maritime`, `ritual`, etc.), quest classification (`misc_quest`, `side_quest`, `dark_brotherhood`), and key NPCs involved. Now an NPC can be matched to a quest by what the quest is *about*, not just by its in-game title.
- **Faction-name cleanup.** Several condition_expr strings had a stray `@` prefix on faction names (e.g. `is_in_faction(actorUUID, "@ThievesGuildFaction")`). The `@` was a leftover marker from the conversion pipeline that wasn't supposed to ship. Those conditions would never fire because no faction is literally named `@ThievesGuildFaction`. Affected several Notable People packs (Riften and Solitude were the largest); now stripped clean.
- **Morthal mill tag scoping fix.** The Morthal Lumber Mill building entry had `Lami` and `Idgrod` listed as tags, which would cause it to inject any time those names came up even when the conversation had nothing to do with the mill. Removed; the mill entry now tags only on the mill itself and its actual owner Jorgen.

### Bulk Importer v1.2 (2026-05-18)

Critical safety fix. v1.1 could delete unrelated packs in Replace mode.

- Fix: pack-name lookup restricted to heading elements (`h1` to `h6`) so it no longer matches text in descriptions or tags.
- Fix: ancestor scope must contain exactly one Delete button. If zero or more than one, the importer aborts the delete for that entry and falls through to safe duplicate-creation.
- New: Replace mode now shows a dry-run list of every pack that would be deleted and requires a second confirmation before anything is deleted.
- New: import loop auto-accepts the post-import "Pack created" confirmation, so you don't have to click OK after every file.
- Default mode is now safe Add-as-duplicate (Cancel button); Replace mode is explicit opt-in.
- Documentation rewritten with beginner-friendly step-by-step install for both bookmarklet and userscript.

### Bulk Importer v1.1 (2026-05-17)

- New: Replace mode. Optionally deletes any pack with the same name before importing the new version.
- New: progress overlay with imported / replaced / failed counters.
- **Known bug, fixed in v1.2:** Replace mode could delete unrelated packs in rare DOM layouts. Do not use v1.1; upgrade to v1.2.

### Bulk Importer v1.0 (2026-05-17)

- Initial release.
- Folder picker (Chrome / Edge File System Access API), feeds each `.sknpack` through the existing **Import Pack** input.
- Two install paths: bookmarklet (drag to bookmarks bar) and Tampermonkey userscript (permanent button injected next to **Import Pack**).
- No replace functionality; duplicates were created with `(1)` suffix.

### Vanilla Knowledge Packs (initial release, 2026-05-18)

- 45 packs covering vanilla Skyrim + DLCs (~840 entries after the 2026-05-18 Notable People expansion).
- Categories: hold quest packs, city building layouts, Notable People, hold dungeons, hold mines, Orc Strongholds + Code of Malacath.
- Faction scoping per quest archetype: personal favors keyed on `actorName`, hold-public events on `Town`/`Guard` factions, guilds on the guild faction, court intrigue on individual court rosters, Orc strongholds on `CrimeFactionOrcs`.
- Stage-gated quest content via Inja templates against `get_quest_stage(...)` with `{{ playerName }}` interpolation.
- Faction names verified against the IntelEngine plugin's `factions.yaml` and the existing knowledge entry corpus.
- All prose AI-drafted under design direction, then reviewed and corrected against UESP by `_gaius`.

---

## Author and credits

Pack authored by `_gaius`.

Built on top of [SkyrimNet](https://goncalo22.github.io/SkyrimNet-GamePlugin/) by MinLL. SkyrimNet's knowledge pack format, Inja templating, and faction predicate functions are documented at the SkyrimNet docs site.

Lore, NPC details, quest beats, and faction names cross-referenced against the [Unofficial Elder Scrolls Pages (UESP)](https://en.uesp.net/wiki/Main_Page), the authoritative community resource for Elder Scrolls content. The AI-drafted prose was checked against UESP entries and corrected where it diverged from canon.

---

## How this was made

This bundle was built as a collaboration between `_gaius` and Claude (Anthropic's LLM, accessed through Cowork mode). Plain accounting of who did what, so anyone reading can judge the work for what it is.

### Design and direction (`_gaius`)

- Defined the scope: vanilla + DLCs only, every entry faction-scoped so it doesn't flood every NPC's prompt.
- Set the structural patterns the bundle follows: naming conventions, knowledge-key shape, per-category scope rules, pack naming, the workflow for exporting and importing into the SkyrimNet web UI.
- Identified the `.sknpack` format from existing SkyrimNet packs and defined what the conversion pipeline needed to produce.
- Reviewed every AI-authored entry against [UESP](https://en.uesp.net/wiki/Main_Page) and corrected the prose and faction references where the AI drift produced wrong names, wrong roles, wrong relationships, or non-canon details.
- Used Deepseek v4 Flash for targeted bulk edits across the pack files when sweeping changes were faster than per-entry hand-editing. Examples: normalizing faction-name strings across hundreds of entries, fixing prose patterns that repeated incorrectly, applying a consistent rewrite to a whole category at once. Anything Deepseek touched was then re-checked against UESP.
- Tested every iteration, caught failures (malformed templates, schema mismatches, duplicate-on-reimport behavior), and pushed corrections back.
- Made every editorial call. Drove every decision about what belongs in scope and what doesn't.

### Execution (Claude)

- Queried the running Skyrim's plugin (FormIDs, editor IDs, quest stage indices) to ground every entry in actual game data rather than guesses.
- Wrote the prose for the bundle's entries: building layouts, NPC bios, dungeon descriptions, mine summaries, multi-stage quest narratives.
- Applied the scoping rules to each entry: personal favors to `actorName` checks, hold-public events to `Town`/`Guard` factions, guild operations to guild faction, court intrigue to specific court rosters, Orc strongholds to `CrimeFactionOrcs`.
- Cross-verified faction names against the SkyrimNet faction registry and live entry corpus; corrected several initial guesses before final export.
- Wrote the conversion pipeline that wraps source data in the `.sknpack` schema.
- Wrote the Bulk Importer (bookmarklet + Tampermonkey userscript), including the replace-existing flow.
- Wrote this README and the install documentation.

### Process

Iterative: Claude proposed, `_gaius` reviewed, approved, redirected, or rewrote. Several rounds of test, catch failure, fix, re-test before the bundle was stable. The Bulk Importer itself came out of the test loop, because manually importing 45 files one at a time wasn't sustainable.

The structural scaffolding (faction scoping, stage gating, key naming) was designed deliberately and should hold. The prose was AI-authored under direction, then reviewed against UESP and corrected by `_gaius` where the model drifted. Anything still in the bundle that doesn't fit the world (a wrong faction name, a name spelling that doesn't match the in-game NPC, a quest stage threshold that misses by a few indices) is fair to flag, and easy to fix in the SkyrimNet pack editor.

---

## License

[MIT](LICENSE). Use, fork, redistribute, modify. Attribution appreciated but not required.
