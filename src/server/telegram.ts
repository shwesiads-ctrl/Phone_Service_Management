export const escapeTelegramHtml = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function telegramRequest(token: string, method: string, body?: object): Promise<any> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}), signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (typeof data?.ok !== 'boolean') return { ok: false, description: 'Invalid response from Telegram.' };
    if (!response.ok) data.ok = false;
    if (data.description) data.description = String(data.description).split(token).join('[redacted]');
    if (data.error_code === 409 && method === 'getUpdates') data.description += ' Chat detection requires polling; a webhook or another polling process may be active. Enter the Chat ID manually or resolve the other integration first.';
    return data;
  } catch { return { ok: false, description: 'Telegram request timed out or failed. Check internet access and try again.' }; }
}
export async function sendRawTelegramMessage(token: string, chatId: string, html: string): Promise<{ok: boolean; description?: string}> {
  const result = await telegramRequest(token, 'sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML' });
  // Retry only a definite HTML parsing rejection, never delivery or rate limit failures.
  if (!result.ok && result.error_code === 400 && /can't parse entities|unsupported start tag/i.test(result.description || '')) {
    const text = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return telegramRequest(token, 'sendMessage', { chat_id: chatId, text });
  }
  return result;
}
