// Upload contract helpers
export const SESSION_REBUILD_STATES = new Set(['expired','cancelled','failed']);
export function sessionNeedsRecreate(s){return !s||SESSION_REBUILD_STATES.has(String(s.state||'').toLowerCase())}
export function serverPartMap(receipt){const map=new Map();for(const p of (receipt?.parts||[])){const n=Number(p.part_number);if(!Number.isInteger(n)||n<1||!p.etag)throw Object.assign(new Error('invalid server part receipt'),{code:'UPLOAD_PART_RECEIPT_INVALID'});map.set(n,p)}return map}
export function reconcileServerParts(receipt,total){const map=serverPartMap(receipt);for(const n of map.keys())if(n>total)throw Object.assign(new Error('out of range part'),{code:'UPLOAD_PART_RECEIPT_INVALID'});return map}
export function finalizeJobPending(j){const state=String(j?.state||'').toLowerCase();if(['uploaded','verified'].includes(state))return false;const status=String(j?.status||j?.execution_state||'').toLowerCase();if(['completed','failed','cancelled'].includes(status))return false;return Boolean(j?.job_id)}
export async function waitForFinalizeJob(fetchJob,id,{wait=async ms=>new Promise(r=>setTimeout(r,ms)),delay=500,maxAttempts=120}={}){for(let i=0;i<maxAttempts;i++){const j=await fetchJob(`/jobs/${id}`);const s=String(j?.status||j?.execution_state||'').toLowerCase();if(s==='completed')return j;if(['failed','cancelled'].includes(s)){throw Object.assign(new Error(j.error||'upload finalize failed'),{code:'UPLOAD_FINALIZE_FAILED',job:j})}if(i<maxAttempts-1)await wait(delay)}throw Object.assign(new Error('upload finalize timeout'),{code:'UPLOAD_FINALIZE_TIMEOUT'})}
export async function finalizeUpload(request,session,body,polling){
 const path=`/attachments/upload-sessions/${session.id}`;
 const current=session.generation===undefined||session.generation===null?await request(path):session;
 if(current.generation===undefined||current.generation===null)throw Object.assign(new Error('上传会话缺少版本号，请刷新后重试'),{code:'UPLOAD_GENERATION_MISSING'});
 const result=await request(`${path}/actions`,{method:'POST',body,rowVersion:current.generation});
 if(['uploaded','verified'].includes(String(result?.state||'').toLowerCase()))return result;
 const status=String(result?.status||result?.execution_state||'').toLowerCase();
 if(['failed','cancelled'].includes(status))throw Object.assign(new Error(result.error||'上传提交失败'),{code:'UPLOAD_FINALIZE_FAILED'});
 if(!result?.job_id)throw Object.assign(new Error('上传提交响应缺少任务编号'),{code:'UPLOAD_FINALIZE_RESPONSE_INVALID'});
 if(finalizeJobPending(result))await waitForFinalizeJob(request,result.job_id,polling);
 const fresh=await request(path);
 if(!['uploaded','verified'].includes(String(fresh?.state||'').toLowerCase()))throw Object.assign(new Error('上传提交后文件仍未就绪'),{code:'UPLOAD_FINALIZE_RESPONSE_INVALID'});
 return fresh;
}
export function uploadPartError(status,text='',headers){
 const decode=value=>value.replace(/&(amp|lt|gt|quot|apos);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[name]));
 const value=name=>decode(String(text).match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1]||'');
 const code=value('Code')||`HTTP_${status}`,detail=value('Message'),requestId=headers?.get('x-amz-request-id')||value('RequestId');
 return Object.assign(new Error(`分片上传失败（HTTP ${status}）${detail?`：${detail}`:''}`),{status,code,requestId});
}
