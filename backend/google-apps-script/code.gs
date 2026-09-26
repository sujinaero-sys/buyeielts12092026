/**
 * BUYE IELTS — Backend
 * LOCAL SECURITY DEVELOPMENT VERSION
 *
 * IMPORTANT:
 * This file is currently being developed locally.
 * DO NOT deploy until the complete local implementation is tested.
 */

const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');

const ALLOWED_ACCESS_EMAIL = 'info@buye.online';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const SESSION_TTL_HOURS = 12;

const FROM_NAME = 'BUYE IELTS';


/* =========================================================
   SETUP
   ========================================================= */

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  ensureSheet_(
    ss,
    'Users',
    ['Timestamp', 'Name', 'Email', 'Phone', 'Role', 'AccessStatus']
  );

  ensureOtpSheet_(ss);

  ensureSheet_(
    ss,
    'Sessions',
    [
      'TokenHash',
      'Email',
      'CreatedAt',
      'ExpiresAt',
      'Revoked'
    ]
  );

  ensureSheet_(
    ss,
    'Leads',
    [
      'Timestamp',
      'Name',
      'Phone',
      'Email',
      'Goal',
      'Source'
    ]
  );
}


function ensureOtpSheet_(ss) {
  let sheet = ss.getSheetByName('OTPs_Secure');

  /*
   * Create the OTP sheet if it does not exist.
   */
  if (!sheet) {
    sheet = ss.insertSheet('OTPs_Secure');

    sheet.appendRow([
      'Email',
      'CodeHash',
      'ChallengeId',
      'CreatedAt',
      'ExpiresAt',
      'Attempts',
      'Used'
    ]);

    return;
  }

  /*
   * Required column order for the new OTP security system.
   */
  const requiredHeaders = [
    'Email',
    'CodeHash',
    'ChallengeId',
    'CreatedAt',
    'ExpiresAt',
    'Attempts',
    'Used'
  ];

  const lastColumn = Math.max(sheet.getLastColumn(), 1);

  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(value) {
      return String(value).trim();
    });

  /*
   * If the sheet already has the new structure,
   * leave it unchanged.
   */
  const alreadyCorrect =
    requiredHeaders.every(function(header, index) {
      return currentHeaders[index] === header;
    });

  if (alreadyCorrect) {
    return;
  }

  /*
   * Do NOT automatically rearrange or overwrite existing
   * OTP data. The migration will be handled explicitly
   * after the local implementation has been validated.
   */
  requiredHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      const newColumn = sheet.getLastColumn() + 1;

      sheet
        .getRange(1, newColumn)
        .setValue(header);

      currentHeaders.push(header);
    }
  });
}


function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  /*
   * Preserve existing columns and add any missing headers.
   */
  const lastColumn = Math.max(sheet.getLastColumn(), 1);

  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(value) {
      return String(value);
    });

  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      const newColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColumn).setValue(header);
      currentHeaders.push(header);
    }
  });
}


/* =========================================================
   HTTP ENTRY POINT
   ========================================================= */

function doPost(e) {
  let body = {};

  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({
      ok: false,
      error: 'Bad request.'
    });
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

      case 'validateSession':
        return jsonOut_(handleValidateSession_(body));

      case 'logout':
        return jsonOut_(handleLogout_(body));

      case 'saveLead':
        return jsonOut_(handleSaveLead_(body));

      default:
        return jsonOut_({
          ok: false,
          error: 'Unknown action.'
        });
    }

  } catch (err) {
    return jsonOut_({
      ok: false,
      error: 'Server error: ' + err.message
    });
  }
}


function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


function getSS_() {
  return SpreadsheetApp.openById(SHEET_ID);
}


/* =========================================================
   EMAIL / NORMALIZATION HELPERS
   ========================================================= */

function normalizeEmail_(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}


function isAllowedAccessEmail_(email) {
  return normalizeEmail_(email) === ALLOWED_ACCESS_EMAIL;
}


/* =========================================================
   HASHING / RANDOM TOKEN HELPERS
   ========================================================= */

function sha256Hex_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );

  return digest
    .map(function(byte) {
      const v = byte < 0 ? byte + 256 : byte;
      return ('0' + v.toString(16)).slice(-2);
    })
    .join('');
}


function generateRandomToken_() {
  /*
   * UUID + additional random bytes.
   * The complete token is returned only to the browser.
   * Only its SHA-256 hash is stored in the spreadsheet.
   */
  const uuid = Utilities.getUuid();

  const randomBytes = Utilities
    .computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() + ':' + new Date().getTime(),
      Utilities.Charset.UTF_8
    )
    .map(function(byte) {
      const v = byte < 0 ? byte + 256 : byte;
      return ('0' + v.toString(16)).slice(-2);
    })
    .join('');

  return uuid + '.' + randomBytes;
}


/* =========================================================
   REGISTER
   ========================================================= */

function handleRegister_(body) {
  const name = String(body.name || '').trim();
  const email = normalizeEmail_(body.email);
  const phone = String(body.phone || '').trim();
  const role = String(body.role || 'student').trim();

  if (!name || !email || !phone) {
    return {
      ok: false,
      error: 'Missing name, email or phone.'
    };
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    return {
      ok: false,
      error: 'Users sheet not found. Run setup first.'
    };
  }

  const data = sheet.getDataRange().getValues();
  const emailCol = 2;

  for (let i = 1; i < data.length; i++) {
    if (
      normalizeEmail_(data[i][emailCol]) === email
    ) {
      const existingStatus =
        String(data[i][5] || 'registered').toLowerCase();

      if (existingStatus === 'approved') {
        return {
          ok: true,
          existing: true,
          accessLevel: 'full',
          maxLesson: 157
        };
      }

      return {
        ok: true,
        existing: true,
        accessLevel: 'registered',
        maxLesson: 7
      };
    }
  }

  sheet.appendRow([
    new Date(),
    name,
    email,
    phone,
    role,
    'registered'
  ]);

  return {
    ok: true,
    accessLevel: 'registered',
    maxLesson: 7
  };
}


/* =========================================================
   OTP REQUEST
   ========================================================= */

function handleRequestOtp_(body) {
  const email = normalizeEmail_(body.email);

  /*
   * Full IELTS OTP access is available only to
   * administrator-approved registered learners.
   */
  const otpUser = getUserByEmail_(email);

  if (!otpUser.exists) {
    return {
      ok: false,
      error: 'Please register for IELTS access first.'
    };
  }

  if (String(otpUser.accessStatus || '').toLowerCase() !== 'approved') {
    return {
      ok: false,
      error: 'Your IELTS registration has not yet been approved by the administrator.'
    };
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName('OTPs_Secure');

  if (!sheet) {
    return {
      ok: false,
      error: 'OTP sheet not found. Run setup first.'
    };
  }

  /*
   * Prevent rapid OTP spam.
   */
  const latest = getLatestOtpForEmail_(sheet, email);

  if (latest) {
    const createdAt = new Date(latest.createdAt).getTime();

    if (
      !isNaN(createdAt) &&
      Date.now() - createdAt <
        OTP_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      const remaining = Math.ceil(
        (
          OTP_RESEND_COOLDOWN_SECONDS * 1000 -
          (Date.now() - createdAt)
        ) / 1000
      );

      return {
        ok: false,
        error:
          'Please wait ' +
          remaining +
          ' seconds before requesting another code.'
      };
    }
  }

  /*
   * Invalidate all previous OTPs for this email.
   */
  invalidatePreviousOtps_(sheet, email);

  const code = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  const challengeId = Utilities.getUuid();

  const createdAt = new Date();

  const expiresAt = new Date(
    createdAt.getTime() +
    OTP_TTL_MINUTES * 60 * 1000
  );

  /*
   * The plaintext OTP is never stored.
   */
  const codeHash = sha256Hex_(
    email + '|' + challengeId + '|' + code
  );

  sheet.appendRow([
    email,
    codeHash,
    challengeId,
    createdAt,
    expiresAt,
    0,
    false
  ]);

  MailApp.sendEmail({
    to: ALLOWED_ACCESS_EMAIL,
    subject: 'Your BUYE IELTS verification code',
    body:
      'Your BUYE IELTS one-time verification code is: ' +
      code +
      '\n\n' +
      'This code expires in ' +
      OTP_TTL_MINUTES +
      ' minutes and can be used only once.' +
      '\n\n' +
      'If you did not request this code, you can ignore this email.',
    name: FROM_NAME
  });

  return {
    ok: true,
    message: 'Verification code sent.'
  };
}


/* =========================================================
   OTP VERIFICATION
   ========================================================= */

function handleVerifyOtp_(body) {
  const email = normalizeEmail_(body.email);
  const code = String(body.code || '').trim();

  const verifyUser = getUserByEmail_(email);

  if (!verifyUser.exists) {
    return {
      ok: false,
      error: 'Registered learner account not found.'
    };
  }

  if (String(verifyUser.accessStatus || '').toLowerCase() !== 'approved') {
    return {
      ok: false,
      error: 'Your IELTS registration is not approved for OTP access.'
    };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      ok: false,
      error: 'Enter the 6-digit verification code.'
    };
  }

  const ss = getSS_();
  const otpSheet = ss.getSheetByName('OTPs_Secure');

  if (!otpSheet) {
    return {
      ok: false,
      error: 'OTP sheet not found. Run setup first.'
    };
  }

  const latest = getLatestOtpForEmail_(otpSheet, email);

  if (!latest) {
    return {
      ok: false,
      error: 'No active verification code found. Request a new one.'
    };
  }

  const row = latest.row;
  const values = latest.values;

  const storedHash = String(values[1] || '');
  const challengeId = String(values[2] || '');
  const expiresAt = new Date(values[4]);
  const attempts = Number(values[5] || 0);
  const used = values[6] === true || String(values[6]).toLowerCase() === 'true';

  if (used) {
    return {
      ok: false,
      error: 'This verification code has already been used.'
    };
  }

  if (isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
    return {
      ok: false,
      error: 'Code expired. Request a new one.'
    };
  }

  if (attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      error: 'Too many incorrect attempts. Request a new code.'
    };
  }

  const submittedHash = sha256Hex_(
    email + '|' + challengeId + '|' + code
  );

  /*
   * Increment attempt count before comparison.
   */
  otpSheet
    .getRange(row, 6)
    .setValue(attempts + 1);

  if (submittedHash !== storedHash) {
    return {
      ok: false,
      error:
        'Incorrect code. Attempts remaining: ' +
        Math.max(0, OTP_MAX_ATTEMPTS - attempts - 1)
    };
  }

  /*
   * Mark OTP as consumed immediately.
   */
  otpSheet
    .getRange(row, 7)
    .setValue(true);

  /*
   * Create authenticated server-side session.
   */
  const session = createSession_(email);

  const user = getUserByEmail_(email);

  return {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    name: user.name || 'BUYE IELTS',
    role: user.role || 'student'
  };
}


/* =========================================================
   OTP HELPERS
   ========================================================= */

function getLatestOtpForEmail_(sheet, email) {
  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (
      normalizeEmail_(rows[i][0]) === email
    ) {
      return {
        row: i + 1,
        values: rows[i],
        createdAt: rows[i][3]
      };
    }
  }

  return null;
}


function invalidatePreviousOtps_(sheet, email) {
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (
      normalizeEmail_(rows[i][0]) === email
    ) {
      /*
       * Column G = Used
       */
      sheet.getRange(i + 1, 7).setValue(true);
    }
  }
}


/* =========================================================
   USER LOOKUP
   ========================================================= */

function getUserByEmail_(email) {
  const ss = getSS_();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    return {
      exists: false,
      name: '',
      role: 'student',
      accessStatus: ''
    };
  }

  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (normalizeEmail_(users[i][2]) === email) {
      return {
        exists: true,
        name: users[i][1] || '',
        role: users[i][4] || 'student',
        accessStatus: users[i][5] || 'registered'
      };
    }
  }

  return {
    exists: false,
    name: '',
    role: 'student',
    accessStatus: ''
  };
}

function createSession_(email) {
  const ss = getSS_();
  const sheet = ss.getSheetByName('Sessions');

  if (!sheet) {
    throw new Error(
      'Sessions sheet not found. Run setup first.'
    );
  }

  /*
   * Revoke older sessions for this authorized account.
   * This keeps the account controlled by the latest login.
   */
  revokeSessionsForEmail_(sheet, email);

  const token = generateRandomToken_();

  const tokenHash = sha256Hex_(token);

  const createdAt = new Date();

  const expiresAt = new Date(
    createdAt.getTime() +
    SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  sheet.appendRow([
    tokenHash,
    email,
    createdAt,
    expiresAt,
    false
  ]);

  return {
    token: token,
    expiresAt: expiresAt
  };
}


function validateSession_(token) {
  if (!token) {
    return {
      ok: false,
      error: 'Authentication required.'
    };
  }

  const tokenHash = sha256Hex_(String(token));

  const ss = getSS_();
  const sheet = ss.getSheetByName('Sessions');

  if (!sheet) {
    return {
      ok: false,
      error: 'Sessions sheet not found.'
    };
  }

  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    const storedHash = String(rows[i][0] || '');

    if (storedHash !== tokenHash) {
      continue;
    }

    const email = normalizeEmail_(rows[i][1]);
    const expiresAt = new Date(rows[i][3]);
    const revoked =
      rows[i][4] === true ||
      String(rows[i][4]).toLowerCase() === 'true';

    if (revoked) {
      return {
        ok: false,
        error: 'Session has been logged out.'
      };
    }

    if (
      isNaN(expiresAt.getTime()) ||
      new Date() > expiresAt
    ) {
      sheet.getRange(i + 1, 5).setValue(true);

      return {
        ok: false,
        error: 'Session expired. Please verify again.'
      };
    }

    const user = getUserByEmail_(email);

    if (!user.exists) {
      sheet.getRange(i + 1, 5).setValue(true);

      return {
        ok: false,
        error: 'Registered learner account not found.'
      };
    }

    /*
     * A valid authenticated session created through OTP
     * represents full IELTS access.
     */
    return {
      ok: true,
      email: email,
      name: user.name || 'BUYE IELTS',
      role: user.role || 'student',
      accessLevel: 'full',
      maxLesson: 157,
      expiresAt: expiresAt.toISOString()
    };
  }

  return {
    ok: false,
    error: 'Invalid session.'
  };
}


function revokeSessionsForEmail_(sheet, email) {
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (
      normalizeEmail_(rows[i][1]) === email
    ) {
      sheet.getRange(i + 1, 5).setValue(true);
    }
  }
}


/* =========================================================
   SESSION API
   ========================================================= */

function handleValidateSession_(body) {
  return validateSession_(body.token);
}


function handleLogout_(body) {
  const token = String(body.token || '').trim();

  if (!token) {
    return {
      ok: true
    };
  }

  const tokenHash = sha256Hex_(token);

  const ss = getSS_();
  const sheet = ss.getSheetByName('Sessions');

  if (!sheet) {
    return {
      ok: true
    };
  }

  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0] || '') === tokenHash) {
      sheet.getRange(i + 1, 5).setValue(true);
      break;
    }
  }

  return {
    ok: true
  };
}


/* =========================================================
   LEADS
   ========================================================= */

function handleSaveLead_(body) {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const goal = String(body.goal || '').trim();
  const source = String(body.source || 'website').trim();
  const plan = String(body.plan || '').trim();

  if (!name || !phone) {
    return {
      ok: false,
      error: 'Name and phone are required.'
    };
  }

  const PLAN_DATA = {
    '7-Day Trial Pass': {
      price: '₹99',
      paymentUrl:
        'https://www.buye.online/wlp/course-phpat-1789315783266'
    },

    '30-Day Complete Pass': {
      price: '₹499',
      paymentUrl:
        'https://www.buye.online/wlp/course-phpat-1789315928117'
    },

    '90-Day Complete Pass': {
      price: '₹999',
      paymentUrl:
        'https://www.buye.online/wlp/course-phpat-1789316119407'
    },

    '180-Day Complete Pass': {
      price: '₹1,499',
      paymentUrl:
        'https://www.buye.online/wlp/course-phpat-1789316299967'
    },

    '365-Day Complete Pass': {
      price: '₹1,999',
      paymentUrl:
        'https://www.buye.online/wlp/course-phpat-1789316439989'
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
    email,
    goal,
    source,
    plan,
    selectedPlan.price,
    selectedPlan.paymentUrl,
    'Payment Pending'
  ]);

  return {
    ok: true,
    plan: plan,
    price: selectedPlan.price,
    paymentUrl: selectedPlan.paymentUrl
  };
}


/* =========================================================
   LEAD HEADERS
   ========================================================= */

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

  const currentLastColumn =
    Math.max(sheet.getLastColumn(), 1);

  const currentHeaders = sheet
    .getRange(
      1,
      1,
      1,
      currentLastColumn
    )
    .getValues()[0]
    .map(String);

  requiredHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      const newColumn =
        sheet.getLastColumn() + 1;

      sheet
        .getRange(1, newColumn)
        .setValue(header);

      currentHeaders.push(header);
    }
  });

  return {
    ok: true,
    headers: sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0]
  };
}