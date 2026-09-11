import React,{useEffect,useState} from 'react';
import {apiRequest} from './api.js';
export {apiRequest};
export const list=x=>Array.isArray(x?.results)?x.results:Array.isArray(x)?x:[];
export function Field({label,children,wide=false}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}
export function ErrorBox({error}){return error?<div className="error-banner" role="alert">{error?.message||String(error)}</div>:null}
export function Badge({children,tone='gray'}){return <span className={'badge '+tone}><i/>{children}</span>}
export function PageHead({eyebrow,title,desc}){return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div></div>}
export function useData(path,refresh=0){const[data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[reload,setReload]=useState(0);useEffect(()=>{let alive=true;setLoading(true);setError(null);apiRequest(path).then(x=>alive&&setData(x)).catch(x=>alive&&setError(x)).finally(()=>alive&&setLoading(false));return()=>{alive=false}},[path,refresh,reload]);return {data,loading,error,refresh:()=>setReload(v=>v+1)}}
export const MAX_ATTACHMENT_BYTES=5*1024**3,MAX_IMPORT_BYTES=5*1024**2,UPLOAD_PART_BYTES=64*1024**2;
const sessionKey=f=>`partflow.upload.${f.name}.${f.size}.${f.lastModified}`;
export async function probeUploadCapabilities(){if(!(window.isSecureContext||['localhost','127.0.0.1','[::1]'].includes(location.hostname)))throw Error('当前环境不支持安全上传，请使用 HTTPS 或 localhost');if(!globalThis.crypto?.subtle)throw Error('当前浏览器缺少 crypto.subtle，无法计算校验和');if(typeof File==='undefined'||typeof File.prototype.slice!=='function')throw Error('当前浏览器不支持分片上传')}
export async function sha256File(file){const d=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function presignBatch(id,numbers){const r=await apiRequest(`/attachments/upload-sessions/${id}/parts/presign`,{method:'POST',body:{part_numbers:numbers}});return r.parts||r.part_urls||r}
export async function uploadFile(file,onProgress=()=>{},maxBytes=MAX_IMPORT_BYTES,purpose='import_source'){
 if(!file||file.size<=0)throw Error('请选择非空文件'); if(file.size>maxBytes)throw Error(maxBytes>=MAX_ATTACHMENT_BYTES?'附件不能超过 5 GiB':'结构化导入文件不能超过 5 MiB'); await probeUploadCapabilities();
 const digest=await sha256File(file),key=sessionKey(file);let saved=null;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 const same=saved&&saved.name===file.name&&saved.size===file.size&&saved.lastModified===file.lastModified; let s=same&&saved.id?await apiRequest(`/attachments/upload-sessions/${saved.id}`).catch(()=>null):null;
 if(!s){s=await apiRequest('/attachments/upload-sessions',{method:'POST',body:{filename:file.name,size:file.size,content_type:file.type||'application/octet-stream',purpose,total_chunks:Math.ceil(file.size/UPLOAD_PART_BYTES),sha256:digest}});localStorage.setItem(key,JSON.stringify({id:s.id,name:file.name,size:file.size,lastModified:file.lastModified,parts:[]}))}
 const total=s.total_chunks||Math.ceil(file.size/UPLOAD_PART_BYTES),done=new Map([...(s.parts||[]),...(same?saved.parts||[]:[])].map(p=>[Number(p.part_number),p])),urls=s.part_urls||[];
 for(let start=1;start<=total;start+=20){const nums=Array.from({length:Math.min(20,total-start+1)},(_,i)=>start+i).filter(n=>!done.has(n));if(!nums.length)continue;const batch=urls.length?nums.map(n=>urls[n-1]):await presignBatch(s.id,nums);for(let i=0;i<nums.length;i++){const n=nums[i],entry=typeof batch[i]==='string'?{url:batch[i]}:batch[i],url=entry.url||entry.presigned_url;if(!url)throw Error('上传分片地址缺失');const r=await fetch(url,{method:'PUT',body:file.slice((n-1)*UPLOAD_PART_BYTES,Math.min(file.size,n*UPLOAD_PART_BYTES)),headers:entry.headers||{}});if(!r.ok)throw Error(`第 ${n} 片上传失败，请重试`);const etag=r.headers.get('ETag')||r.headers.get('etag');if(!etag)throw Error('MinIO 未返回 ETag，请检查桶的跨域配置');const part={part_number:n,etag:etag.replaceAll('"','')};done.set(n,part);localStorage.setItem(key,JSON.stringify({id:s.id,name:file.name,size:file.size,lastModified:file.lastModified,parts:[...done.values()]}));onProgress(Math.round(done.size/total*100))}}
 const result=await apiRequest(`/attachments/upload-sessions/${s.id}/complete`,{method:'POST',body:{parts:[...done.values()].sort((a,b)=>a.part_number-b.part_number)}});localStorage.removeItem(key);return result;
}
export const uploadAttachment=(file,onProgress,purpose='part_attachment')=>uploadFile(file,onProgress,MAX_ATTACHMENT_BYTES,purpose);
