# Grocery Hub

Personal grocery list + to-do tracker. Single HTML file, no build step, no
dependencies. Data lives in a Google Sheet via an Apps Script web app.

## Repo layout

```
index.html    ← the whole site. This filename matters for GitHub Pages.
.nojekyll     ← tells Pages to serve files as-is
Code.gs       ← the Apps Script backend (not served; paste into Apps Script)
SETUP.md      ← full setup + troubleshooting
```

## Publishing to GitHub Pages

1. Push `index.html` and `.nojekyll` to the **root** of the branch you publish
   from (`main` is fine).
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - Save
3. Wait a minute, then open `https://<username>.github.io/<repo>/`

Because the file is named `index.html` and sits at the root, that bare URL
serves it — no `/grocery-hub.html` on the end.

If you'd rather keep the repo root tidy, put `index.html` and `.nojekyll` in a
`docs/` folder and pick **/docs** as the folder in step 2 instead.

## Config

Both live near the top of the `<script>` block in `index.html`:

```js
const AUTH_USER = "ramanuja";
const AUTH_PASS = "Pass@123";
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
```

`AUTH_USER` / `AUTH_PASS` must match the same two lines in `Code.gs`.

Anyone can view the list. Only a signed-in session can add, edit or delete.

## Note on a public repo

The password and the script URL are both visible in the page source, so anyone
who finds a public repo could edit the list. See the last section of `SETUP.md`
for how to avoid that if it matters to you.
