import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../runtime_templates/src/upload-contract.js.tmpl', import.meta.url), 'utf8');
const {sessionNeedsRecreate, serverPartMap, reconcileServerParts, finalizeJobPending, waitForFinalizeJob} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('expired and cancelled sessions are recreated, completed sessions are reused', () => {
  assert.equal(sessionNeedsRecreate({state: 'expired'}), true);
  assert.equal(sessionNeedsRecreate({state: 'cancelled'}), true);
  assert.equal(sessionNeedsRecreate({state: 'uploaded'}), false);
  assert.equal(sessionNeedsRecreate({state: 'verified'}), false);
});

test('server ListParts response is the sole resume receipt', () => {
  const map = serverPartMap({parts: [{part_number: 1, etag: 'remote'}]});
  assert.deepEqual([...map.keys()], [1]);
  assert.equal(map.get(1).etag, 'remote');
});

test('queued finalize jobs remain pending until completion', () => {
  assert.equal(finalizeJobPending({job_id: 'j1', status: 'queued'}), true);
  assert.equal(finalizeJobPending({job_id: 'j1', status: 'completed'}), false);
});

test('server receipt validation rejects malformed or out-of-range parts', () => {
  assert.throws(() => reconcileServerParts({parts: [{part_number: 0, etag: 'x'}]}, 2));
  assert.throws(() => reconcileServerParts({parts: [{part_number: 3, etag: 'x'}]}, 2));
  assert.throws(() => reconcileServerParts({parts: [{part_number: 1}]}, 2));
});

test('finalize polling resolves completed and propagates failed states', async () => {
  const seen = [];
  const result = await waitForFinalizeJob(async path => { seen.push(path); return {execution_state: seen.length > 1 ? 'completed' : 'running'}; }, 'job-1', {wait: async () => {}, delay: 0, maxAttempts: 3});
  assert.equal(result.execution_state, 'completed');
  assert.deepEqual(seen, ['/jobs/job-1', '/jobs/job-1']);
  await assert.rejects(() => waitForFinalizeJob(async () => ({execution_state: 'failed', error: 'bad'}), 'job-2', {wait: async () => {}, delay: 0, maxAttempts: 1}), e => e.code === 'UPLOAD_FINALIZE_FAILED');
});
