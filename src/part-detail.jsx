import React,{useEffect,useState} from 'react';
import {apiRequest} from './api.js';
import {Badge,ErrorBox,PageHead,uploadAttachment} from './ui.jsx';

const arr=x=>Array.isArray(x?.results)?x.results:(Array.isArray(x)?x:[]);
const dt=x=>x?new Date(x).toLocaleString():'—';

export function PartDetailPage({partId,navigate,user}){
  const [part,setPart]=useState(null),[where,setWhere]=useState([]),[events,setEvents]=useState([]),[tab,setTab]=useState('overview'),[error,setError]=useState(null),[busy,setBusy]=useState(false),[attachment,setAttachment]=useState(null),[uploadProgress,setUploadProgress]=useState(0),[uploading,setUploading]=useState(false);
  const load=async()=>{setError(null);try{const [p,w,t]=await Promise.all([apiRequest(`/parts/${partId}`),apiRequest(`/parts/${partId}/where-used`),apiRequest(`/parts/${partId}/timeline`)]);setPart(p);setWhere(arr(w));setEvents(arr(t));}catch(e){setError(e)}};
  useEffect(()=>{void load()},[partId]);
  const revs=part?.revisions||[], latest=revs[revs.length-1];
  const transition=async state=>{if(!latest)return;setBusy(true);try{await apiRequest(`/parts/${partId}/revisions/${latest.id}/transition`,{method:'POST',body:{state},rowVersion:latest.row_version,idempotencyKey:crypto.randomUUID()});await load()}catch(e){setError(e)}finally{setBusy(false)}};
  const attach=async()=>{if(!attachment||!latest)return;setUploading(true);setError(null);try{const session=await uploadAttachment(attachment,setUploadProgress,'part_attachment');await apiRequest(`/parts/${partId}/attachments`,{method:'POST',body:{revision:latest.id,upload_session:session.id},idempotencyKey:crypto.randomUUID()});setAttachment(null);await load()}catch(e){setError(e)}finally{setUploading(false)}};
  if(!part&&!error)return <div className="page"><div className="empty-panel card">加载中…</div></div>;
  return <div className="page">
    <PageHead eyebrow="物料主数据 · 详情" title={part?.part_code||'物料详情'} desc={latest?.name||'—'}/>
    <div className="toolbar"><button className="btn secondary" onClick={()=>navigate('parts')}>← 返回列表</button>{latest?.revision_state==='draft'&&<button className="btn primary" disabled={busy} onClick={()=>transition('pending_review')}>提交审核</button>}{latest?.revision_state==='pending_review'&&<button className="btn primary" disabled={busy} onClick={()=>transition('approved')}>批准</button>}{latest?.revision_state==='approved'&&<button className="btn primary" disabled={busy} onClick={()=>transition('released')}>发布</button>}</div>
    <ErrorBox error={error}/>
    <div className="tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>主数据</button><button className={tab==='revisions'?'active':''} onClick={()=>setTab('revisions')}>Revision ({revs.length})</button><button className={tab==='where'?'active':''} onClick={()=>setTab('where')}>Where-Used ({where.length})</button><button className={tab==='timeline'?'active':''} onClick={()=>setTab('timeline')}>时间线</button><button className={tab==='attachments'?'active':''} onClick={()=>setTab('attachments')}>图纸与附件</button></div>
    {tab==='overview'&&<section className="card"><div className="detail-grid">{[['状态',part?.status],['Revision',latest?.revision],['类型',latest?.kind],['生命周期',latest?.business_lifecycle],['标准号',latest?.standard_code],['材料',latest?.material],['制造商',latest?.manufacturer],['制造商料号',latest?.manufacturer_part_number],['RoHS',latest?.rohs_standard],['是否定制',latest?.is_customized?'是':'否'],['单位',latest?.unit_code]].map(([k,v])=><div key={k}><span className="muted">{k}</span><b>{v||'—'}</b></div>)}</div><p>{latest?.description||'暂无描述'}</p></section>}
    {tab==='revisions'&&<section className="card"><table><thead><tr><th>Revision</th><th>状态</th><th>生命周期</th><th>附件数</th><th>创建时间</th></tr></thead><tbody>{revs.map(r=><tr key={r.id}><td className="mono strong">{r.revision}</td><td><Badge tone={r.revision_state==='released'?'green':'blue'}>{r.revision_state}</Badge></td><td>{r.business_lifecycle||'—'}</td><td>{r.attachment_count||0}</td><td>{dt(r.created_at)}</td></tr>)}</tbody></table></section>}
    {tab==='where'&&<section className="card"><table><thead><tr><th>BOM</th><th>Revision</th><th>行号</th><th>数量</th><th>位号</th></tr></thead><tbody>{where.map((r,i)=><tr key={r.id||i}><td>{r.bom_code||'—'}</td><td>{r.bom_revision||'—'}</td><td>{r.line_no||'—'}</td><td>{r.quantity||'—'}</td><td>{r.position||'—'}</td></tr>)}{!where.length&&<tr><td colSpan="5" className="empty">暂无上层 BOM 引用</td></tr>}</tbody></table></section>}
    {tab==='timeline'&&<section className="card timeline">{events.map((e,i)=><div className="timeline-item" key={e.id||i}><b>{e.action||'操作'}</b><span>{e.actor||'系统'} · {dt(e.created_at)}</span><p>{e.details?JSON.stringify(e.details):''}</p></div>)}{!events.length&&<div className="empty">暂无审计事件</div>}</section>}
    {tab==='attachments'&&<section className="card empty-panel"><h2>图纸与附件</h2><p>文件直传 MinIO 隔离桶，单文件协议上限 5 GiB；扫描通过后才能绑定。</p><div className="form-actions"><input type="file" onChange={e=>setAttachment(e.target.files?.[0]||null)} disabled={uploading||latest?.revision_state!=='draft'}/><button className="btn primary" disabled={!attachment||uploading||latest?.revision_state!=='draft'} onClick={()=>{void attach()}}>{uploading?`上传 ${uploadProgress}%`:'上传并绑定'}</button></div><button className="btn secondary" onClick={()=>navigate('jobs')}>前往文件中心</button></section>}
  </div>;
}
