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
