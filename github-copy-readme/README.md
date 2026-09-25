# GitHub Copy README.md

Copies the README.md of the repository you're currently viewing to the clipboard.

## Usage

Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> anywhere on a GitHub repo page.

The first run prompts for a GitHub personal access token (any scope with repo
read access). The token is stored via `GM_setValue`.

## Notes

- The repo is parsed from the URL at keypress time, so it follows GitHub's
  SPA navigation without a reload.
- Works on `github.com/<owner>/<repo>` pages only.

## Install

Open `user.js` and install via your userscript manager (Tampermonkey,
Violentmonkey, Greasemonkey).
