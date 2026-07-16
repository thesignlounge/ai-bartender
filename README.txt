THE SIGN AI MENU V8 — PHOTO READY

THE SIGN AI MENU V4

Pages
- index.html: AI menu
- hydration.html: Spritz / Hydration / Discounts
- party.html: Party / Highballs / Gin & Tonic / Shots
- admin.html: edit drinks, prices, visibility, page placement and discounts

How to use
1. Extract the ZIP.
2. Open admin.html to edit.
3. Click Save all.
4. Open the other pages in the same browser.

Important
This local version stores changes in the browser using localStorage.
The changes work immediately on the same computer and browser.
Use Export JSON for backup or transfer.
For multiple staff devices and live syncing, a cloud database is the next step.


V4.1 ADMIN SECURITY
- Customer pages no longer show an Admin link.
- admin.html now has a password gate.
- Initial password: T5uZB1hqRVxBZJ
- Access remains unlocked only for the current browser tab/session.
- Closing the browser tab logs the admin out.

IMPORTANT:
This password gate protects against casual access, but because this is a fully local/static website,
it is not equivalent to server-side security. For a public online launch, use server login and a cloud
database so the password and admin code are never exposed to visitors.


V4.2 CINEMATIC INTRO
- Full-screen black opening.
- Slowly flowing champagne-gold gradient.
- THE SIGN LOUNGE fades in first.
- AI BARTENDER and Find your perfect drink follow.
- Automatically enters the homepage after about 2 seconds.
- Click/tap anywhere, press Enter, Space or Escape to skip immediately.

RESTORE ORIGINAL
The untouched V4.1 files are stored in:
ORIGINAL_BACKUP_V4_1/


V5 LUXURY EDITION
- Built directly from the successful V4.2 version.
- Keeps the original V4.2 header and typography.
- Intro remains visible for 5 seconds, then slowly fades out.
- No permanent homepage logo image.
- Adds only a very subtle cocktail-glass watermark.
- Flower Bomb signature card is significantly shorter on mobile.
- Mobile spacing and controls are optimized so more content appears above the fold.
- Full V4.2 backup is included in ORIGINAL_BACKUP_V4_2.


V8 PHOTO SYSTEM
- Recommendation card includes a large 4:3 cocktail photo area.
- Every full-menu card includes a photo area.
- Missing photos automatically show a subtle The Sign logo placeholder.
- Add JPG files to images/cocktails/; no code changes are needed when filenames follow the automatic naming rule.
- See images/cocktails/README.txt for exact instructions.

V9 BUSINESS OVERVIEW UPDATE
- Google Sheets endpoint connected.
- Button changed to “🍸 Zur Übersicht hinzufügen”.
- Sends every cocktail name, quantity, unit price, subtotal, alcohol level, base spirit, taste, category and language.
- Duplicate protection for an unchanged selection in the same browser session.
- Use GOOGLE_APPS_SCRIPT_CODE.gs to update the Google Apps Script deployment.
