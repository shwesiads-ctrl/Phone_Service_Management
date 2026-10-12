export interface RecoveryBackup { installation_id: string; generation: number; created_at: string; key: string; }
export function recoveryBackupText(backup: RecoveryBackup) {
  return `FixFlow Password Recovery Key\nPC / Installation: ${backup.installation_id}\nGeneration: ${backup.generation}\nCreated: ${backup.created_at}\n\nRecovery Key: ${backup.key}\n\nUse Forgot Password on this installation. Successful recovery replaces this key; download the new backup. Keep this file private.\n`;
}
export function downloadRecoveryBackup(backup: RecoveryBackup) {
  const blob = new Blob([recoveryBackupText(backup)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url;
  link.download = `FixFlow-Recovery-${backup.installation_id.slice(0,8)}-v${backup.generation}.txt`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
