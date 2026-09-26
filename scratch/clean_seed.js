const fs = require('fs');

let code = fs.readFileSync('backend/src/seed.js', 'utf8');

// Replace notification
code = code.replace(
  'title: "Payment Receipt Generated",\n\t\t\t\tmessage: "Receipt for Algorithmic Problem Solving Jam (₹7,500) has been generated.",\n\t\t\t\ttype: "payment",',
  'title: "Venue Reservation Confirmed",\n\t\t\t\tmessage: "Reservation for Algorithmic Problem Solving Jam in Turing Lab is confirmed for internal campus use.",\n\t\t\t\ttype: "booking",'
);

// Replace booking header comments
code = code.replace(
  '// 6. Create 42 Bookings with 10-state lifecycle, amounts, and requirement checks\n\t\tconsole.log("Seeding 42 Bookings with Statuses, Financial Totals, and Requirements...");',
  '// 6. Create 42 Bookings with lifecycle and requirement checks (Free Institutional Use)\n\t\tconsole.log("Seeding 42 Institutional Bookings with Requirements...");'
);

// Remove booking payment fields line by line
code = code.replace(/^\s*totalAmount:.*$\r?\n/gm, '');
code = code.replace(/^\s*paymentStatus:.*$\r?\n/gm, '');
code = code.replace(/^\s*transactionId:.*$\r?\n/gm, '');
code = code.replace(/^\s*costBreakdown:.*$\r?\n/gm, '');

fs.writeFileSync('backend/src/seed.js', code, 'utf8');
console.log('Done cleaning seed.js');
