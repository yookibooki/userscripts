// ==UserScript==
// @name         Google Third-party Apps & Services Bulk Delete
// @namespace    https://github.com/yookibooki/userscripts
// @version      0.0.5
// @description  Bulk deletes connected apps and services from Google Account Connections / Linked Apps.
// @match        https://myaccount.google.com/connections*
// @match        https://myaccount.google.com/linkedapps*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const KEY = "__gconn_bulk_delete__";
  const LISTS = ["/connections", "/linkedapps"];
  const OVERVIEW_RE = /^\/(?:connections|linkedapps)\/overview\/[^/]+/;
  const TIMEOUT = 8000,
    RETURN_DELAY = 1500,
    SCROLL_PAUSE = 400,
    NAV_COOLDOWN = 1500;
  const q = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => [...r.querySelectorAll(s)];
  const now = () => Date.now(),
    sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) =>
    String(s || "")
      .replace(/\s+/g, " ")
      .trim();
  const curPath = () => location.pathname.replace(/\/+$/, "");
  const isList = () => LISTS.includes(curPath());
  const isOverview = () => OVERVIEW_RE.test(location.pathname);
  const getListPath = (s) => (s && s.origin && LISTS.includes(s.origin) ? s.origin : LISTS[0]);
  const load = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch {
      sessionStorage.removeItem(KEY);
      return null;
    }
  };
  const save = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
  const clear = () => sessionStorage.removeItem(KEY);

  let busy = false,
    ui,
    observer,
    pending = 0;

  const getState = () =>
    load() || {
      running: false,
      phase: "idle",
      queue: [],
      index: 0,
      deleted: 0,
      skipped: 0,
      name: "",
      stepAt: 0,
      returnAt: 0,
      origin: LISTS[0],
      lastNav: 0,
    };

  function schedule(ms = 200) {
    clearTimeout(pending);
    pending = setTimeout(tick, ms);
  }

  function make(tag, text) {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    return n;
  }

  function panel(msg) {
    if (!ui && (isList() || isOverview() || getState().running || msg)) {
      const box = make("div");
      Object.assign(box.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: "999999",
        width: "280px",
        background: "#111",
        color: "#fff",
        font: "13px system-ui",
        padding: "12px",
        borderRadius: "10px",
        boxShadow: "0 8px 30px rgba(0,0,0,.35)",
      });
      const title = make("div", "Google Connections Bulk Delete");
      title.style.fontWeight = "700";
      title.style.marginBottom = "8px";
      const status = make("div");
      status.style.whiteSpace = "pre-wrap";
      status.style.marginBottom = "10px";
      const row = make("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      const start = make("button", "Start");
      const stop = make("button", "Stop");
      [start, stop].forEach((b) => {
        b.style.flex = "1";
        b.style.padding = "6px 8px";
        b.style.cursor = "pointer";
      });
      start.onclick = startRun;
      stop.onclick = stopRun;
      row.append(start, stop);
      box.append(title, status, row);
      document.body.append(box);
      ui = { box, status, start };
    }
    if (!ui) return;
    const s = getState();
    ui.box.style.display =
      s.running || isList() || isOverview() || msg ? "block" : "none";
    ui.start.disabled = s.running;
    ui.start.textContent = s.running ? "Running" : "Start";
    ui.status.textContent =
      msg ??
      (!s.running
        ? "Idle"
        : `Progress: ${s.deleted}/${s.queue.length}${s.skipped ? `, skipped ${s.skipped}` : ""}\n${s.phase}${s.name ? `\n${s.name}` : ""}`);
  }

  async function collect() {
    const seen = new Map();
    let same = 0,
      last = 0;
    for (let i = 0; i < 60 && same < 4; i++) {
      for (const a of qa('a[href*="/overview/"]')) {
        const raw = a.getAttribute("href") || a.href;
        if (!raw) continue;
        let abs;
        try {
          abs = new URL(raw, location.href).href;
        } catch {
          continue;
        }
        const p = new URL(abs).pathname;
        if (!OVERVIEW_RE.test(p)) continue;
        if (!seen.has(abs)) seen.set(abs, { href: abs, name: norm(a.textContent) });
      }
      same = seen.size === last ? same + 1 : 0;
      last = seen.size;
      window.scrollTo(
        0,
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        ),
      );
      await sleep(SCROLL_PAUSE);
    }
    window.scrollTo(0, 0);
    return [...seen.values()];
  }

  function canNav(s) {
    return !s.lastNav || now() - s.lastNav >= NAV_COOLDOWN;
  }

  function go(url, s) {
    if (!canNav(s)) return false;
    if (url === location.href) return false;
    s.lastNav = now();
    save(s);
    location.replace(url);
    return true;
  }

  function done(s, ok) {
    ok ? s.deleted++ : s.skipped++;
    s.index++;
    s.phase = "returning";
    s.stepAt = now();
    s.returnAt = now() + RETURN_DELAY;
    save(s);
    go(getListPath(s), s);
    if (!canNav(getState())) schedule(NAV_COOLDOWN + 100);
  }

  async function startRun() {
    if (!isList()) return panel("Open /connections or /linkedapps first.");
    const origin = curPath();
    const s = {
      running: true,
      phase: "collecting",
      queue: [],
      index: 0,
      deleted: 0,
      skipped: 0,
      name: "",
      stepAt: now(),
      returnAt: 0,
      origin,
      lastNav: 0,
    };
    save(s);
    panel("Collecting apps...");
    s.queue = await collect();
    const cur = getState();
    if (!cur.running || cur.phase !== "collecting") return;
    if (!s.queue.length) return (clear(), panel("No apps found."));
    s.phase = "opening";
    s.lastNav = 0;
    save(s);
    schedule(200);
  }

  function stopRun() {
    clearTimeout(pending);
    clear();
    panel("Stopped.");
  }

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const s = getState();
      panel();
      if (!s.running) return;
      if (s.phase === "collecting") {
        clear();
        panel("Idle");
        return;
      }

      if (isList()) {
        if (s.index >= s.queue.length) return (clear(), panel("Done."));
        if (s.phase === "returning" && now() < s.returnAt) {
          schedule(s.returnAt - now() + 50);
          return;
        }
        if (!canNav(s)) {
          schedule(NAV_COOLDOWN - (now() - s.lastNav) + 50);
          return;
        }
        const item = s.queue[s.index];
        if (!item) return (clear(), panel("Done."));
        s.name = item.name || "";
        s.phase = "opening";
        s.stepAt = now();
        save(s);
        go(item.href, s);
        return;
      }

      if (!isOverview()) return;

      if (s.phase === "returning") {
        if (now() >= s.returnAt) {
          if (canNav(s)) go(getListPath(s), s);
          else schedule(NAV_COOLDOWN - (now() - s.lastNav) + 50);
        } else {
          schedule(s.returnAt - now() + 50);
        }
        return;
      }

      const dialog = q('[role="dialog"][aria-modal="true"]');
      const confirm =
        dialog &&
        q(
          'button[data-mdc-dialog-action="ok"], button[jsname="j6LnYe"]',
          dialog,
        );
      if (confirm) {
        if (!canNav(s)) {
          schedule(NAV_COOLDOWN - (now() - s.lastNav) + 50);
          return;
        }
        confirm.click();
        done(s, true);
        return;
      }

      const del = qa('[role="button"][data-name][data-key]').find((x) =>
        /Delete all/i.test(x.textContent || ""),
      );
      if (del && s.phase !== "deleting") {
        del.click();
        s.phase = "deleting";
        s.stepAt = now();
        save(s);
        return;
      }

      const elapsed = now() - s.stepAt;
      if (elapsed >= TIMEOUT) {
        if (canNav(s)) done(s, false);
        else schedule(NAV_COOLDOWN - (now() - s.lastNav) + 50);
      } else {
        schedule(TIMEOUT - elapsed + 100);
      }
    } catch (e) {
      console.error("[Google Connections Bulk Delete]", e);
      panel(`Error: ${e.message}`);
    } finally {
      busy = false;
    }
  }

  function ensureObserver() {
    if (observer) return;
    observer = new MutationObserver((muts) => {
      const s = getState();
      if (!s.running) return;
      if (!isOverview()) return;
      let relevant = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof Element)) continue;
          if (
            n.matches?.('[role="dialog"][aria-modal="true"], [role="button"][data-name][data-key], button[data-mdc-dialog-action="ok"]') ||
            n.querySelector?.('[role="dialog"][aria-modal="true"], [role="button"][data-name][data-key]')
          ) {
            relevant = true;
            break;
          }
        }
        if (relevant) break;
      }
      if (relevant) schedule(200);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  const emit = () => window.dispatchEvent(new Event("locationchange"));
  const push = history.pushState,
    replace = history.replaceState;
  history.pushState = function (...a) {
    const r = push.apply(this, a);
    emit();
    return r;
  };
  history.replaceState = function (...a) {
    const r = replace.apply(this, a);
    emit();
    return r;
  };
  window.addEventListener("popstate", () => schedule(300));
  window.addEventListener("pageshow", () => schedule(400));
  window.addEventListener("locationchange", () => schedule(200));
  window.addEventListener("load", () => schedule(400));

  function init() {
    ensureObserver();
    panel();
    if (getState().running) schedule(500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
