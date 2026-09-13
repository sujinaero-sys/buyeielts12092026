# BUYE IELTS Phase 2I

- 40-question original Listening bank with browser speech simulation.
- 40-question Academic Reading bank based on 3 original passages.
- Varied Reading question types.
- Official-format section timing targets: Listening ~30 minutes; Reading 60 minutes.
- Question navigator, flags and local auto-save.
- Objective score and practice-band estimate.
- Latest result report.
- No IELTS Liz archive is bundled and no source-site wording is intentionally reproduced.

Listening speech is a functional prototype using the browser's speech synthesis; it is not official IELTS audio. Add BUYE-owned recorded audio later for a more authentic experience.

## Phase 2I account/backend integration
- `assets/buye-logo.png` — supplied BUYE logo.
- Dark/light mode with browser persistence.
- Login/register UI with email OTP.
- Lead/enquiry form.
- `js/api.js` — Google Apps Script API bridge.
- `apps-script/code.gs` — Google Sheets backend using the supplied Sheet ID.
- `apps-script/README.md` — deployment steps.

After deploying Apps Script, paste the `/exec` URL into `js/api.js`:
`const API_URL = "YOUR_EXEC_URL";`
