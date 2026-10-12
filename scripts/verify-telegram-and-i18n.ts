import { translations } from '../src/i18n/translations.ts';
import { formatLocalizedDate } from '../src/utils/formatters.ts';

async function main() {
  console.log('========================================================');
  console.log('1. VERIFYING 20 GLOBAL LANGUAGES & TRANSLATIONS');
  console.log('========================================================');

  const supportedCodes = Object.keys(translations);
  console.log(`Loaded ${supportedCodes.length} locales: ${supportedCodes.join(', ')}`);

  if (supportedCodes.length !== 20) {
    throw new Error(`Expected exactly 20 locales, but found ${supportedCodes.length}`);
  }

  const enKeys = Object.keys(translations.en);
  console.log(`Base English keys count: ${enKeys.length}`);

  let missingCount = 0;
  for (const code of supportedCodes) {
    const dict = (translations as any)[code];
    let keyCount = 0;
    for (const k of enKeys) {
      if (!dict[k] || typeof dict[k] !== 'string') {
        console.error(`[Locale ${code}] Missing or invalid key: ${k}`);
        missingCount++;
      } else {
        keyCount++;
      }
    }
    console.log(`✓ Locale '${code}': 100% complete (${keyCount}/${enKeys.length} keys)`);
  }

  if (missingCount > 0) {
    throw new Error(`Failed: ${missingCount} missing keys found in locales`);
  }

  // Verify date formatting for every locale
  const testDate = '2026-10-10T09:30:00Z';
  for (const lang of supportedCodes) {
    const formatted = formatLocalizedDate(testDate, lang as any, 'YYYY-MM-DD');
    if (!formatted || formatted === 'Invalid Date') {
      throw new Error(`Date formatting failed for language: ${lang}`);
    }
  }
  console.log('✓ Localized date formatting verified across all 20 languages');

  console.log('\n========================================================');
  console.log('2. VERIFYING TELEGRAM BOT API ENDPOINTS');
  console.log('========================================================');

  const BASE = 'http://localhost:3000';
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'admin',
    'x-user-id': 'USR-001',
    'x-username': 'admin',
  };

  // Ensure PAID license for Telegram tests
  await fetch(`${BASE}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: 'PAID-PRO-2026-365D' }),
  });

  // Test 1: Telegram test with bad token returns proper descriptive error message (not silent fail)
  const testBadTokenRes = await fetch(`${BASE}/api/telegram/test`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ bot_token: '123456:FAKE_TOKEN_XYZ', chat_id: '12345678' }),
  });
  const testBadTokenData = await testBadTokenRes.json();
  console.log('Bad token test response:', testBadTokenData);
  if (testBadTokenRes.status === 400 && testBadTokenData.success === false && testBadTokenData.message) {
    console.log('✓ Telegram test endpoint returns explicit user error message for bad token');
  } else {
    throw new Error('Telegram test endpoint failed to return descriptive error');
  }

  // Test 2: Telegram Daily Summary endpoint
  const dailySummaryRes = await fetch(`${BASE}/api/telegram/daily-summary`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const dailySummaryData = await dailySummaryRes.json();
  console.log('Daily summary response:', dailySummaryData);
  if (dailySummaryData.summary && typeof dailySummaryData.summary.active_jobs === 'number') {
    console.log(`✓ Daily summary computed: active=${dailySummaryData.summary.active_jobs}, ready=${dailySummaryData.summary.ready_jobs}, completed=${dailySummaryData.summary.completed_today}, revenue=${dailySummaryData.summary.revenue_today}`);
  } else {
    throw new Error('Daily summary endpoint failed to compute metrics');
  }

  // Test 3: Get Telegram Chat IDs endpoint
  const getChatsRes = await fetch(`${BASE}/api/telegram/get-chat-ids`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ bot_token: '123456:FAKE_TOKEN_XYZ' }),
  });
  const getChatsData = await getChatsRes.json();
  console.log('Get chats response:', getChatsData);
  if (getChatsRes.status === 400 && getChatsData.error) {
    console.log('✓ Get Telegram Chat IDs endpoint safely handles and reports upstream errors');
  } else {
    throw new Error('Get chat IDs endpoint failed error handling');
  }

  // Restore Community License
  await fetch(`${BASE}/api/license/activate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ license_key: 'FREE-COMMUNITY-EDITION' }),
  });

  console.log('\n========================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
