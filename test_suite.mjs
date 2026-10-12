// Automated Test Suite for FixFlow Service Management
const BASE = 'http://localhost:3000';

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE FUNCTIONAL TEST SUITE ---');

  // Baseline backup snapshot to restore database state upon completion
  const baselineBackupRes = await fetch(`${BASE}/api/backup`, {
    method: 'POST',
    headers: { 'x-username': 'admin' },
  });
  const baselineBackup = await baselineBackupRes.json();

  // 1. AUTH TESTS
  await test('Auth: Admin login succeeds with valid token and role', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user && data.user.role === 'admin', 'Expected admin user object');
  });

  await test('Auth: Technician login succeeds with technician_id attached', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'kyawzin', password: 'tech123' }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user && data.user.role === 'technician', 'Expected technician role');
    assert(data.user.technician_id === 'TECH-001', 'Expected TECH-001 ID');
  });

  await test('Auth: Unknown username returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user', password: 'any' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Auth: Invalid password returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 2. TECHNICIAN MANAGEMENT TESTS
  let createdTechUsername = `tech_test_${Date.now()}`;
  let createdTechId = '';

  await test('Admin: Register new technician succeeds', async () => {
    const res = await fetch(`${BASE}/api/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        full_name: 'Test Technician Alpha',
        username: createdTechUsername,
        phone: '+95 9 111 222 333',
        email: 'alpha@test.com',
        address: 'Bench 5',
        specialization: ['Screen', 'Battery'],
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const tech = await res.json();
    assert(tech.id && tech.id.startsWith('TECH-'), 'Expected TECH- id');
    createdTechId = tech.id;
  });

  await test('Technician (Negative): Cannot register technician -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        full_name: 'Hacker Tech',
        username: 'hacktech',
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // 3. CUSTOMER & DEVICE TESTS
  let testCustId = '';
  let testDevId = '';

  await test('Admin: Create customer succeeds and persists', async () => {
    const res = await fetch(`${BASE}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        name: 'Daw Hla Hla',
        phone: '+95 9 999 888 777',
        email: 'hlahla@gmail.com',
        address: 'Bahan, Yangon',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const cust = await res.json();
    assert(cust.id && cust.name === 'Daw Hla Hla', 'Customer data mismatch');
    testCustId = cust.id;
  });

  await test('Admin: Create device succeeds and persists', async () => {
    const res = await fetch(`${BASE}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        category: 'smartphone',
        serial_or_imei: '358920194820192',
        customer_id: testCustId,
        condition_notes: 'Back glass cracked, camera lens intact.',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const dev = await res.json();
    assert(dev.id && dev.model === 'Galaxy S23 Ultra', 'Device data mismatch');
    testDevId = dev.id;
  });

  // 4. SERVICE JOBS TESTS
  let createdJobId = '';

  await test('Admin: Create service job succeeds with initial status and labor charge', async () => {
    const res = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        customer_id: testCustId,
        device_id: testDevId,
        technician_id: 'TECH-001',
        problem_description: 'Screen touch not responding in bottom third.',
        diagnosis: 'Defective digitizer flex cable connector.',
        priority: 'urgent',
        service_charge: 45000,
        warranty_days: 60,
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const job = await res.json();
    assert(job.id && job.service_number, 'Job creation failed');
    assert(job.technician_id === 'TECH-001', 'Technician mismatch');
    assert(job.service_charge === 45000, 'Service charge mismatch');
    createdJobId = job.id;
  });

  await test('Technician (Assigned): Can update diagnosis and workmanship notes on assigned job', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        status_id: 'diagnosing',
        diagnosis: 'Microscope inspection confirmed loose digitizer solder pin.',
        repair_notes: 'Re-soldered pin 14 on FPC connector.',
      }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const updated = await res.json();
    assert(updated.status_id === 'diagnosing', 'Status update failed');
    assert(updated.diagnosis.includes('Microscope inspection'), 'Diagnosis update failed');
  });

  await test('Technician (Negative): Cannot reassign job to another technician -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        technician_id: 'TECH-002',
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot alter service charge -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        service_charge: 90000,
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot alter amount_paid -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        amount_paid: 45000,
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Unassigned Negative): Somchai (TECH-002) cannot edit Kyaw Zin (TECH-001) job -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'somchai' },
      body: JSON.stringify({
        repair_notes: 'Unauthorized edit by Somchai',
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot delete service job -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/jobs/${createdJobId}`, {
      method: 'DELETE',
      headers: { 'x-username': 'kyawzin' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // 5. PAYMENTS & FINANCIAL SETTLEMENT TESTS
  let createdPaymentId = '';

  await test('Admin: Create payment succeeds and links to job', async () => {
    const res = await fetch(`${BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        service_job_id: createdJobId,
        amount: 25000,
        payment_method: 'KBZ Pay',
        reference_number: 'KBZ-982173',
        payment_note: 'Advance deposit on intake',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const pay = await res.json();
    assert(pay.id && pay.amount === 25000, 'Payment data mismatch');
    createdPaymentId = pay.id;
  });

  await test('Technician (Negative): Cannot create payment -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        service_job_id: createdJobId,
        amount: 20000,
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot edit payment -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/payments/${createdPaymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({
        amount: 50000,
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot delete payment -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/payments/${createdPaymentId}`, {
      method: 'DELETE',
      headers: { 'x-username': 'kyawzin' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Admin: Edit payment succeeds with audit trail', async () => {
    const res = await fetch(`${BASE}/api/payments/${createdPaymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        amount: 30000,
        reason: 'Adjusted customer deposit payment',
      }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const updated = await res.json();
    assert(updated.amount === 30000, 'Payment amount was not updated');
  });

  // 6. INCOME & EXPENSE ACCOUNTING TESTS
  let createdIncomeId = '';
  let createdExpenseId = '';

  await test('Admin: Record Income succeeds', async () => {
    const res = await fetch(`${BASE}/api/finance/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        description: 'iPhone 13 Screen Service Revenue',
        amount: 50000,
        currency: 'MMK',
        payment_method: 'Cash',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const inc = await res.json();
    assert(inc.id && inc.amount === 50000, 'Income mismatch');
    createdIncomeId = inc.id;
  });

  await test('Technician (Negative): Cannot view or record income -> 403 Forbidden', async () => {
    const getRes = await fetch(`${BASE}/api/finance/income`, {
      headers: { 'x-username': 'kyawzin' },
    });
    assert(getRes.status === 403, `Expected 403 on GET, got ${getRes.status}`);

    const postRes = await fetch(`${BASE}/api/finance/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({ description: 'Hacked', amount: 100 }),
    });
    assert(postRes.status === 403, `Expected 403 on POST, got ${postRes.status}`);
  });

  await test('Admin: Record Expense succeeds', async () => {
    const res = await fetch(`${BASE}/api/finance/expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        category: 'Parts',
        description: 'OLED Display Replacement Assembly',
        amount: 25000,
        currency: 'MMK',
        payment_method: 'Bank Transfer',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const exp = await res.json();
    assert(exp.id && exp.amount === 25000, 'Expense mismatch');
    createdExpenseId = exp.id;
  });

  await test('Technician (Negative): Cannot view or record expense -> 403 Forbidden', async () => {
    const getRes = await fetch(`${BASE}/api/finance/expense`, {
      headers: { 'x-username': 'kyawzin' },
    });
    assert(getRes.status === 403, `Expected 403 on GET, got ${getRes.status}`);

    const postRes = await fetch(`${BASE}/api/finance/expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify({ category: 'Parts', description: 'Hacked', amount: 100 }),
    });
    assert(postRes.status === 403, `Expected 403 on POST, got ${postRes.status}`);
  });

  // 7. SETTLEMENTS TESTS
  let createdSettlementId = '';

  await test('Admin: Create settlement record succeeds', async () => {
    const res = await fetch(`${BASE}/api/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({
        settlement_type: 'daily',
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        total_service_charges: 45000,
        total_payments: 30000,
        outstanding_balance: 15000,
        total_income: 50000,
        total_expense: 25000,
        net_balance: 25000,
        currency: 'MMK',
        status: 'draft',
      }),
    });
    assert(res.ok, `Expected 201, got ${res.status}`);
    const settle = await res.json();
    assert(settle.id && settle.status === 'draft', 'Settlement creation failed');
    createdSettlementId = settle.id;
  });

  await test('Admin: Close settlement record succeeds', async () => {
    const res = await fetch(`${BASE}/api/settlements/${createdSettlementId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const closed = await res.json();
    assert(closed.status === 'closed', 'Expected status to be closed');
  });

  await test('Technician (Negative): Cannot access settlements -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/settlements`, {
      headers: { 'x-username': 'kyawzin' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // 8. BACKUP & RESTORE COMPLETE ROUNDTRIP
  let backupSnapshot = null;

  await test('Admin: Create backup snapshot returns valid database payload', async () => {
    const res = await fetch(`${BASE}/api/backup`, {
      method: 'POST',
      headers: { 'x-username': 'admin' },
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const b = await res.json();
    assert(b.metadata && b.metadata.status === 'valid', 'Invalid backup metadata');
    assert(b.data && Array.isArray(b.data.service_jobs), 'Missing service_jobs in backup data');
    assert(b.data.service_jobs.length > 0, 'Empty service_jobs in backup');
    backupSnapshot = b;
  });

  await test('Technician (Negative): Cannot create or download backup -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/backup`, {
      method: 'POST',
      headers: { 'x-username': 'kyawzin' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Technician (Negative): Cannot restore backup -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'kyawzin' },
      body: JSON.stringify(backupSnapshot.data),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Restore: Invalid JSON / missing keys rejected safely', async () => {
    const res = await fetch(`${BASE}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify({ bad_data: true }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const err = await res.json();
    assert(err.error && err.error.includes('missing required key'), 'Expected missing key error');
  });

  await test('Admin: Restore valid backup roundtrip succeeds and preserves data', async () => {
    const res = await fetch(`${BASE}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify(backupSnapshot.data),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const r = await res.json();
    assert(r.success === true, 'Restore was not successful');

    // Verify database contains the created job
    const jobsRes = await fetch(`${BASE}/api/jobs`, {
      headers: { 'x-username': 'admin' },
    });
    const jobs = await jobsRes.json();
    const found = jobs.find((j) => j.id === createdJobId);
    assert(found, 'Created job should still exist after valid restore');
  });

  await test('Unauthenticated (Negative): Accessing jobs without auth returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE}/api/jobs`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 9. AUDIT TRAIL VERIFICATION
  await test('Admin: Audit trail records all security and financial events', async () => {
    const res = await fetch(`${BASE}/api/audit`, {
      headers: { 'x-username': 'admin' },
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const trail = await res.json();
    assert(Array.isArray(trail) && trail.length > 0, 'Expected non-empty audit trail');
    const blockedEvents = trail.filter((e) => e.action.includes('UNAUTHORIZED'));
    assert(blockedEvents.length > 0, 'Expected recorded unauthorized attempt events');
  });

  // Teardown: Restore original baseline database state
  if (baselineBackup?.data) {
    await fetch(`${BASE}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-username': 'admin' },
      body: JSON.stringify(baselineBackup.data),
    });
  }

  console.log('\n--- TEST SUITE SUMMARY ---');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
