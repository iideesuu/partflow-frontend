export const jobState = job => String(job?.execution_state || job?.status || 'unknown').toLowerCase();
export const jobToken = job => job?.confirm_token || job?.summary?.confirm_token || '';
export const jobVersion = job => job?.row_version ?? job?.current_row_version;

export function actionAllowed(job, action) {
  if (Array.isArray(job?.allowed_actions)) return job.allowed_actions.includes(action);
  const state = jobState(job);
  if (action === 'commit') return ['dry_run', 'awaiting_confirmation', 'staged'].includes(state);
  if (action === 'cancel') return ['queued', 'running', 'dry_run', 'awaiting_confirmation', 'staged'].includes(state);
  if (action === 'retry') return ['failed', 'completed_with_errors'].includes(state);
  return false;
}

// Keep the exact request after an uncertain failure: its retry is the same
// operation, even if background polling has since returned a newer version.
export function createJobActionRunner(request, newKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) {
  const pending = new Map();
  let running = false;
  return async (job, action) => {
    if (running || !actionAllowed(job, action)) return;
    running = true;
    const slot = `${job.job_type || 'import'}:${job.id || job.job_id}:${action}`;
    try {
      let operation = pending.get(slot);
      if (!operation) {
        let target = job;
        if (jobVersion(target) == null || (action === 'commit' && !jobToken(target))) {
          target = {...job, ...await request(`/jobs/${job.id || job.job_id}`)};
        }
        if (!actionAllowed(target, action)) return;
        if (jobVersion(target) == null) throw new Error('任务版本未返回，请刷新后重试');
        if (action === 'commit' && !jobToken(target)) throw new Error('预检确认信息已失效，请重新预检');
        const body = {action};
        if (action === 'commit') body.confirm_token = jobToken(target);
        operation = {
          path: `/${target.job_type === 'export' ? 'exports' : 'imports'}/${target.id || target.job_id}/actions`,
          options: {method: 'POST', rowVersion: jobVersion(target), idempotencyKey: newKey(), body},
        };
        pending.set(slot, operation);
      }
      const result = await request(operation.path, operation.options);
      pending.delete(slot);
      return result;
    } catch (error) {
      // A definitive rejection allows a new operation after the user refreshes.
      // Network errors, throttling and server failures keep the original key.
      if (error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status)) pending.delete(slot);
      throw error;
    } finally {
      running = false;
    }
  };
}

// Job creation has the same uncertainty window as a mutation action: a
// request can reach the server and lose its response.  Keep the exact
// idempotency key and request snapshot for a retry, while coalescing duplicate
// clicks that arrive before the first response.
export function createJobRunner(request, newKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) {
  const pending = new Map();
  return (slot, path, options = {}) => {
    const key = String(slot || path);
    const existing = pending.get(key);
    if (existing) {
      if (existing.promise) return existing.promise;
      return run(existing);
    }
    const operation = {
      path,
      options: {...options, idempotencyKey: options.idempotencyKey || newKey()},
      promise: null,
    };
    pending.set(key, operation);
    return run(operation, key);

    async function run(current, currentKey = key) {
      if (current.promise) return current.promise;
      current.promise = (async () => {
        try {
          const result = await request(current.path, current.options);
          pending.delete(currentKey);
          return result;
        } catch (error) {
          // Network errors, throttling and server failures retain the exact
          // operation.  A definitive client rejection permits a fresh create
          // after the caller corrects its input.
          if (error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status)) pending.delete(currentKey);
          throw error;
        } finally {
          current.promise = null;
        }
      })();
      return current.promise;
    }
  };
}
