/** Imported only by the isolated regression server. Never sends real Telegram traffic. */
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: any, options?: any) => {
  const url = String(input);
  if (!url.startsWith('https://api.telegram.org/')) return originalFetch(input, options);
  const body = JSON.parse(options?.body || '{}');
  appendFileSync(join(process.env.FIXFLOW_DATA_DIR!, 'telegram-calls.jsonl'), JSON.stringify({url, body}) + '\n');
  let data: any = { ok: true, result: { message_id: 1 } };
  if (url.endsWith('/getMe')) data.result = { id: 123, first_name: 'Test & <Bot>', username: 'test_bot', is_bot: true };
  if (url.endsWith('/getUpdates')) data.result = [
    { message: { chat: { id: 123, first_name: 'First', type: 'private' }, text: '/start', date: 1 } },
    { edited_message: { chat: { id: 123, first_name: 'First', type: 'private' }, text: 'edited', date: 2 } },
    { callback_query: { message: { chat: { id: -123, title: 'Group', type: 'supergroup' }, date: 3 } } },
  ];
  if (body.chat_id === 'fail' || body.chat_id === '@failed_channel') data = { ok: false, error_code: 403, description: 'Forbidden: bot was blocked' };
  return new Response(JSON.stringify(data), { status: data.ok ? 200 : 403, headers: { 'Content-Type': 'application/json' } });
};
