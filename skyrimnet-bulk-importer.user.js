// ==UserScript==
// @name         SkyrimNet Bulk Pack Importer
// @namespace    https://github.com/gaius-alt/GaiusKnowledgePacks
// @version      1.2
// @description  Adds a "Bulk Import" button — picks a folder, imports every .sknpack, optionally replaces existing packs with the same name (with strict safety checks).
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        http://host.docker.internal:8080/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Claude-edited 2026-05-18: v1.2 — fix critical bug where replace-mode could
// delete unrelated packs. findDeleteBtnByName now (a) only matches the pack
// name in heading-style elements, (b) requires the ancestor scope contain
// exactly one Delete button, (c) skips the delete entirely when ambiguous.

(function () {
  'use strict';

  const BTN_ID = 'skn-bulk-btn';
  const DELAY_IMPORT = 2500;
  const DELAY_DELETE = 1500;

  const findImportButton = () =>
    [...document.querySelectorAll('button')].find(b => /import\s*pack/i.test(b.textContent));

  function ensureBulkButton() {
    if (document.getElementById(BTN_ID)) return;
    const importBtn = findImportButton();
    if (!importBtn) return;
    const bulkBtn = document.createElement('button');
    bulkBtn.id = BTN_ID;
    bulkBtn.textContent = 'Bulk Import';
    bulkBtn.className = importBtn.className;
    bulkBtn.style.marginLeft = '8px';
    bulkBtn.addEventListener('click', runBulkImport);
    importBtn.parentElement.insertBefore(bulkBtn, importBtn.nextSibling);
  }

  function makeOverlay() {
    const o = document.createElement('div');
    o.style.cssText =
      'position:fixed;top:20px;right:20px;background:#1e293b;color:#fff;' +
      'padding:16px 20px;border-radius:10px;font-family:ui-monospace,monospace;' +
      'z-index:99999;box-shadow:0 12px 32px rgba(0,0,0,0.6);min-width:340px;' +
      'border:1px solid #334155;font-size:13px;line-height:1.5';
    o.innerHTML =
      '<div style="font-weight:bold;margin-bottom:8px;color:#22c55e;font-size:14px">' +
      'SkyrimNet Bulk Import</div>' +
      '<div id="skn-bulk-status">Choose folder...</div>' +
      '<div style="margin-top:10px;text-align:right">' +
      '<a href="#" id="skn-bulk-close" style="color:#94a3b8;text-decoration:none;font-size:11px">close</a>' +
      '</div>';
    document.body.appendChild(o);
    o.querySelector('#skn-bulk-close').addEventListener('click', e => { e.preventDefault(); o.remove(); });
    return { overlay: o, status: o.querySelector('#skn-bulk-status') };
  }

  // SAFE pack-card finder.
  // Returns the Delete button for the pack card whose visible heading EXACTLY
  // matches packName, or null if zero matches OR the match is ambiguous.
  // Conservative on purpose — false negatives (no delete, file gets a (1)
  // suffix) are recoverable; false positives (deletes wrong pack) are not.
  function findDeleteBtnByName(packName) {
    const want = packName.trim();
    if (!want) return null;

    // Only consider heading-style elements as potential card titles.
    // Avoids matching pack-description text or tag chips.
    const candidates = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(el => el.textContent.trim() === want);

    // Demand exactly one heading on the page with this name.
    // If 0 → pack doesn't exist; nothing to delete. If 2+ → already ambiguous; refuse.
    if (candidates.length !== 1) return null;

    const heading = candidates[0];

    // Walk up from the heading looking for the smallest ancestor that
    // contains EXACTLY ONE Delete button. That ancestor is the pack card.
    let c = heading;
    for (let i = 0; i < 8 && c; i++) {
      c = c.parentElement;
      if (!c) break;
      const delBtns = [...c.querySelectorAll('button')]
        .filter(b => /^\s*delete\s*$/i.test(b.textContent));
      if (delBtns.length === 1) {
        // Sanity check: this ancestor's heading must still be our pack.
        const headings = [...c.querySelectorAll('h1, h2, h3, h4, h5, h6')]
          .filter(h => h.textContent.trim() === want);
        if (headings.length === 1 && headings[0] === heading) {
          return delBtns[0];
        }
        // Otherwise we've drifted into the wrong scope; refuse.
        return null;
      }
      if (delBtns.length > 1) {
        // Multiple delete buttons in scope — we walked too far. Refuse.
        return null;
      }
    }
    return null;
  }

  async function captureFileInput() {
    let input = document.querySelector('input[type="file"][accept*="sknpack"]')
             || document.querySelector('input[type="file"]');
    if (input) return input;
    const btn = findImportButton();
    if (!btn) return null;
    const orig = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type === 'file') input = this; };
    btn.click();
    HTMLInputElement.prototype.click = orig;
    return input;
  }

  async function runBulkImport() {
    const { overlay, status } = makeOverlay();
    try {
      if (!window.showDirectoryPicker) {
        status.innerHTML = '<span style="color:#f87171">Your browser does not support showDirectoryPicker. Use Chrome or Edge.</span>';
        return;
      }
      let dir;
      try { dir = await window.showDirectoryPicker(); }
      catch { status.textContent = 'Cancelled.'; return; }

      status.textContent = 'Reading folder...';

      const files = [];
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.sknpack')) {
          const file = await handle.getFile();
          let packName = name.replace(/\.sknpack$/, '').replace(/_/g, ' ');
          try {
            const parsed = JSON.parse(await file.text());
            packName = parsed?.skyrimnet_knowledge_pack?.name || packName;
          } catch {}
          files.push({ file, packName });
        }
      }
      if (!files.length) {
        status.innerHTML = '<span style="color:#fbbf24">No .sknpack files found in that folder.</span>';
        return;
      }

      // Replace mode is OPT-IN. Cancel (default) is safe add-as-duplicate.
      const overwrite = confirm(
        `Found ${files.length} .sknpack files.\n\n` +
        `REPLACE MODE: click OK ONLY IF you want any existing pack with the same name DELETED before the new one is imported. This is destructive.\n\n` +
        `Click CANCEL to import safely (duplicates get a "(1)" suffix). Recommended for first install.`
      );

      // In replace mode, do a dry run to show which packs would be deleted.
      // User must confirm a second time after seeing the list.
      if (overwrite) {
        const wouldDelete = [];
        const wouldSkipAmbiguous = [];
        const wouldImportFresh = [];
        for (const { packName } of files) {
          const btn = findDeleteBtnByName(packName);
          if (btn) wouldDelete.push(packName);
          else {
            // Check if heading exists at all to differentiate skip-ambiguous from import-fresh
            const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
              .filter(el => el.textContent.trim() === packName.trim());
            if (headings.length > 0) wouldSkipAmbiguous.push(packName);
            else wouldImportFresh.push(packName);
          }
        }
        const lines = [
          `Replace-mode dry run:`,
          ``,
          `WILL DELETE then re-import (${wouldDelete.length}):`,
          ...wouldDelete.map(n => `  • ${n}`),
          ``,
          `WILL IMPORT FRESH (no existing pack found, ${wouldImportFresh.length}):`,
          ...wouldImportFresh.slice(0, 8).map(n => `  • ${n}`),
        ];
        if (wouldImportFresh.length > 8) lines.push(`  ... and ${wouldImportFresh.length - 8} more`);
        if (wouldSkipAmbiguous.length) {
          lines.push('');
          lines.push(`WILL SKIP DELETE (name ambiguous, would import as duplicate, ${wouldSkipAmbiguous.length}):`);
          wouldSkipAmbiguous.forEach(n => lines.push(`  • ${n}`));
        }
        lines.push('');
        lines.push('Click OK to proceed. Click Cancel to abort the entire import.');
        const proceed = confirm(lines.join('\n'));
        if (!proceed) { status.innerHTML = '<span style="color:#94a3b8">Aborted.</span>'; return; }
      }

      const input = await captureFileInput();
      if (!input) { status.innerHTML = '<span style="color:#f87171">Could not capture file input.</span>'; return; }

      // Override window.confirm and window.alert for the entire import loop.
      // Catches both the SkyrimNet delete dialog (before import) and the
      // "Pack created successfully" dialog (after import). User-facing prompts
      // outside the loop, including the dry-run confirmation, ran above and
      // are unaffected.
      const origConfirm = window.confirm;
      const origAlert = window.alert;
      window.confirm = () => true;
      window.alert = () => undefined;

      let imported = 0, replaced = 0, failed = 0;
      try {
        for (let i = 0; i < files.length; i++) {
          const { file, packName } = files[i];
          status.innerHTML =
            `<div>[${i + 1}/${files.length}] <span style="color:#67e8f9">${packName}</span></div>` +
            `<div style="margin-top:6px">` +
            `<span style="color:#22c55e">&#10003; ${imported}</span> &middot; ` +
            `<span style="color:#fbbf24">&#8635; ${replaced}</span> &middot; ` +
            `<span style="color:#f87171">&#10007; ${failed}</span></div>`;
          try {
            if (overwrite) {
              const delBtn = findDeleteBtnByName(packName);
              if (delBtn) {
                delBtn.click();
                await new Promise(r => setTimeout(r, DELAY_DELETE));
                replaced++;
              }
            }
            const dt = new DataTransfer();
            dt.items.add(file);
            input.value = '';
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, DELAY_IMPORT));
            imported++;
          } catch (e) {
            console.error('[bulk-import]', packName, e);
            failed++;
          }
        }
      } finally {
        window.confirm = origConfirm;
        window.alert = origAlert;
      }
      status.innerHTML =
        `<div style="color:#22c55e;font-weight:bold;font-size:14px">Done</div>` +
        `<div style="margin-top:4px">${imported} imported · ${replaced} replaced · ${failed} failed</div>`;
    } catch (e) {
      console.error('[bulk-import]', e);
      status.innerHTML = `<span style="color:#f87171">Error: ${e.message}</span>`;
    }
  }

  new MutationObserver(ensureBulkButton).observe(document.body, { childList: true, subtree: true });
  ensureBulkButton();
})();
