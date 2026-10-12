import assert from 'node:assert/strict';
import { sendRawTelegramMessage, telegramRequest, escapeTelegramHtml } from '../src/server/telegram.ts';
const original = globalThis.fetch;
let calls: any[] = [], replies: any[] = [];
let passed = 0;
function check(name: string, value: any) { assert.ok(value, name); console.log(`PASS: ${name}`); passed++; }
globalThis.fetch = async (_url: any, options: any) => {
 calls.push(options);
 const reply = replies.shift();
 if (reply instanceof Error) throw reply;
 return new Response(typeof reply === 'string' ? reply : JSON.stringify(reply), {status: reply?.error_code || 200});
};
try {
 check('Telegram HTML escapes customer markup', escapeTelegramHtml('A & <B>') === 'A &amp; &lt;B&gt;');
 replies = [{ok:false,error_code:403,description:'Forbidden'}]; calls=[];
 await sendRawTelegramMessage('123:test','123','<b>Hi</b>');
 check('Delivery failures are never retried', calls.length === 1);
 replies = [{ok:false,error_code:429,description:'Too Many Requests'}]; calls=[];
 await sendRawTelegramMessage('123:test','123','Hi');
 check('Rate limits are never retried', calls.length === 1);
 replies = [{ok:false,error_code:400,description:"Bad Request: can't parse entities"},{ok:true}]; calls=[];
 const fallback = await sendRawTelegramMessage('123:test','123','<b>A &amp; &lt;B&gt;</b>');
 check('HTML rejection retries decoded plain text only', fallback.ok && calls.length===2 && JSON.parse(calls[1].body).text==='A & <B>' && !JSON.parse(calls[1].body).parse_mode);
 replies = ['not JSON'];
 check('Invalid Telegram JSON becomes safe error', !(await telegramRequest('123:test','getMe')).ok);
 replies = [new Error('Network https://api.telegram.org/bot123:test')];
 const failure = await telegramRequest('123:test','getMe');
 check('Network errors cannot expose token', !failure.ok && !failure.description.includes('123:test'));
 check('Every Telegram call has timeout signal', calls.every(c => c.signal instanceof AbortSignal));
 replies = [{ok:false,error_code:409,description:'Conflict'}];
 check('Webhook conflict explains manual Chat ID option', (await telegramRequest('123:test','getUpdates')).description.includes('manually'));
 replies = [{ok:false,error_code:401,description:'invalid 123:test'}];
 check('Telegram error descriptions redact tokens', !(await telegramRequest('123:test','getMe')).description.includes('123:test'));
} finally {globalThis.fetch = original;}
console.log(`TELEGRAM UNIT SUMMARY: ${passed} PASSED`);
