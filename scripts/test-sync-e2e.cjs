const fs = require('fs');
const path = require('path');
const os = require('os');
const SyncManager = require('../electron/syncManager.cjs');

async function run() {
  console.log('=== DocVault Desktop Auto-Sync & Deduplication Test ===');
  const serverUrl = 'http://100.113.158.58:8080';

  // 1. Authenticate with Homelab
  console.log('1. Authenticating with homelab server at', serverUrl);
  const testUser = `sync_tester_${Date.now().toString(36)}`;
  const testPass = 'Password123!';
  const testEmail = `${testUser}@example.com`;

  const regRes = await fetch(`${serverUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, email: testEmail, password: testPass })
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed: ${await regRes.text()}`);
  }

  const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, password: testPass })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.jwt;
  console.log('✓ Registered and received JWT token for user:', testUser);

  // 2. Setup Temporary Watched Folder
  const testDir = path.join(os.tmpdir(), `docvault-test-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  console.log('✓ Created local test watch folder:', testDir);

  const syncManager = new SyncManager({
    userDataPath: testDir,
    onEvent: (ev) => console.log(`[Sync Event] ${ev.status?.toUpperCase()}: ${ev.fileName} - ${ev.message}`),
    onStatusChange: () => {}
  });

  syncManager.saveConfig({
    serverUrl,
    token,
    username: testUser,
    watchedFolders: [testDir],
    autoSync: false,
    debounceMs: 100
  });

  // 3. Create Sample Document with Finance Keywords
  const sampleFilePath = path.join(testDir, 'invoice_march_2026.txt');
  const sampleContent = 'INVOICE #99812\nTotal Due: $4,500.00\nVAT: $900.00\nBank Transfer IBAN: US123456789\nPayment received with thanks.';
  fs.writeFileSync(sampleFilePath, sampleContent);
  console.log('✓ Wrote test financial invoice to:', sampleFilePath);

  // 4. Test First Sync (Upload & Auto-Categorization)
  console.log('\n2. Testing First Sync (Upload)...');
  await syncManager.syncFile(sampleFilePath);

  const history1 = syncManager.getStatus().history;
  const firstEvent = history1[0];
  console.log('First event status:', firstEvent.status);
  if (firstEvent.status !== 'uploaded') {
    throw new Error(`Expected 'uploaded' but got '${firstEvent.status}': ${firstEvent.message}`);
  }
  console.log('✓ Successfully uploaded file! Document ID:', firstEvent.documentId);

  // Wait 3s for async server-side Tika extraction, auto-categorization, and ES indexing
  console.log('Waiting 3 seconds for server-side asynchronous processing pipeline...');
  await new Promise(r => setTimeout(r, 3000));

  // 5. Test Instant SHA-256 Pre-flight Deduplication
  console.log('\n3. Testing Pre-Flight SHA-256 Deduplication (Identical File Sync)...');
  await syncManager.syncFile(sampleFilePath);

  const history2 = syncManager.getStatus().history;
  const secondEvent = history2[0];
  console.log('Second event status:', secondEvent.status);
  if (secondEvent.status !== 'skipped') {
    throw new Error(`Expected 'skipped' but got '${secondEvent.status}': ${secondEvent.message}`);
  }
  console.log('✓ Pre-flight deduplication verified: Server confirmed identical SHA-256 already stored!');

  // Also create a copy with a different filename in the watched folder
  const sampleCopyPath = path.join(testDir, 'duplicate_invoice.txt');
  fs.writeFileSync(sampleCopyPath, sampleContent);
  console.log('\nTesting copy of identical document with different filename:');
  await syncManager.syncFile(sampleCopyPath);
  const copyEvent = syncManager.getStatus().history[0];
  console.log('Copy event status:', copyEvent.status);
  if (copyEvent.status !== 'skipped') {
    throw new Error(`Expected copy to be skipped but got '${copyEvent.status}'`);
  }
  console.log('✓ Content-addressed deduplication verified: Duplicate with different name skipped!');

  // 6. Verify Document Details & Auto-Categorization from Homelab Server
  console.log('\n4. Verifying Server-Side Auto-Categorization & Elastic Search...');
  const docRes = await fetch(`${serverUrl}/api/documents/${firstEvent.documentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const docData = await docRes.json();
  console.log('Document status:', docData.status);
  console.log('Assigned Category:', docData.categoryName);
  console.log('Category Color:', docData.categoryColor);
  console.log('Checksum:', docData.checksum);

  if (docData.categoryName !== 'Finance') {
    throw new Error(`Expected category 'Finance' but got '${docData.categoryName}'`);
  }
  console.log('✓ Automatic categorization to "Finance" confirmed!');

  // 7. Verify Categories Endpoint
  const catRes = await fetch(`${serverUrl}/api/categories`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const categories = await catRes.json();
  console.log('User Categories:', categories);
  if (!categories.some(c => c.name === 'Finance' && c.documentCount >= 1)) {
    throw new Error('Categories endpoint did not list Finance category with document count');
  }
  console.log('✓ Category list and document count confirmed!');

  // 8. Verify Full-Text Search in Elasticsearch
  const searchRes = await fetch(`${serverUrl}/api/documents/search?q=IBAN`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  console.log('Search total hits for "IBAN":', searchData.totalHits);
  if (searchData.totalHits < 1) {
    throw new Error('Search did not find document by content keyword "IBAN"');
  }
  console.log('Found search item category:', searchData.items[0].categoryName);
  console.log('Search highlight snippet:', searchData.items[0].highlights);
  console.log('✓ Full-text Elasticsearch search confirmed!');

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('\n=== ALL END-TO-END VERIFICATION CHECKS PASSED ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
