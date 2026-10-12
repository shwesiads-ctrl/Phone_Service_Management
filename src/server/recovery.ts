import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
interface RecoveryState {
  installation_id: string;
  machine_fingerprint: string;
  generation: number;
  created_at: string;
  key_hash: string;
  backup_key: string;
}
export class RecoveryKeyStore {
  private state: RecoveryState;
  private readonly file: string;
  constructor(directory: string, private machineFingerprint = RecoveryKeyStore.machineFingerprint()) {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.file = path.join(directory, 'password-recovery.json');
    if (fs.existsSync(this.file)) {
      const state = JSON.parse(fs.readFileSync(this.file, 'utf8')) as RecoveryState;
      if (!state.installation_id || !Number.isSafeInteger(state.generation) || state.generation < 1 || !/^FFRK-[A-Za-z0-9_-]{43}$/.test(state.backup_key) || RecoveryKeyStore.digest(state.backup_key) !== state.key_hash) throw new Error('Recovery key backup is unreadable. Restore the local security file before starting.');
      this.state = state;
      if (state.machine_fingerprint !== machineFingerprint) {
        this.state = this.newState(randomUUID(), 1);
        this.save(this.state);
      }
    } else { this.state = this.newState(randomUUID(), 1); this.save(this.state); }
  }
  private static machineFingerprint() {
    const macs = Object.values(os.networkInterfaces()).flatMap(entries => (entries || []).filter(info => !info.internal && info.mac !== '00:00:00:00:00:00').map(info => info.mac)).sort();
    return RecoveryKeyStore.digest(`${os.hostname()}|${os.platform()}|${os.arch()}|${[...new Set(macs)].join(',')}`);
  }
  private static digest(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private newState(installation: string, generation: number): RecoveryState {
    const key = `FFRK-${randomBytes(32).toString('base64url')}`;
    return { installation_id: installation, machine_fingerprint: this.machineFingerprint, generation, created_at: new Date().toISOString(), key_hash: RecoveryKeyStore.digest(key), backup_key: key };
  }
  private save(state: RecoveryState) {
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, this.file);
  }
  status() { return { installation_id: this.state.installation_id, generation: this.state.generation, created_at: this.state.created_at }; }
  backup() { return { ...this.status(), key: this.state.backup_key }; }
  verify(key: unknown) {
    if (typeof key !== 'string' || !/^FFRK-[A-Za-z0-9_-]{43}$/.test(key)) return false;
    return timingSafeEqual(Buffer.from(RecoveryKeyStore.digest(key), 'hex'), Buffer.from(this.state.key_hash, 'hex'));
  }
  rotate(action: () => (() => void) = () => () => {}) {
    const next = this.newState(this.state.installation_id, this.state.generation + 1);
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    // Check writable key storage before changing a password.
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600, flag: 'wx' });
    let rollback: (() => void) | undefined;
    try {
      rollback = action();
      fs.renameSync(temporary, this.file);
      this.state = next;
      return this.backup();
    } catch (error) {
      if (rollback) rollback();
      throw error;
    } finally { if (fs.existsSync(temporary)) fs.rmSync(temporary); }
  }
}
