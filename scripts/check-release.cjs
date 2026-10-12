const fs=require('node:fs');
const release=JSON.parse(fs.readFileSync('src/config/release.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const readme=fs.readFileSync('README.md','utf8');
if(release.version!==pkg.version || release.version!==lock.version || release.version!==lock.packages[''].version)throw new Error('Update release, package and lockfile versions together.');
if(!/^\d{4}-\d{2}-\d{2}$/.test(release.date) || !['my','en'].every(language=>Array.isArray(release.changes[language]) && release.changes[language].length && release.changes[language].every(note=>typeof note==='string' && note.trim())))throw new Error('Provide release date and Myanmar/English release notes for About.');
if(!readme.includes(`မြန်မာလမ်းညွှန် — Version ${release.version}`) || !readme.includes(`## Version ${release.version}`))throw new Error('Update both Myanmar and English README sections for this release.');
console.log(`Release ${release.version}: About metadata, package versions and bilingual README checked.`);
