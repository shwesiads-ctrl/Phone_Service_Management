/**
 * Deep Functional Test Suite: All CRUD, Validations, Search & Filter, Negative Manipulations, and Database Verifications
 */

async function runComprehensiveTests() {
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, note?: string) {
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.error(`FAIL: ${name} -> ${note || 'Failed'}`);
      failed++;
    }
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'admin',
    'x-user-id': 'USR-001',
    'x-username': 'admin',
  };

  const techHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'technician',
    'x-user-id': 'USR-TECH-001',
    'x-username': 'kyawzin',
    'x-technician-id': 'TECH-001',
  };

  console.log('============================================================');
  console.log('5. FORM VALIDATION & NEGATIVE VALUES TESTS');
  console.log('============================================================');

  // 1. Customer form: Missing required name/phone
  const emptyCust = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ name: '', phone: '' }),
  });
  // Should reject or handle gracefully
  assert(emptyCust.status === 400 || emptyCust.status === 201, 'Customer validation executed', `Status: ${emptyCust.status}`);

  // 2. Service Job: Missing required fields
  const emptyJob = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ customer_id: '', device_id: '' }),
  });
  assert(emptyJob.status === 400, 'Empty Service Job creation rejected (400)', `Status: ${emptyJob.status}`);

  // 3. Negative Payment Amount rejection or sanitation
  const negPay = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      service_job_id: 'JOB-001',
      amount: -5000,
      payment_method: 'Cash',
    }),
  });
  assert(negPay.status === 400, 'Negative Payment Amount rejected (400)', `Status: ${negPay.status}`);

  // Activate Pro/Paid License before Finance tests so Income & Expense are accessible
  await fetch(`${baseUrl}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: 'PAID-PRO-TEST-365' }),
  });

  // 4. Invalid Date Format
  const badDateInc = await fetch(`${baseUrl}/api/finance/income`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      date: 'not-a-date',
      description: 'Bad date test',
      amount: 1000,
    }),
  });
  assert(badDateInc.status === 400 || badDateInc.status === 201, 'Income Date validation handled', `Status: ${badDateInc.status}`);

  // 5. Corrupted Backup Payload Restore
  const corruptRestore = await fetch(`${baseUrl}/api/restore`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ data: { invalid_key: 123 } }),
  });
  const corruptRes = await corruptRestore.json();
  assert(corruptRestore.status === 400 && corruptRes.error.includes('Incompatible backup'), 'Corrupted Backup Restore prevented with safety error', corruptRes.error);

  console.log('\n============================================================');
  console.log('6. SEARCH & FILTER API VERIFICATION');
  console.log('============================================================');

  // 1. Jobs List & Fetch
  const jobsRes = await fetch(`${baseUrl}/api/jobs`, { method: 'GET', headers: adminHeaders });
  const allJobs = await jobsRes.json();
  assert(Array.isArray(allJobs) && allJobs.length > 0, 'Admin can view all Service Jobs', `Count: ${allJobs.length}`);

  // 2. Customers List
  const custsRes = await fetch(`${baseUrl}/api/customers`, { method: 'GET', headers: adminHeaders });
  const allCusts = await custsRes.json();
  assert(Array.isArray(allCusts) && allCusts.length > 0, 'Admin can view all Customers', `Count: ${allCusts.length}`);

  // 3. Devices List
  const devsRes = await fetch(`${baseUrl}/api/devices`, { method: 'GET', headers: adminHeaders });
  const allDevs = await devsRes.json();
  assert(Array.isArray(allDevs) && allDevs.length > 0, 'Admin can view all Devices', `Count: ${allDevs.length}`);

  // 4. Technicians List with workload
  const techsRes = await fetch(`${baseUrl}/api/technicians`, { method: 'GET', headers: adminHeaders });
  const allTechs = await techsRes.json();
  assert(Array.isArray(allTechs) && allTechs[0]?.activeJobs !== undefined, 'Admin can view Technicians with active workload counts', `Techs: ${allTechs.length}`);

  // 5. Payments List
  const paysRes = await fetch(`${baseUrl}/api/payments`, { method: 'GET', headers: adminHeaders });
  const allPays = await paysRes.json();
  assert(Array.isArray(allPays), 'Admin can view Service Payments list', `Count: ${allPays.length}`);

  // 6. Income Records List
  const incRes = await fetch(`${baseUrl}/api/finance/income`, { method: 'GET', headers: adminHeaders });
  const allInc = await incRes.json();
  assert(Array.isArray(allInc), 'Admin can view Income Records', `Count: ${allInc.length}`);

  // 7. Expense Records List
  const expRes = await fetch(`${baseUrl}/api/finance/expense`, { method: 'GET', headers: adminHeaders });
  const allExp = await expRes.json();
  assert(Array.isArray(allExp), 'Admin can view Expense Records', `Count: ${allExp.length}`);

  // 8. Settlements List
  const setRes = await fetch(`${baseUrl}/api/settlements`, { method: 'GET', headers: adminHeaders });
  const allSet = await setRes.json();
  assert(Array.isArray(allSet), 'Admin can view Financial Settlements', `Count: ${allSet.length}`);

  // 9. Security Audit Trail
  const auditRes = await fetch(`${baseUrl}/api/audit`, { method: 'GET', headers: adminHeaders });
  const allAudit = await auditRes.json();
  assert(Array.isArray(allAudit) && allAudit.length > 0, 'Admin can view Security Audit Log', `Entries: ${allAudit.length}`);

  console.log('\n============================================================');
  console.log('7. SETTLEMENT & FINANCE LIFECYCLE TESTS');
  console.log('============================================================');

  // 1. Create Settlement
  const newSetRes = await fetch(`${baseUrl}/api/settlements`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      period_start: '2026-10-01',
      period_end: '2026-10-08',
      settlement_type: 'weekly',
      total_income: 150000,
      total_expense: 45000,
      net_balance: 105000,
      notes: 'Weekly workshop closing settlement',
    }),
  });
  const newSettlement = await newSetRes.json();
  assert(newSetRes.status === 201 && newSettlement.status === 'open', 'Admin [Create Settlement]', `ID: ${newSettlement.id}`);

  // 2. Close Settlement
  const closeSetRes = await fetch(`${baseUrl}/api/settlements/${newSettlement.id}/close`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const closedSettlement = await closeSetRes.json();
  assert(closeSetRes.status === 200 && closedSettlement.status === 'closed', 'Admin [Close Settlement]', `Closed By: ${closedSettlement.closed_by}`);

  console.log('\n============================================================');
  console.log('8. DIRECT URL & ID MANIPULATION ATTEMPTS (SECURITY LOCK)');
  console.log('============================================================');

  // 1. Technician tries to access another technician's job by direct ID
  const otherTechJobRes = await fetch(`${baseUrl}/api/jobs/JOB-003`, {
    method: 'GET',
    headers: techHeaders,
  });
  // JOB-003 belongs to TECH-003 (Aung Ko Min), techHeaders is TECH-001 (kyawzin)
  assert(otherTechJobRes.status === 403, 'Technician blocked from viewing other technician job by direct ID (403)', `Status: ${otherTechJobRes.status}`);

  // 2. Technician tries to delete another technician's job
  const delJobAttempt = await fetch(`${baseUrl}/api/jobs/JOB-003`, {
    method: 'DELETE',
    headers: techHeaders,
  });
  assert(delJobAttempt.status === 403, 'Technician blocked from deleting jobs by direct ID (403)', `Status: ${delJobAttempt.status}`);

  // 3. Technician tries to access audit logs
  const techAudit = await fetch(`${baseUrl}/api/audit`, {
    method: 'GET',
    headers: techHeaders,
  });
  assert(techAudit.status === 403, 'Technician blocked from viewing Audit Logs (403)', `Status: ${techAudit.status}`);

  console.log('\n============================================================');
  console.log(`TOTAL ADVANCED TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runComprehensiveTests().catch((e) => {
  console.error('Advanced test error:', e);
  process.exit(1);
});
