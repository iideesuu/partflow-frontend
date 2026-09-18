import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../runtime_templates/src/upload-contract.js.tmpl', import.meta.url), 'utf8');
const {sessionNeedsRecreate, serverPartMap, reconcileServerParts, finalizeJobPending, finalizeUpload, uploadPartError, waitForFinalizeJob} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('expired and cancelled sessions are recreated, completed sessions are reused', () => {
  assert.equal(sessionNeedsRecreate({state: 'expired'}), true);
  assert.equal(sessionNeedsRecreate({state: 'cancelled'}), true);
  assert.equal(sessionNeedsRecreate({state: 'failed'}), true);
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
  assert.equal(finalizeJobPending({state: 'uploaded'}), false);
  assert.equal(finalizeJobPending({state: 'verified'}), false);
  assert.equal(finalizeJobPending({status: 'queued'}), false);
});

test('finalize refreshes a legacy session before sending If-Match', async () => {
  const calls = [];
  const result = await finalizeUpload(async (path, options) => {
    calls.push([path, options]);
    if (!options) return {id: 's1', generation: 7, state: 'created'};
    return {id: 's1', generation: 8, state: 'uploaded'};
  }, {id: 's1'}, {action: 'finalize'}, {wait: async () => {}, maxAttempts: 1});
  assert.equal(result.state, 'uploaded');
  assert.equal(calls[1][1].rowVersion, 7);
  assert.equal(calls.length, 2);
});

test('MinIO XML errors retain status, code and request id', () => {
  const error = uploadPartError(400, '<Error><Code>MalformedXML</Code><Message>bad part list</Message><RequestId>abc</RequestId></Error>', new Headers({'x-amz-request-id': 'abc'}));
  assert.equal(error.status, 400);
  assert.equal(error.code, 'MalformedXML');
  assert.equal(error.requestId, 'abc');
  assert.match(error.message, /bad part list/);
});

test('asynchronous finalize polls only its job and returns the completed session', async () => {
  const calls = [], session = {id: 's2', generation: 1};
  const result = await finalizeUpload(async (path, options) => {
    calls.push([path, options]);
    if (options) return {job_id: 'j2', status: 'queued'};
    if (path === '/jobs/j2') return {execution_state: 'completed'};
    return {...session, generation: 2, state: 'uploaded'};
  }, session, {action: 'finalize'}, {wait: async () => {}, maxAttempts: 1});
  assert.equal(result.id, session.id);
  assert.equal(result.state, 'uploaded');
  assert.deepEqual(calls.map(([path]) => path), ['/attachments/upload-sessions/s2/actions', '/jobs/j2', '/attachments/upload-sessions/s2']);
  assert.equal(calls[0][1].rowVersion, 1);
});

test('failed or malformed finalize responses cannot be returned as completed uploads', async () => {
  await assert.rejects(() => finalizeUpload(async () => ({job_id: 'j3', status: 'failed', error: 'checksum mismatch'}), {id: 's3', generation: 1}, {}), e => e.code === 'UPLOAD_FINALIZE_FAILED');
  await assert.rejects(() => finalizeUpload(async () => ({status: 'queued'}), {id: 's3', generation: 1}, {}), e => e.code === 'UPLOAD_FINALIZE_RESPONSE_INVALID');
  await assert.rejects(() => finalizeUpload(async () => ({id: 's3'}), {id: 's3'}, {}), e => e.code === 'UPLOAD_GENERATION_MISSING');
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
