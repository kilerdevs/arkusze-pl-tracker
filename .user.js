// ==UserScript==
// @name         Arkusze.pl – Tracker ukończonych arkuszy (wszystkie przedmioty)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Zaznaczaj ukończone arkusze na arkusze.pl – działa dla wszystkich przedmiotów. Dane zapisywane w localStorage.
// @author       https://github.com/kilerdevs
// @match        https://arkusze.pl/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'arkusze_done_v2';
    const TOTALS_KEY  = 'arkusze_totals_v2';

    /* ─── Helpers ─── */
    function loadDone() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch { return {}; }
    }
    function saveDone(obj) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }
    function loadTotals() {
        try { return JSON.parse(localStorage.getItem(TOTALS_KEY) || '{}'); }
        catch { return {}; }
    }
    function saveTotals(obj) {
        localStorage.setItem(TOTALS_KEY, JSON.stringify(obj));
    }
    function toKey(href) {
        try {
            const u = new URL(href, location.origin);
            return u.pathname.replace(/\/?$/, '/');
        } catch { return href; }
    }
    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const day   = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year  = d.getFullYear();
        return `${day}.${month}.${year}`;
    }
    function nowISO() {
        return new Date().toISOString();
    }

    /* ─── Styles ─── */
    const style = document.createElement('style');
    style.textContent = `
        /* ── subject-list / homepage: done count badge on thumbnail ── */
        .item-post { position: relative; }
        .arkusze-count-badge {
            position: absolute;
            bottom: 5px; right: 5px;
            background: #20a870;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            padding: 3px 9px;
            border-radius: 20px;
            pointer-events: none;
            z-index: 10;
            letter-spacing: 0.02em;
        }

        /* ── table rows ── */
        tr.matura-done {
            background: #e6f9f0 !important;
        }
        tr.matura-done td { opacity: 0.7; }
        tr.matura-done .wt-btn {
            opacity: 0.55;
            text-decoration: line-through !important;
        }

        .matura-check-cell {
            width: 56px;
            text-align: center;
            vertical-align: middle;
            padding: 6px 4px !important;
        }
        .matura-check-header {
            width: 56px;
            text-align: center;
            font-size: 13px;
            color: #888;
            font-weight: 600;
            padding: 6px 4px !important;
        }
        .matura-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 20px; height: 20px;
            border: 2px solid #aac8b8;
            border-radius: 5px;
            cursor: pointer;
            background: #fff;
            position: relative;
            transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
            vertical-align: middle;
        }
        .matura-checkbox:hover {
            border-color: #20a870;
            box-shadow: 0 0 0 3px rgba(32,168,112,0.15);
        }
        .matura-checkbox:checked {
            background: #20a870;
            border-color: #20a870;
        }
        .matura-checkbox:checked::after {
            content: '';
            position: absolute;
            left: 4px; top: 1px;
            width: 7px; height: 12px;
            border: 2.5px solid #fff;
            border-top: none; border-left: none;
            transform: rotate(45deg);
        }

        /* ── date label under checkbox ── */
        .matura-date-label {
            display: block;
            font-size: 10px;
            color: #777;
            margin-top: 4px;
            white-space: nowrap;
            line-height: 1.2;
        }

        /* ── stats bar (top) ── */
        #arkusze-stats-bar {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a6e4a 0%, #20a870 100%);
            color: #fff;
            border-radius: 10px;
            padding: 14px 22px;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: 0 3px 14px rgba(32,168,112,0.28);
            flex-wrap: wrap;
        }
        #arkusze-stats-bar .sb-left {
            display: flex; align-items: center; gap: 12px;
        }
        #arkusze-stats-bar .sb-text { font-size: 17px; font-weight: 600; }
        #arkusze-stats-bar .sb-sub  { font-size: 13px; opacity: 0.82; margin-top: 2px; }
        #arkusze-stats-bar .sb-prog-wrap { flex: 1; min-width: 120px; max-width: 260px; }
        .sb-prog-bg   { height: 8px; background: rgba(255,255,255,0.28); border-radius: 99px; overflow: hidden; margin-top: 6px; }
        .sb-prog-fill { height: 100%; background: #fff; border-radius: 99px; transition: width 0.4s; }

        /* ── reset wrap (bottom) ── */
        #arkusze-reset-wrap {
            font-family: 'Segoe UI', system-ui, sans-serif;
            margin-top: 20px;
            padding-top: 14px;
            border-top: 1px solid #ddd;
            text-align: right;
        }
        #arkusze-reset-btn {
            background: #f5f5f5;
            color: #555;
            border: 1.5px solid #ccc;
            border-radius: 7px;
            padding: 7px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.18s, border-color 0.18s, color 0.18s;
        }
        #arkusze-reset-btn:hover {
            background: #ffe0e0;
            border-color: #e88;
            color: #c00;
        }

        /* ── individual exam page ── */
        #arkusze-done-badge {
            display: inline-flex; align-items: center;
            background: #20a870; color: #fff;
            font-size: 15px; font-weight: 700;
            padding: 4px 14px; border-radius: 20px;
            margin-left: 12px; vertical-align: middle;
        }
        #arkusze-done-date {
            display: block;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        #arkusze-mark-btn {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #20a870; color: #fff;
            border: none; border-radius: 8px;
            padding: 9px 20px; font-size: 15px; font-weight: 600;
            cursor: pointer; margin-top: 10px;
            transition: background 0.18s;
            display: block;
        }
        #arkusze-mark-btn:hover { background: #178a5a; }
        #arkusze-mark-btn.undone { background: #888; }
        #arkusze-mark-btn.undone:hover { background: #555; }
    `;
    document.head.appendChild(style);

    const path = location.pathname.replace(/\/?$/, '/');

    /* ═══════════════════════════════════════════════════
       PAGE TYPE DETECTION
       ═══════════════════════════════════════════════════ */
    const isHomepage   = path === '/';
    const hasTable     = !!document.querySelector('table.tablepress');
    const hasItemPosts = !hasTable && !!document.querySelector('.item-post');
    const isExamPage   = !hasTable && !hasItemPosts && !isHomepage;

    /* ═══════════════════════════════════════════════════
       HOMEPAGE & SUBJECT-CATEGORY PAGES
       Show % done badge on each subject thumbnail
       ═══════════════════════════════════════════════════ */
    if (isHomepage || hasItemPosts) {
        const done   = loadDone();
        const totals = loadTotals();

        // Strip only truly generic words that don't distinguish subjects.
        // Keep poziom/podstawowy/rozszerzony/osmoklasisty etc. — they ARE the distinguishers.
        const STOPWORDS = new Set(['matura','egzamin','poziom','i','oraz']);
        function slugWords(p) {
            return p.replace(/\//g, '').split('-').filter(w => w && !STOPWORDS.has(w));
        }
        const doneKeys = Object.keys(done);

        document.querySelectorAll('.item-post').forEach(post => {
            const link = post.querySelector('a[href]');
            if (!link) return;
            const subjectPath = toKey(link.href);
            const total = totals[subjectPath] || 0;

            // A done exam key belongs to this subject if all meaningful words
            // from the subject index path appear in the exam key.
            const words = slugWords(subjectPath);
            if (words.length === 0) return;

            const examKeys = doneKeys.filter(k =>
                k !== subjectPath && words.every(w => k.includes(w))
            );

            const doneCount = examKeys.length;
            if (doneCount === 0) return;

            const pct      = total > 0 ? Math.round(doneCount / total * 100) : null;
            const label    = pct !== null ? `${pct}%` : `${doneCount}`;
            const titleTxt = pct !== null
                ? `${doneCount} z ${total} arkuszy zrobionych (${pct}%)`
                : `${doneCount} arkuszy zaznaczonych jako zrobione`;

            const badge = document.createElement('span');
            badge.className = 'arkusze-count-badge';
            badge.textContent = label;
            badge.title = titleTxt;

            const thumb = post.querySelector('.thumbnail');
            if (thumb) {
                thumb.style.position = 'relative';
                thumb.appendChild(badge);
            }
        });
    }

    /* ═══════════════════════════════════════════════════
       SUBJECT INDEX PAGES (tablepress)
       ═══════════════════════════════════════════════════ */
    if (hasTable) {
        const table = document.querySelector('table.tablepress');
        const done  = loadDone();

        // Header cell
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const th = document.createElement('th');
            th.className = 'matura-check-header';
            th.textContent = 'Zrobione';
            headerRow.prepend(th);
        }

        const allRows = table.querySelectorAll('tbody tr');
        allRows.forEach(row => {
            const link  = row.querySelector('a[href]');
            const key   = link ? toKey(link.href) : row.textContent.trim().slice(0, 80);
            const entry = done[key]; // { date: ISO } or legacy true

            const td = document.createElement('td');
            td.className = 'matura-check-cell';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'matura-checkbox';
            cb.title = 'Zaznacz jako zrobione';
            cb.checked = !!entry;

            const dateLabel = document.createElement('span');
            dateLabel.className = 'matura-date-label';
            const existingDate = entry && entry.date ? entry.date : null;
            dateLabel.textContent = existingDate ? formatDate(existingDate) : '';

            if (cb.checked) row.classList.add('matura-done');

            cb.addEventListener('change', () => {
                const fresh = loadDone();
                if (cb.checked) {
                    const iso = nowISO();
                    fresh[key] = { date: iso };
                    row.classList.add('matura-done');
                    dateLabel.textContent = formatDate(iso);
                } else {
                    delete fresh[key];
                    row.classList.remove('matura-done');
                    dateLabel.textContent = '';
                }
                saveDone(fresh);
                updateStats();
            });

            td.appendChild(cb);
            td.appendChild(dateLabel);
            row.prepend(td);
        });

        // Save totals for homepage % display
        const totals = loadTotals();
        totals[path] = allRows.length;
        saveTotals(totals);
        const total = allRows.length;

        function countDone() {
            return table.querySelectorAll('.matura-checkbox:checked').length;
        }

        // Stats bar at top
        const statsBar = document.createElement('div');
        statsBar.id = 'arkusze-stats-bar';

        function renderStats() {
            const cnt = countDone();
            const pct = total ? Math.round(cnt / total * 100) : 0;
            statsBar.innerHTML = `
                <div class="sb-left">
                    <div>
                        <div class="sb-text">Ukonczone: ${cnt} / ${total}</div>
                        <div class="sb-sub">${pct}% arkuszy zaliczonych</div>
                    </div>
                </div>
                <div class="sb-prog-wrap">
                    <div class="sb-prog-bg">
                        <div class="sb-prog-fill" style="width:${pct}%"></div>
                    </div>
                </div>
            `;
        }

        function updateStats() { renderStats(); }

        const tableWrap = table.closest('.tablepress-scroll-wrapper') || table;
        tableWrap.parentNode.insertBefore(statsBar, tableWrap);
        renderStats();

        // Reset button at bottom
        const resetWrap = document.createElement('div');
        resetWrap.id = 'arkusze-reset-wrap';
        const resetBtn = document.createElement('button');
        resetBtn.id = 'arkusze-reset-btn';
        resetBtn.textContent = 'Resetuj wszystkie zaznaczenia';
        resetBtn.addEventListener('click', () => {
            if (!confirm('Na pewno chcesz zresetowac wszystkie zaznaczenia na tej stronie?')) return;
            const fresh = loadDone();
            table.querySelectorAll('.matura-checkbox').forEach(cb => {
                const row = cb.closest('tr');
                const lnk = row && row.querySelector('a[href]');
                const k   = lnk ? toKey(lnk.href) : null;
                if (k) delete fresh[k];
                cb.checked = false;
                if (row) row.classList.remove('matura-done');
                const dl = row && row.querySelector('.matura-date-label');
                if (dl) dl.textContent = '';
            });
            saveDone(fresh);
            renderStats();
        });
        resetWrap.appendChild(resetBtn);
        tableWrap.parentNode.insertBefore(resetWrap, tableWrap.nextSibling);
    }

    /* ═══════════════════════════════════════════════════
       INDIVIDUAL EXAM PAGES
       ═══════════════════════════════════════════════════ */
    if (isExamPage) {
        const key   = toKey(location.href);
        const done  = loadDone();
        const entry = done[key];

        const h1 = document.querySelector('h1.entry-title');
        if (!h1) return;

        // Badge if already done
        if (entry) {
            const badge = document.createElement('span');
            badge.id = 'arkusze-done-badge';
            badge.textContent = 'Zrobione';
            h1.appendChild(badge);
        }

        // Date line below h1
        const dateLine = document.createElement('span');
        dateLine.id = 'arkusze-done-date';
        const existingDate = entry && entry.date ? entry.date : null;
        dateLine.textContent = existingDate ? `Zaliczone: ${formatDate(existingDate)}` : '';
        h1.insertAdjacentElement('afterend', dateLine);

        // Toggle button below date
        const btn = document.createElement('button');
        btn.id = 'arkusze-mark-btn';
        btn.textContent = entry ? 'Oznacz jako niezrobione' : 'Oznacz jako zrobione';
        if (entry) btn.classList.add('undone');
        dateLine.insertAdjacentElement('afterend', btn);

        btn.addEventListener('click', () => {
            const fresh = loadDone();
            if (fresh[key]) {
                delete fresh[key];
                btn.textContent = 'Oznacz jako zrobione';
                btn.classList.remove('undone');
                const badge = document.getElementById('arkusze-done-badge');
                if (badge) badge.remove();
                dateLine.textContent = '';
            } else {
                const iso = nowISO();
                fresh[key] = { date: iso };
                btn.textContent = 'Oznacz jako niezrobione';
                btn.classList.add('undone');
                if (!document.getElementById('arkusze-done-badge')) {
                    const badge = document.createElement('span');
                    badge.id = 'arkusze-done-badge';
                    badge.textContent = 'Zrobione';
                    h1.appendChild(badge);
                }
                dateLine.textContent = `Zaliczone: ${formatDate(iso)}`;
            }
            saveDone(fresh);
        });
    }

})();
