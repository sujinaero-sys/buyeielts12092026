# BUYE IELTS — Backend connection checklist

1. Open the supplied Google Sheet.
2. Extensions → Apps Script.
3. Paste `apps-script/code.gs`.
4. Run `setup()`.
5. Deploy as Web app, Execute as Me, Access Anyone.
6. Copy the `/exec` URL.
7. Open `js/api.js`.
8. Set `API_URL` to the `/exec` URL.
9. Run the website with `python -m http.server 8000`.
10. Test Register → OTP → Login.
11. Test the enquiry form and verify rows in Users / OTPs / Leads.

The website is usable without the backend for learning/practice; account and lead features remain offline until API_URL is connected.
