## Knowledge Packs update — 2026-08-31

Fixes NPCs talking about quests you haven't started. 10 entries across 7 quest packs.

**Re-run the Bulk Importer in Replace mode after updating.**

**Why they fired early**
The last pass gated each "not started" branch on a quest's first journal entry, treating that as proof you'd accepted. Usually it isn't — the first entry is the hook. `MS01` stage 15 is *"I've received a note from a man named Eltrys"*, pressed on you during the market attack that fires just for entering Markarth. Acceptance is stage 20.

**Thresholds corrected**
```
The Forsworn Conspiracy   < 15        ->  < 20
Laid to Rest              < 20        ->  < 30
Waking Nightmare          < 20, < 30  ->  < 25, < 50
In My Time of Need        < 10        ->  < 25
Ill Met by Moonlight      < 10, < 20  ->  < 20, < 50
Pieces of the Past        == 0        ->  < 13
Blood on the Ice          == 0        ->  < 10
```

**Wrong text before the quest starts**
- **No One Escapes Cidhna Mine** opened `{{ playerName }} has been thrown into Cidhna Mine` from a fresh save. Every Markarth and Reach NPC said it, and had since the first release. The threshold was fine; the sentence was one branch too early.
- **Blood on the Ice** named Susanna the Wicked, whose murder is what *starts* the quest. It's now the standing Butcher rumour, plus a new branch for the investigation before the Hjerim search.

**Duplicate knowledge**
Four "not started" branches repeated what the buildings, people and dungeon packs already tell the same NPCs — two slots for one fact. They now carry the quest hook only: Cidhna Mine, Pieces of the Past, The Pale Lady, The Black Star.

**Notes**
- Boundaries come from the `QUST` records and their journal text, not from a save.
- `get_quest_stage` returns 0 for an unstarted quest and -1 for an unknown ID — which falls into the first branch, so a bad ID fails safe.
- The other 72 gated entries were re-read for the same faults — unchanged.
