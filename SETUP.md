# Ram's Grocery Hub — setup

| File | What it is |
|---|---|
| `index.html` | The whole website. Double-click it, or push it to GitHub Pages. |
| `.nojekyll` | Empty file. Tells GitHub Pages to serve files untouched. |
| `Code.gs` | The Google Sheets backend. Goes into Apps Script. |
| `README.md` | Short repo readme, for GitHub. |
| `SETUP.md` | This page. |

The Apps Script URL is already baked into `index.html`, so it connects on its
own — nothing to paste.

---

## Login

| | |
|---|---|
| Username | `ramanuja` |
| Password | `Pass@123` |

Anyone who opens the page can **view** everything. Only a signed-in session can
add, edit, check off or delete.

**To change the password**, edit the same two lines in *both* files:

- `index.html` → near the top of the `<script>`, under `1. CONFIG`
- `Code.gs` → lines 2–3

```js
const AUTH_USER = "ramanuja";
const AUTH_PASS = "Pass@123";
```

They must match, or writes will be rejected by the sheet.

> This is a convenience lock, not real security — the password sits in the page
> source. Fine for a personal list; don't put anything sensitive in it.

---

## Connecting Google Sheets (about 5 minutes)

### 1. Make the spreadsheet

Go to [sheets.new](https://sheets.new) and name it something like
**Grocery Hub Data**. Leave it empty — the script builds the tabs.

### 2. Add the script

In that spreadsheet: **Extensions → Apps Script**.

Delete whatever is in `Code.gs`, paste in the contents of the `Code.gs` file
from this folder, and press **Save** (💾).

### 3. Build the tabs

In the Apps Script toolbar, pick the function **`setup`** from the dropdown and
click **Run**.

The first run asks for permission: *Review permissions → pick your Google
account → Advanced → Go to (project name) → Allow*. Google shows an
"unverified app" warning because it's your own script — that's expected.

Flip back to the spreadsheet and you should now see two tabs: **Groceries** and
**Todos**, with green header rows.

### 4. Deploy it as a web app

In Apps Script: **Deploy → New deployment**.

- Click the gear next to *Select type* → **Web app**
- Description: `Grocery Hub`
- **Execute as:** `Me`
- **Who has access:** `Anyone` ← this one matters, the site can't reach it otherwise
- **Deploy**, then **Copy** the Web app URL

It looks like:

```
https://script.google.com/macros/s/AKfycb.....................…/exec
```

### 5. Point the site at it

Open `grocery-hub.html`, click the **⚙** button top-right, paste the URL,
hit **Test** (it should say how many rows it found), then **Save & sync**.

Done. The URL is remembered in that browser, so you only do this once per
device. You can also skip the dialog by opening the page with the URL attached:

```
grocery-hub.html?url=https://script.google.com/macros/s/AKfycb.../exec
```

---

## Using it

**Shopping list** — the main view. Items are grouped by store, with urgent ones
pinned to the top of each group and marked with a red edge. Tick the checkbox
when you buy something; it moves to History stamped with today's date.

**To-do** — the same idea for non-grocery tasks. Overdue items show in red.

**History** — everything you've bought, grouped by month. The ↺ button on a row
puts it straight back on the shopping list, which is the fast way to rebuild a
regular order.

**Stores** — Costco, Walmart, Indian Store, Patel Brothers, Safeway, Daiso,
H Mart, and *Other*. Picking **Other** reveals a text box; whatever you type
becomes its own group with its own colour, and it appears in the store filter
from then on.

**Fields per item** — name, store, quantity + unit, category, priority
(Urgent / Normal / Whenever), notes, and purchase date.

**Quote panel** — a passage sits above the list and changes every time you open
the page. The ↻ button gives you another one instantly.

It draws from ~50 quotes built into the file, so it works offline and never
lags. If you paste the updated `Code.gs` into Apps Script and redeploy, ↻ will
*also* try to pull a fresh quote off the internet first — fetched server-side by
Apps Script, so no CORS trouble — and fall back to the built-in set the moment
anything is slow or unreachable. That redeploy is entirely optional; skip it and
the panel still works exactly as described.

Small things worth knowing:

- Press **Enter** in the item box to add and keep typing.
- The **◐** button cycles light → dark → follow-system.
- The sync pill top-right shows the last save; click it to force a refresh.
- The page re-reads the sheet every 90 seconds while it's open, so two devices
  stay roughly in step.
- Edits save instantly and optimistically. If a save fails you get a red toast
  and the change is rolled back — nothing silently disappears.

---

## Editing in the sheet directly

Safe to do. Type new rows, fix typos, sort, filter, pivot — the site picks it up
on the next refresh.

Two rules:

1. **Every row needs an `id`.** Any unique text works: `g_manual_001`. Rows with
   a blank id are ignored.
2. **`status` is the switch.** Groceries: `pending` or `bought`. Todos: `open`
   or `done`. Dates go in as `YYYY-MM-DD`.

Column order matters — don't rearrange or rename the header row.

---

## If something doesn't work

**"Couldn't reach it" on Test**
Almost always the deployment access setting. Redeploy with **Who has access:
Anyone**. Also check the URL ends in `/exec`, not `/dev`.

**Changes save but the sheet stays empty**
The tokens don't match. `AUTH_USER`/`AUTH_PASS` in `Code.gs` must equal the pair
in `grocery-hub.html`.

**You edited `Code.gs` and nothing changed**
Apps Script serves the last *deployed* version. After editing:
**Deploy → Manage deployments → ✏️ → Version: New version → Deploy.** The URL
stays the same.

**Opening the file from a USB stick / different folder**
The settings live in browser storage keyed to the file location, so moving the
file means re-pasting the URL once. Nothing is lost — the data is in the sheet.

---

## Putting it on GitHub Pages

Nothing here needs a server or a build step.

**What Pages requires:**

1. The file must be named **`index.html`** and sit at the **root** of the branch
   you publish from. It already is.
2. Include the empty **`.nojekyll`** file next to it. Without it Pages runs
   everything through Jekyll first, which is harmless here but can silently drop
   files whose names start with `_` if you add any later.
3. **Settings → Pages → Build and deployment** → Source: **Deploy from a
   branch** → Branch: **main**, folder: **/ (root)** → Save.

Give it a minute, then `https://<username>.github.io/<repo>/` serves the app.
Because it's `index.html` at the root, the bare URL works — no filename on the
end. (`Code.gs`, `README.md` and `SETUP.md` can sit in the repo too; Pages just
ignores them.)

Prefer a tidier root? Move `index.html` and `.nojekyll` into a `docs/` folder and
choose **/docs** as the folder in step 3.

### Does the same data show up locally and on Pages?

Yes — and this is the part worth being clear about, because it's easy to assume
otherwise. **Your items are not stored in the browser. They're rows in the Google
Sheet.** The local file and the Pages site are two windows onto the same sheet.
Add something from your laptop, refresh your phone, it's there.

Both can reach the sheet:

- **From Pages** — both ends are HTTPS and the web app answers with
  `Access-Control-Allow-Origin: *`, so any origin may call it. Writes go out as
  `text/plain`, which makes them "simple" requests and skips the CORS preflight
  that Apps Script can't answer.
- **From a local file** — opening `index.html` off your disk gives the page an
  origin of `null`, which `*` still allows. Chrome, Edge and Firefox are all fine
  with this.

The only per-origin thing is the ⚙ setting, and since the URL is now baked into
`DEFAULT_SCRIPT_URL` that no longer matters — every copy is pre-connected.

**To change the script URL later**, edit that one line in `index.html`:

```js
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
```

Or use ⚙ on a single device — that overrides the baked-in value for that browser
only, which is handy for testing a new deployment without touching the file.

### Before you make the repo public

Read this bit. A public repo means the page source is public, and the source now
contains both the password and the write endpoint. Anyone who found the repo
could sign in and edit your list.

For a personal grocery list that's usually a shrug. If you'd rather it weren't
the case:

- Set `DEFAULT_SCRIPT_URL` back to `""` and paste the URL through ⚙ on each of
  your own devices. The URL then lives only in your browsers, never in the repo,
  and a stranger loading the page sees an empty list wired to nothing. Costs you
  one paste per device.
- Change `AUTH_PASS` to something you don't use anywhere else. It's stored in
  plain text in the page — treat it as a doorstop, not a lock.
- If a URL ever leaks: **Deploy → Manage deployments → Archive** kills it.
  Deploy a new version, paste the new URL in, and the old one is dead.
