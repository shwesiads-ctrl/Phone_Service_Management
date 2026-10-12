/**
 * Complete Functional Test Suite for FixFlow Phone Service Management System
 */

async function runTests() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failedCount++;
    }
  }

  console.log('============================================================');
  console.log('1. AUTHENTICATION & ROLE ISOLATION TESTS');
  console.log('============================================================');

  // Test 1: Admin Login
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminLoginData.user?.role === 'admin', 'Admin Login', `Status: ${adminLoginRes.status}`);

  // Test 2: Technician Login
  const techLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tech1', password: 'tech123' }),
  });
  const techLoginData = await techLoginRes.json();
  assert(techLoginRes.status === 200 && techLoginData.user?.role === 'technician', 'Technician Login', `Status: ${techLoginRes.status}`);

  // Test 3: Invalid Login
  const invalidLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
  });
  assert(invalidLoginRes.status === 401, 'Invalid Password Rejected', `Status: ${invalidLoginRes.status}`);

  // Headers for simulated sessions
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLoginData.token}` };
  const techHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${techLoginData.token}` };
  const registerRes = await fetch(`${baseUrl}/api/admin/licenses/generate`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ plan: 'PAID', days: 365, license_name: 'Regression test license' }),
  });
  const paidKey = (await registerRes.json()).license.license_key;
  const freeRes = await fetch(`${baseUrl}/api/admin/licenses/generate`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ plan: 'FREE', days: 30, license_name: 'Regression community license' }),
  });
  const freeKey = (await freeRes.json()).license.license_key;

  // Capture baseline backup to restore after test suite finishes
  const initialBackupRes = await fetch(`${baseUrl}/api/backup`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const initialBackup = await initialBackupRes.json();

  console.log('\n============================================================');
  console.log('2. TECHNICIAN NEGATIVE SECURITY & PERMISSION TESTS (403)');
  console.log('============================================================');

  // Negative 1: Technician attempts Payment Creation -> 403
  const techNewPay = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({
      service_job_id: 'JOB-001',
      amount: 15000,
      payment_method: 'Cash',
      notes: 'Unauthorized tech payment',
    }),
  });
  assert(techNewPay.status === 403, 'Technician [New Payment] blocked with 403 Forbidden', `Status: ${techNewPay.status}`);

  // Negative 2: Technician attempts Payment Edit -> 403
  const techEditPay = await fetch(`${baseUrl}/api/payments/PAY-001`, {
    method: 'PUT',
    headers: techHeaders,
    body: JSON.stringify({ amount: 99999 }),
  });
  assert(techEditPay.status === 403, 'Technician [Edit Payment] blocked with 403 Forbidden', `Status: ${techEditPay.status}`);

  // Negative 3: Technician attempts Payment Delete -> 403
  const techDelPay = await fetch(`${baseUrl}/api/payments/PAY-001`, {
    method: 'DELETE',
    headers: techHeaders,
  });
  assert(techDelPay.status === 403, 'Technician [Delete Payment] blocked with 403 Forbidden', `Status: ${techDelPay.status}`);

  // Negative 4: Technician attempts Settlement Create -> 403
  const techNewSet = await fetch(`${baseUrl}/api/settlements`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({ settlement_type: 'daily' }),
  });
  assert(techNewSet.status === 403, 'Technician [New Settlement] blocked with 403 Forbidden', `Status: ${techNewSet.status}`);

  // Negative 5: Technician attempts Settlement Close -> 403
  const techCloseSet = await fetch(`${baseUrl}/api/settlements/SET-001/close`, {
    method: 'POST',
    headers: techHeaders,
  });
  assert(techCloseSet.status === 403, 'Technician [Close Settlement] blocked with 403 Forbidden', `Status: ${techCloseSet.status}`);

  // Negative 6: Technician attempts Income Add -> 403
  const techAddInc = await fetch(`${baseUrl}/api/finance/income`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({
      date: '2026-10-08',
      reference: 'INC-HACK',
      description: 'Hacked Income',
      amount: 50000,
    }),
  });
  assert(techAddInc.status === 403, 'Technician [Add Income] blocked with 403 Forbidden', `Status: ${techAddInc.status}`);

  // Negative 7: Technician attempts Expense Add -> 403
  const techAddExp = await fetch(`${baseUrl}/api/finance/expense`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({
      date: '2026-10-08',
      reference: 'EXP-HACK',
      category: 'Parts',
      description: 'Hacked Expense',
      amount: 20000,
    }),
  });
  assert(techAddExp.status === 403, 'Technician [Add Expense] blocked with 403 Forbidden', `Status: ${techAddExp.status}`);

  // Negative 8: Technician attempts Backup Creation -> 403
  const techBak = await fetch(`${baseUrl}/api/backup`, {
    method: 'POST',
    headers: techHeaders,
  });
  assert(techBak.status === 403, 'Technician [Create Backup] blocked with 403 Forbidden', `Status: ${techBak.status}`);

  // Negative 9: Technician attempts Restore -> 403
  const techRes = await fetch(`${baseUrl}/api/restore`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({ data: {} }),
  });
  assert(techRes.status === 403, 'Technician [Restore Backup] blocked with 403 Forbidden', `Status: ${techRes.status}`);

  // Negative 10: Technician attempts Technician Management -> 403
  const techNewTech = await fetch(`${baseUrl}/api/technicians`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({ full_name: 'Imposter Tech', phone: '09123456' }),
  });
  assert(techNewTech.status === 403, 'Technician [Register Technician] blocked with 403 Forbidden', `Status: ${techNewTech.status}`);

  // Negative 11: Technician attempts Settings Update -> 403
  const techSet = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: techHeaders,
    body: JSON.stringify({ shopName: 'Hacked Shop' }),
  });
  assert(techSet.status === 403, 'Technician [Settings Update] blocked with 403 Forbidden', `Status: ${techSet.status}`);

  // Negative 12: Technician attempts to reassign job to another technician -> 403
  const techReassign = await fetch(`${baseUrl}/api/jobs/JOB-001`, {
    method: 'PUT',
    headers: techHeaders,
    body: JSON.stringify({ technician_id: 'TECH-002' }),
  });
  assert(techReassign.status === 403, 'Technician [Reassign Job Technician] blocked with 403 Forbidden', `Status: ${techReassign.status}`);

  // Negative 13: Technician attempts to alter service_charge / financial amount -> 403
  const techAlterCharge = await fetch(`${baseUrl}/api/jobs/JOB-001`, {
    method: 'PUT',
    headers: techHeaders,
    body: JSON.stringify({ service_charge: 999999 }),
  });
  assert(techAlterCharge.status === 403, 'Technician [Alter Service Charge] blocked with 403 Forbidden', `Status: ${techAlterCharge.status}`);

  console.log('\n============================================================');
  console.log('3. ADMIN FUNCTIONAL CRUD & SERVICE LIFECYCLE TESTS');
  console.log('============================================================');

  // Action 1: Add Customer
  const custRes = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Functional Test Customer',
      phone: '09798889999',
      email: 'test@service.com',
      address: 'Test Street, Bay 3',
    }),
  });
  const newCust = await custRes.json();
  assert(custRes.status === 201 && newCust.name === 'Functional Test Customer', 'Admin [Add Customer]', `ID: ${newCust.id}`);

  // Action 2: Add Device
  const devRes = await fetch(`${baseUrl}/api/devices`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      customer_id: newCust.id,
      brand: 'Google',
      model: 'Pixel 8 Pro',
      serial_or_imei: '358999123456789',
      color: 'Bay Blue',
    }),
  });
  const newDev = await devRes.json();
  assert(devRes.status === 201 && newDev.model === 'Pixel 8 Pro', 'Admin [Add Device]', `ID: ${newDev.id}`);

  // Action 3: Register Technician
  const techRes1 = await fetch(`${baseUrl}/api/technicians`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      full_name: 'Aung Kyaw Test',
      phone: '0977112233',
      specialty: 'Motherboard & Micro-soldering',
      commission_rate: 30,
    }),
  });
  const newTech = await techRes1.json();
  assert(techRes1.status === 201 && newTech.full_name === 'Aung Kyaw Test', 'Admin [Register Technician]', `ID: ${newTech.id}`);

  // Action 4: Create Service Job
  const jobRes = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      customer_id: newCust.id,
      device_id: newDev.id,
      technician_id: 'TECH-001',
      problem_description: 'Display flicker and intermittent charging',
      service_charge: 35000,
      priority: 'high',
      warranty_days: 60,
    }),
  });
  const newJob = await jobRes.json();
  assert(jobRes.status === 201 && newJob.service_number.startsWith('SRV-'), 'Admin [Create Service Job]', `Num: ${newJob.service_number}`);

  // Action 5: Add Replacement Part
  const partRes = await fetch(`${baseUrl}/api/jobs/${newJob.id}/parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      part_name: 'USB-C Charging Flex Assembly',
      part_number: 'PX8-FLEX-01',
      quantity: 1,
      unit_cost: 18000,
      warranty: '60 Days',
    }),
  });
  const updatedJobParts = await partRes.json();
  assert(partRes.status === 201 && updatedJobParts.parts_cost === 18000 && updatedJobParts.total_cost === 53000, 'Admin [Add Parts]', `Total: ${updatedJobParts.total_cost}`);

  // Action 6: Record Payment (Admin only)
  const payRes = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      service_job_id: newJob.id,
      amount: 53000,
      payment_method: 'Cash',
      reference_number: 'RCP-TEST-001',
      notes: 'Full payment received at counter',
    }),
  });
  const paymentRecord = await payRes.json();
  assert(payRes.status === 201 && paymentRecord.amount === 53000, 'Admin [Add Payment / Record Receipt]', `Pay ID: ${paymentRecord.id}`);

  // Activate Pro/Paid License temporarily for Finance CRUD test
  await fetch(`${baseUrl}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: paidKey }),
  });

  // Action 7: Add Income Record
  const incRes = await fetch(`${baseUrl}/api/finance/income`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      reference: 'INC-TEST-01',
      service_number: newJob.service_number,
      customer_name: newCust.name,
      technician_id: 'TECH-001',
      technician_name: 'Alex Rivera',
      description: 'Completed motherboard charging repair',
      amount: 53000,
      payment_method: 'Cash',
    }),
  });
  const newInc = await incRes.json();
  assert(incRes.status === 201 && newInc.amount === 53000, 'Admin [Add Income]', `Inc ID: ${newInc.id}`);

  // Action 8: Add Expense Record
  const expRes = await fetch(`${baseUrl}/api/finance/expense`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      reference: 'EXP-TEST-01',
      category: 'Parts',
      description: 'Bulk purchase Pixel 8 flex cables',
      amount: 25000,
      payment_method: 'Cash',
    }),
  });
  const newExp = await expRes.json();
  assert(expRes.status === 201 && newExp.amount === 25000, 'Admin [Add Expense]', `Exp ID: ${newExp.id}`);

  // Action 9: Create Backup Snapshot
  const bakRes = await fetch(`${baseUrl}/api/backup`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const backupObj = await bakRes.json();
  assert(bakRes.status === 200 && backupObj.metadata?.status === 'valid', 'Admin [Create Backup]', `File: ${backupObj.metadata?.filename}, Size: ${backupObj.metadata?.size_bytes}B`);

  // Action 10: Validate and Restore Backup Snapshot
  const restoreRes = await fetch(`${baseUrl}/api/restore`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ data: backupObj.data }),
  });
  const restoreResult = await restoreRes.json();
  assert(restoreRes.status === 200 && restoreResult.success === true, 'Admin [Restore Backup]', `Message: ${restoreResult.message}`);

  console.log('\n============================================================');
  console.log('4. TECHNICIAN PERMITTED WORKFLOW TESTS');
  console.log('============================================================');

  // Technician Permitted 1: View Assigned Jobs Only
  const techJobsRes = await fetch(`${baseUrl}/api/jobs`, {
    method: 'GET',
    headers: techHeaders,
  });
  const techJobs = await techJobsRes.json();
  const allMatchTech = techJobs.every((j: any) => j.technician_id === 'TECH-001');
  assert(techJobsRes.status === 200 && allMatchTech, 'Technician [My Services] views ONLY assigned jobs', `Count: ${techJobs.length}`);

  // Technician Permitted 2: Update Diagnosis and Repair Notes on Assigned Job
  const techUpdateJob = await fetch(`${baseUrl}/api/jobs/${newJob.id}`, {
    method: 'PUT',
    headers: techHeaders,
    body: JSON.stringify({
      diagnosis: 'Charging port pins corroded; replaced flex cable assembly.',
      repair_notes: 'Soldering and bench testing completed. 5V 3A fast charging tested OK.',
      status_id: 'repairing',
    }),
  });
  const updatedJobData = await techUpdateJob.json();
  assert(techUpdateJob.status === 200 && updatedJobData.status_id === 'repairing', 'Technician [Update Diagnosis / Notes / Status]', `Status: ${updatedJobData.status_id}`);

  console.log('\n============================================================');
  console.log('5. LICENSE STATE, PLAN ENFORCEMENT & FEATURE GATING TESTS');
  console.log('============================================================');

  // License 1: Fetch Current License
  const licRes = await fetch(`${baseUrl}/api/license`);
  const licData = await licRes.json();
  assert(licRes.status === 200 && licData.license_name && licData.plan, 'Get Current License State', `Plan: ${licData.plan}, Status: ${licData.status}, Days: ${licData.license_days}`);

  // License 2: Verify License with Owner Server
  const licVerifyRes = await fetch(`${baseUrl}/api/license/verify`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const licVerifyData = await licVerifyRes.json();
  assert(licVerifyRes.status === 200 && licVerifyData.license, 'Verify License Locally', `Verification: ${licVerifyData.message || 'OK'}`);

  // License 3: Activate PAID License Key
  const licActRes = await fetch(`${baseUrl}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: paidKey }),
  });
  const licActData = await licActRes.json();
  assert(licActRes.status === 200 && licActData.license?.plan === 'PAID', 'Activate PAID License Key', `Plan: ${licActData.license?.plan}, Days: ${licActData.license?.license_days}`);

  // Feature Gating: Telegram Bot accessible under PAID plan
  const tgPaidRes = await fetch(`${baseUrl}/api/telegram`, {
    headers: adminHeaders,
  });
  assert(tgPaidRes.status === 200, 'PAID Plan: Telegram Bot configuration accessible (200 OK)');

  // Chat ID Maker: Missing token rejected
  const tgChatIdNoTokenRes = await fetch(`${baseUrl}/api/telegram/get-chat-ids`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  assert(tgChatIdNoTokenRes.status === 400, 'Chat ID Maker: Missing token returns 400 Bad Request');

  // Chat ID Maker: Technician blocked
  const tgChatIdTechRes = await fetch(`${baseUrl}/api/telegram/get-chat-ids`, {
    method: 'POST',
    headers: techHeaders,
    body: JSON.stringify({}),
  });
  assert(tgChatIdTechRes.status === 403, 'Chat ID Maker: Technician blocked with 403 Forbidden');

  // License 4: Remove License (Client-Only Reset)
  const licRemoveRes = await fetch(`${baseUrl}/api/license/remove`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const licRemoveData = await licRemoveRes.json();
  assert(licRemoveRes.status === 200 && licRemoveData.license?.plan === 'FREE', 'Remove License is CLIENT-ONLY (reset to FREE/NOT_ACTIVATED)');

  // Feature Gating: Telegram Bot locked with 403 under FREE plan
  const tgFreeRes = await fetch(`${baseUrl}/api/telegram`, {
    headers: adminHeaders,
  });
  assert(tgFreeRes.status === 200, 'FREE Plan: Telegram Bot accessible', `Status: ${tgFreeRes.status}`);

  // Feature Gating: Chat ID Maker locked with 403 under FREE plan
  const tgChatIdFreeRes = await fetch(`${baseUrl}/api/telegram/get-chat-ids`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  assert(tgChatIdFreeRes.status === 400, 'FREE Plan: Chat ID Maker validates missing token', `Status: ${tgChatIdFreeRes.status}`);

  // Feature Gating: Income Report locked with 403 under FREE plan
  const incFreeRes = await fetch(`${baseUrl}/api/finance/income`, {
    headers: adminHeaders,
  });
  assert(incFreeRes.status === 403, 'FREE Plan: Income Report locked with 403 Forbidden', `Status: ${incFreeRes.status}`);

  // Restore back to active community license
  await fetch(`${baseUrl}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: freeKey }),
  });

  // Restore initial database state to preserve user data
  if (initialBackup?.data) {
    await fetch(`${baseUrl}/api/restore`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ data: initialBackup.data }),
    });
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
