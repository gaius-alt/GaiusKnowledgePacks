// ==UserScript==
// @name         SkyrimNet Bulk Pack Importer
// @namespace    https://goncalo22.github.io/SkyrimNet-GamePlugin/
// @version      1.1
// @description  Adds a "Bulk Import" button — picks a folder, imports every .sknpack, optionally replaces existing packs with the same name first.
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        http://host.docker.internal:8080/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

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

  // Find the Delete button for a pack card whose visible name matches packName.
  function findDeleteBtnByName(packName) {
    const want = packName.trim();
    // Candidates: text-nodes that EXACTLY match the pack name
    const all = document.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span,a,p');
    for (const el of all) {
      if (el.children.length === 0 && el.textContent.trim() === want) {
        // Walk up looking for a Delete button under the same card
        let cur = el;
        for (let i = 0; i < 10 && cur; i++) {
          cur = cur.parentElement;
          if (!cur) break;
          const btn = [...cur.querySelectorAll('button')].find(b => /^\s*delete\s*$/i.test(b.textContent));
          if (btn) return btn;
        }
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

      // Read every .sknpack and pre-parse the pack name from the JSON body.
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

      const overwrite = confirm(
        `Found ${files.length} .sknpack files.\n\n` +
        `OK   = Replace any existing pack with the same name (delete old, import new)\n` +
        `Cancel = Add as new packs (duplicates get a "(1)" suffix)`
      );

      const input = await captureFileInput();
      if (!input) { status.innerHTML = '<span style="color:#f87171">Could not capture file input.</span>'; return; }

      let imported = 0, replaced = 0, failed = 0;
      for (let i = 0; i < files.length; i++) {
        const { file, packName } = files[i];
        status.innerHTML =
          `<div>[${i + 1}/${files.length}] <span style="color:#67e8f9">${packName}</span></div>` +
          `<div style="margin-top:6px">` +
          `<span style="color:#22c55e">✓ ${imported}</span> · ` +
          `<span style="color:#fbbf24">↻ ${replaced}</span> · ` +
          `<span style="color:#f87171">✗ ${failed}</span></div>`;
        try {
          if (overwrite) {
            const delBtn = findDeleteBtnByName(packName);
            if (delBtn) {
              const origConfirm = window.confirm;
              window.confirm = () => true;
              try { delBtn.click(); }
              finally { window.confirm = origConfirm; }
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
