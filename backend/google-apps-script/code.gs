/**
 * BUYE IELTS â€” Backend (Google Apps Script + Google Sheets)
 *
 * SETUP
 * 1. Create/open the Google Sheet with the ID below.
 * 2. Paste this file into Extensions > Apps Script.
 * 3. Run setup() once.
 * 4. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
 * 5. Copy the /exec URL into js/api.js as API_URL.
 */

const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const OTP_TTL_MINUTES = 10;
const FROM_NAME = 'BUYE IELTS';

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet_(ss, 'Users', ['Timestamp', 'Name', 'Email', 'Phone', 'Role']);
  ensureSheet_(ss, 'OTPs', ['Email', 'Code', 'ExpiresAt']);
  ensureSheet_(ss, 'Leads', ['Timestamp', 'Name', 'Phone', 'Email', 'Goal', 'Source']);
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'Bad request.' });
  }

  try {
    switch (body.action) {
      case 'register':
        return jsonOut_(handleRegister_(body));
      case 'requestOtp':
        return jsonOut_(handleRequestOtp_(body));
      case 'verifyOtp':
        return jsonOut_(handleVerifyOtp_(body));
      case 'login':
        return jsonOut_(handleRequestOtp_(body));
      case 'saveLead':
        return jsonOut_(handleSaveLead_(body));
      default:
        return jsonOut_({ ok: false, error: 'Unknown action.' });
    }
  } catch (err) {
    return jsonOut_({ ok: false, error: 'Server error: ' + err.message });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSS_() {
  return SpreadsheetApp.openById(SHEET_ID);
}

/* ---------------- Register ---------------- */

function handleRegister_(body) {
  const { name, email, phone, role } = body;
  if (!name || !email || !phone) {
    return { ok: false, error: 'Missing name, email or phone.' };
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const emailCol = 2;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase() === String(email).toLowerCase()) {
      return { ok: true, existing: true };
    }
  }

  sheet.appendRow([new Date(), name, email, phone, role || 'student']);
  return { ok: true };
}

/* ---------------- OTP ---------------- */

function handleRequestOtp_(body) {
  const { email } = body;
  if (!email) return { ok: false, error: 'Email is required.' };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const ss = getSS_();
  const sheet = ss.getSheetByName('OTPs');
  sheet.appendRow([email, code, expiresAt]);

  MailApp.sendEmail({
    to: email,
    subject: 'Your BUYE IELTS verification code',
    body:
      `Your BUYE IELTS one-time code is: ${code}\n\n` +
      `It expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
    name: FROM_NAME,
  });

  return { ok: true };
}

function handleVerifyOtp_(body) {
  const { email, code } = body;
  if (!email || !code) return { ok: false, error: 'Missing email or code.' };

  const ss = getSS_();
  const otpSheet = ss.getSheetByName('OTPs');
  const rows = otpSheet.getDataRange().getValues();

  let matchRow = -1;
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).toLowerCase() === String(email).toLowerCase()) {
      const [, storedCode, expiresAt] = rows[i];

      if (new Date() > new Date(expiresAt)) {
        return { ok: false, error: 'Code expired, request a new one.' };
      }

      if (String(storedCode) === String(code)) {
        matchRow = i;
        break;
      }

      return { ok: false, error: 'Incorrect code.' };
    }
  }

  if (matchRow === -1) {
    return { ok: false, error: 'No code found for that email. Request a new one.' };
  }

  const usersSheet = ss.getSheetByName('Users');
  const users = usersSheet.getDataRange().getValues();
  let name = '', role = 'student';

  for (let i = 1; i < users.length; i++) {
    if (String(users[i][2]).toLowerCase() === String(email).toLowerCase()) {
      name = users[i][1];
      role = users[i][4] || 'student';
      break;
    }
  }

  return { ok: true, name, role };
}

/* ---------------- Leads ---------------- */

function handleSaveLead_(body) {
  const { name, phone, email, goal, source, plan } = body;

  if (!name || !phone) {
    return { ok: false, error: 'Name and phone are required.' };
  }

  const PLAN_DATA = {
    '7-Day Trial Pass': {
      price: '₹99',
      paymentUrl: 'https://www.buye.online/wlp/course-phpat-1789315783266'
    },
    '30-Day Complete Pass': {
      price: '₹499',
      paymentUrl: 'https://www.buye.online/wlp/course-phpat-1789315928117'
    },
    '90-Day Complete Pass': {
      price: '₹999',
      paymentUrl: 'https://www.buye.online/wlp/course-phpat-1789316119407'
    },
    '180-Day Complete Pass': {
      price: '₹1,499',
      paymentUrl: 'https://www.buye.online/wlp/course-phpat-1789316299967'
    },
    '365-Day Complete Pass': {
      price: '₹1,999',
      paymentUrl: 'https://www.buye.online/wlp/course-phpat-1789316439989'
    }
  };

  const selectedPlan = PLAN_DATA[plan] || {
    price: '',
    paymentUrl: ''
  };

  const ss = getSS_();
  const sheet = ss.getSheetByName('Leads');

  ensureLeadHeaders_(sheet);

  sheet.appendRow([
    new Date(),
    name,
    phone,
    email || '',
    goal || '',
    source || 'website',
    plan || '',
    selectedPlan.price,
    selectedPlan.paymentUrl,
    'Payment Pending'
  ]);

  return {
    ok: true,
    plan: plan || '',
    price: selectedPlan.price,
    paymentUrl: selectedPlan.paymentUrl
  };
}




/* ---------------- Lead Headers ---------------- */

function ensureLeadHeaders_() {
  const ss = getSS_();
  const sheet = ss.getSheetByName('Leads');

  if (!sheet) {
    throw new Error('Leads sheet not found.');
  }

  const requiredHeaders = [
    'Timestamp',
    'Name',
    'Phone',
    'Email',
    'Goal',
    'Source',
    'Plan',
    'Price',
    'Payment URL',
    'Payment Status'
  ];

  const currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet
    .getRange(1, 1, 1, currentLastColumn)
    .getValues()[0]
    .map(String);

  requiredHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      const newColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColumn).setValue(header);
      currentHeaders.push(header);
    }
  });

  return {
    ok: true,
    headers: sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
  };
}


