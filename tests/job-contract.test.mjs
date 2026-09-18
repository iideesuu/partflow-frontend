import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../runtime_templates/src/job-contract.js.tmpl', import.meta.url), 'utf8');
const {actionAllowed, createJobActionRunner, createJobRunner} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const management = fs.readFileSync(new URL('../runtime_templates/src/management.jsx.tmpl', import.meta.url), 'utf8');
const preview = {id: 'job-a', job_type: 'import', execution_state: 'awaiting_confirmation', row_version: 4,
  confirm_token: 'preview-a', allowed_actions: ['commit', 'cancel']};

test('an explicit empty allowed_actions denies every mutation without a request', async () => {
  for (const execution_state of ['queued', 'awaiting_confirmation', 'failed', 'completed_with_errors']) {
    const job = {...preview, execution_state, allowed_actions: []};
    for (const action of ['commit', 'cancel', 'retry']) {
      assert.equal(actionAllowed(job, action), false);
      await createJobActionRunner(() => assert.fail('forbidden action requested'))(job, action);
    }
  }
});

test('uncertain commit retries preserve the idempotency key, confirmation and precondition', async () => {
  const requests = []; let sequence = 0;
  const run = createJobActionRunner(async (path, options) => {
    requests.push({path, options});
    if (requests.length === 1) throw Object.assign(new Error('connection lost'), {code: 'NETWORK_ERROR'});
    return {execution_state: 'committing'};
  }, () => `key-${++sequence}`);
  await assert.rejects(run(preview, 'commit'));
  await run({...preview, row_version: 5, confirm_token: 'preview-b'}, 'commit');
  assert.equal(requests[0].path, '/imports/job-a/actions');
  assert.deepEqual(requests[1], requests[0]);
  assert.equal(requests[1].options.rowVersion, 4);
  assert.deepEqual(requests[1].options.body, {action: 'commit', confirm_token: 'preview-a'});
  assert.equal(sequence, 1);
});

test('duplicate clicks cannot dispatch a second action while the first is pending', async () => {
  let finish; let count = 0;
  const run = createJobActionRunner(async () => {count++; return new Promise(resolve => {finish = resolve})}, () => 'key-a');
  const first = run(preview, 'commit');
  await run(preview, 'commit');
  await run(preview, 'cancel');
  assert.equal(count, 1);
  finish({execution_state: 'committing'});
  await first;
});

test('a rejected confirmation permits a fresh key after the preview is refreshed', async () => {
  const keys = []; let sequence = 0;
  const run = createJobActionRunner(async (_path, options) => {
    keys.push(options.idempotencyKey);
    if (keys.length === 1) throw Object.assign(new Error('stale'), {status: 409, code: 'STALE_CONFIRMATION'});
  }, () => `key-${++sequence}`);
  await assert.rejects(run(preview, 'commit'));
  await run({...preview, row_version: 5, confirm_token: 'preview-b'}, 'commit');
  assert.deepEqual(keys, ['key-1', 'key-2']);
});

test('failure to retrieve missing confirmation data never dispatches a mutation', async () => {
  const calls = [];
  const run = createJobActionRunner(async (path, options) => {
    calls.push({path, options});
    throw new Error('detail unavailable');
  });
  await assert.rejects(run({...preview, confirm_token: '', row_version: undefined}, 'commit'));
  assert.deepEqual(calls, [{path: '/jobs/job-a', options: undefined}]);
});

test('export actions use the export endpoint and retain the precondition tuple', async () => {
  const requests = [];
  const run = createJobActionRunner(async (path, options) => { requests.push({path, options}); return {status: 'queued'}; }, () => 'export-key');
  await run({id: 'export-a', job_type: 'export', status: 'queued', row_version: 9, allowed_actions: ['cancel']}, 'cancel');
  assert.equal(requests[0].path, '/exports/export-a/actions');
  assert.equal(requests[0].options.rowVersion, 9);
  assert.equal(requests[0].options.idempotencyKey, 'export-key');
  assert.deepEqual(requests[0].options.body, {action: 'cancel'});
});

test('management UI exposes status/deadline and download contracts without exposing confirmation tokens', () => {
  assert.match(management, /commit_state\|\|j\.business_state/);
  assert.match(management, /confirm_expires_at/);
  assert.match(management, /\/jobs\/\$\{job\.id\}\/errors/);
  assert.match(management, /\/exports\/\$\{job\.id\}\/download/);
  assert.doesNotMatch(management, /确认令牌/);
  assert.doesNotMatch(management, /copyToken|copied/);
  assert.match(management, /createJobRunner/);
  assert.match(management, /runJobCreate\(`import:/);
  assert.match(management, /runJobCreate\(`export:/);
  assert.match(management, /importRunning\.current/);
  assert.match(management, /exportRunning\.current/);
  assert.match(management, /确认已失效，请点击重试/);
  assert.match(management, /confirmation_error==='STALE_CONFIRMATION'/);
});

test('job creation coalesces duplicate clicks and reuses a key after an uncertain failure', async () => {
  const requests = []; let rejectFirst; let sequence = 0;
  const run = createJobRunner(async (path, options) => {
    requests.push({path, options});
    if (requests.length === 1) {
      await new Promise((_, reject) => { rejectFirst = reject; });
    }
    return {id: 'job-a'};
  }, () => `create-key-${++sequence}`);
  const first = run('import:session-a', '/imports', {method: 'POST', body: {kind: 'part', upload_session: 'session-a'}});
  const duplicate = run('import:session-a', '/imports', {method: 'POST', body: {kind: 'part', upload_session: 'session-a'}});
  assert.equal(requests.length, 1);
  rejectFirst(Object.assign(new Error('connection lost'), {code: 'NETWORK_ERROR'}));
  await assert.rejects(first);
  await run('import:session-a', '/imports', {method: 'POST', body: {kind: 'part', upload_session: 'session-a'}});
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.idempotencyKey, requests[1].options.idempotencyKey);
  assert.equal(sequence, 1);
});

test('job creation gives later exports a fresh key after a successful response', async () => {
  const keys = []; let sequence = 0;
  const run = createJobRunner(async (_path, options) => { keys.push(options.idempotencyKey); return {status: 201}; }, () => `export-key-${++sequence}`);
  await run('export:part:csv', '/exports', {method: 'POST', body: {kind: 'part', format: 'csv'}});
  await run('export:part:csv', '/exports', {method: 'POST', body: {kind: 'part', format: 'csv'}});
  assert.deepEqual(keys, ['export-key-1', 'export-key-2']);
});
