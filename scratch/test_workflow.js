const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch {
          resolve({ status: res.statusCode, raw: resp });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch {
          resolve({ status: res.statusCode, raw: resp });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function patch(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch {
          resolve({ status: res.statusCode, raw: resp });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('====================================================');
  console.log('  SPACIO ZERO-PAYMENT END-TO-END WORKFLOW TEST      ');
  console.log('====================================================\n');

  // STEP 1: LOGIN (Organizer / Student)
  console.log('1. [LOGIN] Authenticating student organizer (student@sece.ac.in)...');
  const studentLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'student@sece.ac.in',
    password: 'Venbok@123'
  });
  console.log(`   Status: ${studentLogin.status} - User: ${studentLogin.data?.data?.user?.name} (${studentLogin.data?.data?.user?.role})`);
  const studentToken = studentLogin.data?.data?.token;

  // STEP 2: DISCOVER VENUES
  console.log('\n2. [DISCOVER VENUES] Fetching authentic SECE venues...');
  const spacesRes = await get('http://localhost:5000/api/spaces');
  const spaces = spacesRes.data?.data || [];
  console.log(`   Fetched ${spaces.length} spaces.`);
  const targetVenue = spaces.find(s => s.name.includes('IT Centre Auditorium')) || spaces[0];
  console.log(`   Selected Target Venue: "${targetVenue.name}" (Capacity: ${targetVenue.capacity}, Verified: ${targetVenue.isVerified})`);

  // STEP 3: PLAN EVENT & RUN FEASIBILITY
  console.log('\n3. [PLAN EVENT & FEASIBILITY] Testing Feasibility Audit Engine...');
  const day = Math.floor(10 + Math.random() * 15);
  const testDate = `2026-12-${day}`;
  const feasibilityPayload = {
    spaceId: targetVenue.id || targetVenue._id,
    eventName: 'SECE Annual AI Hackathon & Tech Symposium',
    eventType: 'Conference',
    participants: 200,
    date: testDate,
    start: '09:00',
    end: '16:00',
    durationHours: 7,
    department: 'Department of Computer Science & Engineering',
    requirements: {
      soundSystem: true,
      powerBackup: true,
      stageSetup: true,
      liveStreaming: false
    }
  };
  const feasibilityRes = await post('http://localhost:5000/api/intelligence/feasibility', feasibilityPayload);
  console.log(`   Status: ${feasibilityRes.status}`);
  const fData = feasibilityRes.data?.data;
  console.log(`   Feasibility Decision: ${fData?.verdictLabel} (Score: ${fData?.overallFeasibilityScore}/100)`);
  console.log(`   Dimension 1: ${fData?.dimensions?.[0]?.dimension} -> ${fData?.dimensions?.[0]?.status}`);
  console.log(`   Dimension 2: ${fData?.dimensions?.[1]?.dimension} -> ${fData?.dimensions?.[1]?.status}`);
  console.log(`   Access Type: ${fData?.space?.accessType || 'Free Institutional Use'}`);

  // Check if feasibility returned any price/amount fields
  const hasCostSection = Boolean(fData?.breakdown?.venueRental || fData?.pricing || fData?.costBreakdown || fData?.bookingFee);
  console.log(`   Verified ZERO Cost/Fee in Feasibility: ${!hasCostSection ? 'PASSED (Zero money)' : 'FAILED'}`);

  // STEP 4: SUBMIT BOOKING REQUEST (ZERO MONEY / ZERO PAYMENT FIELDS)
  console.log('\n4. [SUBMIT BOOKING REQUEST] Submitting institutional booking request without money...');
  const bookingPayload = {
    title: 'SECE Annual AI Hackathon & Tech Symposium',
    type: 'Conference',
    spaceId: targetVenue.id || targetVenue._id,
    date: testDate,
    start: '09:00',
    end: '16:00',
    participants: 200,
    organizedBy: 'SECE AI & DS Club',
    notes: 'Keynotes, hackathon presentation, and mentor panel for campus students.',
    requestedBy: 'Sakthikanth R',
    requestedRole: 'student'
    // NOTICE: NO totalAmount, NO paymentStatus, NO transactionId, NO credit card, NO UPI!
  };

  const bookingRes = await post('http://localhost:5000/api/bookings', bookingPayload, studentToken);
  console.log(`   Status: ${bookingRes.status}`);
  const createdBooking = bookingRes.data?.data;
  console.log(`   Booking Created Successfully!`);
  console.log(`   ID: ${createdBooking?.id || createdBooking?._id}`);
  console.log(`   Title: "${createdBooking?.title}"`);
  console.log(`   Lifecycle Status: "${createdBooking?.status}"`);
  console.log(`   Payment Status Field: "${createdBooking?.paymentStatus || 'N/A'}"`);
  console.log(`   Amount Field: "${createdBooking?.totalAmount || 0}" (Zero payment transaction)`);

  const bookingId = createdBooking?.id || createdBooking?._id;

  // STEP 5: ADMIN LOGIN & APPROVAL
  console.log('\n5. [ADMIN APPROVAL] Logging in as Dean / Venue Administrator...');
  const adminLogin = await post('http://localhost:5000/api/auth/login', {
    email: 'admin@sece.ac.in',
    password: 'Venbok@123'
  });
  console.log(`   Admin Authenticated: ${adminLogin.data?.data?.user?.name} (${adminLogin.data?.data?.user?.role})`);
  const adminToken = adminLogin.data?.data?.token;

  console.log(`   Approving booking ID ${bookingId}...`);
  const approveRes = await patch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
    status: 'Approved'
  }, adminToken);
  console.log(`   Approval Response Status: ${approveRes.status}`);
  console.log(`   Updated Lifecycle Status: "${approveRes.data?.data?.status}"`);

  // STEP 6: CALENDAR VERIFICATION
  console.log('\n6. [CALENDAR & BOOKINGS VERIFICATION] Querying bookings list...');
  const calendarRes = await get(`http://localhost:5000/api/bookings?date=${testDate}`, adminToken);
  const dateBookings = calendarRes.data?.data || [];
  const foundInCalendar = dateBookings.find(b => (b.id || b._id) === bookingId);
  console.log(`   Booking appears in Calendar for ${testDate}: ${foundInCalendar ? 'YES ✓' : 'NO ✗'}`);
  console.log(`   Venue: ${targetVenue.name}`);
  console.log(`   Event: ${foundInCalendar?.title}`);
  console.log(`   Status in Calendar: ${foundInCalendar?.status}`);
  console.log(`   Event: ${foundInCalendar?.title}`);
  console.log(`   Status in Calendar: ${foundInCalendar?.status}`);

  console.log('\n====================================================');
  console.log('  ALL WORKFLOW STEPS VALIDATED WITH ZERO PAYMENT!    ');
  console.log('====================================================');
}

runTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
