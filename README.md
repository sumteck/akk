# Mass Memorandum — Deployment Guide
================================================

## Files in this project
- **index.html**   — Public signature collection page
- **admin.html**   — Organizer's view & print page
- **code.gs**      — Google Apps Script (backend)
- **README.md**    — This file

---

## STEP 1 — Set up the Google Sheet

1. Go to https://sheets.google.com and create a **new spreadsheet**.
2. Name it (e.g. "Memorandum Signatures 2025").
3. Leave all cells empty — the script creates the header row automatically.
4. Note the spreadsheet URL (you'll need it open in Step 2).

---

## STEP 2 — Deploy the Google Apps Script

1. With the Google Sheet open, click **Extensions → Apps Script**.
2. Delete any placeholder code in the editor.
3. Paste the entire contents of **code.gs** into the editor.
4. Click **Save** (💾 icon or Ctrl+S). Name the project (e.g. "MemorandumBackend").
5. Click **Deploy → New deployment**.
6. Under "Select type", choose **Web app**.
7. Fill in the settings:
   - **Description**: Memorandum Backend v1
   - **Execute as**: Me (your Google account)
   - **Who has access**: **Anyone** ← CRITICAL for public form to work
8. Click **Deploy**.
9. If prompted, click **Authorize access** and approve the permissions
   (it needs access to your Spreadsheets).
10. **Copy the Web App URL** — it looks like:
    `https://script.google.com/macros/s/AKfycbXXXXXXX.../exec`

---

## STEP 3 — Connect the URL to your HTML files

Open both **index.html** and **admin.html** in a text editor.

Find this line near the top of the `<script>` section in each file:
```
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_DEPLOYMENT_URL_HERE';
```

Replace `YOUR_APPS_SCRIPT_DEPLOYMENT_URL_HERE` with the URL you copied in Step 2.

Example:
```
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbXXX.../exec';
```

Save both files.

---

## STEP 4 — Test the backend (optional but recommended)

1. In the Apps Script editor, select the function `testPost` from the dropdown.
2. Click **Run**. Check the Execution Log — it should say `{"status":"success",...}`.
3. Open your Google Sheet — you should see a new test row.
4. Select `testGet` and Run — the log should show the record you just added.

---

## STEP 5 — Host the frontend files

You have several options:

### Option A — GitHub Pages (free, recommended)
1. Create a GitHub repository.
2. Upload `index.html` and `admin.html`.
3. Go to **Settings → Pages → Deploy from branch → main / root**.
4. Your URLs will be:
   - Public:  `https://yourusername.github.io/repo-name/`
   - Admin:   `https://yourusername.github.io/repo-name/admin.html`

### Option B — Netlify Drop (easiest)
1. Go to https://app.netlify.com/drop
2. Drag and drop your project folder.
3. Netlify gives you a live URL instantly.

### Option C — Google Drive (no hosting needed)
1. Upload both HTML files to Google Drive.
2. Right-click → **Open with Google Docs** won't work for HTML.
   Instead, use Drive's "Publish to web" feature or share the file link and open with "Preview".
   *(Note: Google Drive no longer serves HTML files as web pages directly — use Options A or B.)*

### Option D — Local use
Simply open `index.html` and `admin.html` directly in a browser.
Works fine for local/intranet use without any hosting.

---

## STEP 6 — Share & Collect Signatures

- Share the **index.html** URL with signatories.
- Use **admin.html** privately for the organiser to view all signatures.
- To print the final memorandum with all signatures:
  Open `admin.html` → Click **Refresh** to load latest → Click **Print / Save PDF**.
  The `@media print` CSS ensures signatures are never split across pages.

---

## Updating the Memorandum Text

The memorandum body text appears in three places:
1. `index.html` — Inside `.memo-card` (what users read before signing)
2. `index.html` — Inside `#pdfPreview` (what goes into the user's personal PDF copy)
3. `admin.html` — Inside `.doc-header .doc-body` (what prints in the consolidated document)

Edit all three to keep them in sync.

---

## Important Notes on CORS

- The `doPost` call in `index.html` uses `mode: 'no-cors'` because Google Apps Script's
  redirect handling requires it. The submission still works; you just can't read
  the response body. Use the Sheet itself to verify entries.
- The `doGet` call in `admin.html` uses normal fetch (no `no-cors`) since GAS serves
  JSON directly without redirects when reading data.
- If you update your Apps Script code, you **must create a new deployment** 
  (or choose "Manage deployments → Edit → New version") for changes to take effect.
  The old URL will still work until you explicitly delete that deployment.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Form submits but nothing appears in Sheet | Check APPS_SCRIPT_URL is correct; check "Who has access" is set to "Anyone" |
| Admin page shows "Failed to load" | Re-deploy the script as a new version; ensure access is "Anyone" |
| Signatures look blank in admin | Make sure the Base64 data URLs are being stored correctly; check column D in the Sheet |
| PDF download is blank | html2pdf.js needs images to be CORS-accessible; the Base64 data URLs are self-contained so this should always work |
| "Authorization required" on GAS | Re-authorize by running any function manually in the GAS editor |
