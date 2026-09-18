const base=(import.meta.env.VITE_API_BASE_URL||'/api/v1').replace(/\/$/,'');
const mutating=new Set(['POST','PUT','PATCH','DELETE']);
export async function apiRequest(path,{method='GET',body,rowVersion,idempotencyKey,...options}={}){
  method=String(method).toUpperCase();
  const headers={Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(options.headers||{})};
  const csrf=document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1];
  if(csrf&& !['GET','HEAD','OPTIONS'].includes(method))headers['X-CSRFToken']=decodeURIComponent(csrf);
  if(rowVersion!==undefined&&rowVersion!==null)headers['If-Match']=String(rowVersion).replace(/^\"|\"$/g,'');
  if(mutating.has(method)&&!headers['Idempotency-Key'])headers['Idempotency-Key']=idempotencyKey||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  else if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
  const raw=path.startsWith('/')?path:`/${path}`;const [p,q]=raw.split('?');const url=`${base}${p.endsWith('/')?p:`${p}/`}${q?`?${q}`:''}`;
  let response;try{response=await fetch(url,{...options,method,headers,credentials:'include',body:body===undefined?undefined:JSON.stringify(body)})}catch(cause){const e=new Error('网络请求失败，请检查连接或 CORS 配置');Object.assign(e,{code:'NETWORK_ERROR',cause});throw e}
  const requestId=response.headers.get('X-Request-Id')||response.headers.get('X-Correlation-Id');
  const retryAfter=Number(response.headers.get('Retry-After')||0)||undefined;
  const text=await response.text();let payload=null;try{payload=text?JSON.parse(text):null}catch{payload=text||null}
  if(!response.ok){const detail=payload?.detail||payload?.message||(typeof payload==='string'?payload:'');const error=new Error(detail||`API 请求失败 (${response.status})`);Object.assign(error,{status:response.status,details:payload,requestId,retryAfter,code:payload?.code||payload?.error_code||`HTTP_${response.status}`});throw error}
  if(response.status===204)return null;
  if(response.status===202&&payload&&typeof payload==='object')payload.accepted=true;
  return payload;
}
export const endpoints={categories:'/categories',units:'/units',parts:'/parts',boms:'/boms',numbers:'/numbers',audit:'/audit',auditEvents:'/audit-events',uploadSessions:'/attachments/upload-sessions',imports:'/imports',exports:'/exports',jobs:'/jobs',reviewTasks:'/review-tasks',authCsrf:'/auth/csrf',authLogin:'/auth/login',authMe:'/auth/me',authLogout:'/auth/logout',authUsers:'/auth/users',adminUsers:'/admin/users',adminSettings:'/admin/settings',adminHealth:'/admin/health'};
