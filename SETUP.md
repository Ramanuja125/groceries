# Ram's Grocery Hub — setup

Three files:

| File | What it is |
|---|---|
| `grocery-hub.html` | The website. Double-click it, or host it anywhere. |
| `Code.gs` | The Google Sheets backend. Goes into Apps Script. |
| `SETUP.md` | This page. |

The site works **immediately** without the sheet — it just keeps data in your
browser. Connect the sheet when you want it saved properly and synced across
your phone and laptop.

---

## Login

| | |
|---|---|
| Username | `ram` |
| Password | `ram123` |

Anyone who opens the page can **view** everything. Only a signed-in session can
add, edit, check off or delete.

**To change the password**, edit the same two lines in *both* files:

- `grocery-hub.html` → near the top of the `<script>`, under `1. CONFIG`
- `Code.gs` → lines 2–3

```js
const AUTH_USER = "ram";
const AUTH_PASS = "ram123";
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

## Putting it on the web

Nothing here needs a server. Drop `grocery-hub.html` into any static host —
GitHub Pages, Netlify drop, Cloudflare Pages — and it works the same, with the
bonus that your phone can open it by URL. Remember the login is only a soft
gate, so anyone with the link can view (and, if they read the source, edit).
