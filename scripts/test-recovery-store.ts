import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, copyFileSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RecoveryKeyStore } from '../src/server/recovery.ts';
const directory = mkdtempSync(join(tmpdir(),'fixflow-key-store-'));
let passed=0;
const check=(name:string,value:any)=>{assert.ok(value,name);passed++;console.log(`PASS: ${name}`);};
try {
  const first=new RecoveryKeyStore(join(directory,'pc-one'),'pc-one');
  const backup=first.backup();
  check('Generated recovery key has 256-bit random format',/^FFRK-[A-Za-z0-9_-]{43}$/.test(backup.key));
  check('Generated key verifies',first.verify(backup.key));
  check('Invalid types and lengths rejected',!first.verify(null)&&!first.verify({})&&!first.verify('short'));
  check('Status never exposes key or verifier',!('key' in first.status())&&!('key_hash' in first.status()));
  check('Local recovery file is owner-only',process.platform==='win32'||(statSync(join(directory,'pc-one','password-recovery.json')).mode&0o777)===0o600);
  const restarted=new RecoveryKeyStore(join(directory,'pc-one'),'pc-one');
  check('Same PC keeps same key and installation across restart',restarted.backup().key===backup.key&&restarted.backup().installation_id===backup.installation_id);
  mkdirSync(join(directory,'pc-two'));copyFileSync(join(directory,'pc-one','password-recovery.json'),join(directory,'pc-two','password-recovery.json'));
  const second=new RecoveryKeyStore(join(directory,'pc-two'),'pc-two');
  check('Copied key rejected on a different PC',!second.verify(backup.key)&&second.backup().installation_id!==backup.installation_id);
  const next=first.rotate();
  check('Rotation invalidates old key',!first.verify(backup.key)&&first.verify(next.key));
  check('Rotation keeps PC identity and increments generation',next.installation_id===backup.installation_id&&next.generation===2);
  check('Newest generation persists',new RecoveryKeyStore(join(directory,'pc-one'),'pc-one').backup().key===next.key);
  let rejected=false;try{first.rotate(()=>{throw new Error('simulated password write failure');});}catch{rejected=true;}
  check('Password write failure cannot consume recovery key',rejected&&first.verify(next.key)&&first.status().generation===2);
  const state=JSON.parse(readFileSync(join(directory,'pc-one','password-recovery.json'),'utf8'));
  check('Failed password transaction leaves key file unchanged',state.backup_key===next.key&&state.generation===2);
  console.log(`RECOVERY STORE SUMMARY: ${passed} PASSED`);
} finally {rmSync(directory,{recursive:true,force:true});}
