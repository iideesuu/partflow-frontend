import React,{useEffect,useState} from 'react';
import {apiRequest} from './api.js';
export {apiRequest};
export const list=x=>Array.isArray(x?.results)?x.results:Array.isArray(x)?x:[];
export function Field({label,children,wide=false}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}
export function ErrorBox({error}){return error?<div className="error-banner">{error?.message||String(error)}</div>:null}
export function Badge({children,tone='gray'}){return <span className={'badge '+tone}><i/>{children}</span>}
export function PageHead({eyebrow,title,desc}){return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div></div>}
export function useData(path,refresh=0){const[data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[reload,setReload]=useState(0);useEffect(()=>{let alive=true;setLoading(true);setError(null);apiRequest(path).then(x=>alive&&setData(x)).catch(x=>alive&&setError(x)).finally(()=>alive&&setLoading(false));return()=>{alive=false}},[path,refresh,reload]);return {data,loading,error,refresh:()=>setReload(v=>v+1)}}
export async function uploadFile(file,onProgress=()=>{},maxBytes=5*1024*1024){
  if(!file||file.size<=0)throw Error('请选择非空文件');
  if(file.size>maxBytes)throw Error(maxBytes>5*1024*1024?'附件不能超过 5 GiB':'结构化导入文件不能超过 5 MiB');
  const s=await apiRequest('/attachments/upload-sessions',{method:'POST',body:{filename:file.name,size:file.size,content_type:file.type||'application/octet-stream'}});
  const urls=s.part_urls||[],ps=64*1024*1024,parts=[];
  if(urls.length!==Math.ceil(file.size/ps))throw Error('上传分片配置不一致，请重新上传');
  for(let i=0;i<urls.length;i++){
    const r=await fetch(urls[i],{method:'PUT',body:file.slice(i*ps,Math.min(file.size,(i+1)*ps))});
    if(!r.ok)throw Error('MinIO 上传失败，请重新尝试');
    const etag=r.headers.get('ETag');
    if(!etag)throw Error('MinIO 未返回可读取的 ETag，请检查桶的跨域配置');
    parts.push({part_number:i+1,etag:etag.replaceAll('"','')});onProgress(Math.round((i+1)/urls.length*100));
  }
  return apiRequest(`/attachments/upload-sessions/${s.id}/complete`,{method:'POST',body:{parts}});
}
