// ==UserScript==
// @name         GitHub Copy README.md
// @namespace    https://github.com/yookibooki
// @version      1.0
// @description  Copies README.md from a GitHub repository with Ctrl+Shift+X.
// @match        https://github.com/*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api.github.com
// ==/UserScript==

(() => {
  "use strict";

  const API = "https://api.github.com";
  const TOKEN_KEY = "gh_pat";

  const REPO = (() => {
    const p = location.pathname.split("/").filter(Boolean);
    if (p.length < 2) return null;
    const skip = ["settings", "organizations", "orgs", "users", "sponsors", "notifications", "explore", "topics", "trending", "collections", "events", "features", "security", "pulls", "issues", "marketplace", "apps", "codespaces", "discussions"];
    if (skip.includes(p[0])) return null;
    return { owner: p[0], repo: p[1] };
  })();

  let inFlight = false;

  const req = (url, token) =>
    new Promise((resolve, reject) =>
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "json",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
        },
        onload: resolve,
        onerror: reject,
      })
    );

  const decode = (b64) =>
    new TextDecoder().decode(
      Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0))
    );

  async function copyReadme() {
    if (!REPO || inFlight) return;

    let token = GM_getValue(TOKEN_KEY, "");
    if (!token) {
      token = prompt("GitHub personal access token (needs repo read scope):");
      if (!token) return;
      GM_setValue(TOKEN_KEY, token.trim());
    }

    inFlight = true;
    try {
      const res = await req(`${API}/repos/${REPO.owner}/${REPO.repo}/readme`, token);
      if (res.status !== 200 || !res.response?.content) {
        alert("README not found");
        return;
      }
      GM_setClipboard(decode(res.response.content), "text");
      alert("README copied!");
    } finally {
      inFlight = false;
    }
  }

  addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "x" || e.key === "X")) {
        const t = e.target;
        if (t?.isContentEditable || t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
        e.preventDefault();
        copyReadme().catch(() => {});
      }
    },
    true
  );
})();
