import React, {useEffect, useRef, useState} from 'react';
import {apiRequest, list, ErrorBox, Badge, PageHead} from './ui.jsx';
import {bomActions, bomStates, flattenBom, parentCandidates, bomItemPayload} from './bom-edit.js';

export function BomsPage({navigate}) {
  const [rows,setRows] = useState([]), [selected,setSelected] = useState(null);
  const [loading,setLoading] = useState(true), [error,setError] = useState(null);
  async function load() {
    setLoading(true); setError(null);
    try { setRows(list(await apiRequest('/boms'))); } catch(e) { setError(e); } finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[]);
  return <div className="page"><PageHead eyebrow="产品结构 · EBOM" title="BOM 管理" desc="按版本查看结构，在草稿中维护子零件、数量和位号。"/>
    <div className="toolbar"><button className="btn secondary" onClick={()=>void load()} disabled={loading}>刷新列表</button><button className="btn secondary" onClick={()=>navigate('jobs')}>导入导出</button></div>
    <ErrorBox error={error}/><section className="card table-wrap"><table><thead><tr><th>BOM 编号</th><th>名称</th><th>类型</th><th>版本数</th><th>操作</th></tr></thead><tbody>
      {loading?<tr><td colSpan="5" className="empty">加载中…</td></tr>:rows.map(row=><tr key={row.id}><td className="bom-number mono">{row.bom_code}</td><td>{row.name||'—'}</td><td>{row.bom_type}</td><td>{row.revisions?.length||0}</td><td><button className="row-action" onClick={()=>setSelected(row)}>打开结构</button></td></tr>)}
      {!loading&&!rows.length&&<tr><td colSpan="5" className="empty">暂无 BOM，可从导入导出创建结构。</td></tr>}
    </tbody></table></section>
    {selected&&<BomWorkspace key={selected.id} bomId={selected.id} close={()=>setSelected(null)}/>}
  </div>;
}

function BomWorkspace({bomId,close}) {
  const [bom,setBom]=useState(null), [rid,setRid]=useState(''), [revision,setRevision]=useState(null), [tree,setTree]=useState(null);
  const [loading,setLoading]=useState(true), [error,setError]=useState(null), [editor,setEditor]=useState(null);
  const [pending,setPending]=useState(null), [reason,setReason]=useState(''), [busy,setBusy]=useState(false);
  const [conflict,setConflict]=useState(false), [notice,setNotice]=useState('');
  const requestSeq=useRef(0);
  async function load(wanted=rid) {
    const seq=++requestSeq.current; setLoading(true); setError(null); setTree(null); setRevision(null);
    try {
      const b=await apiRequest(`/boms/${bomId}`);
      const id=wanted || b.revisions?.[0]?.id;
      const [r,t]=id?await Promise.all([apiRequest(`/bom-revisions/${id}`),apiRequest(`/bom-revisions/${id}/tree`)]):[null,null];
      if(seq!==requestSeq.current)return;
      if(r&&r.row_version!==t.row_version)throw Object.assign(new Error('结构正在被其他用户修改，请刷新后重试。'),{code:'CONCURRENT_MODIFICATION',status:412});
      setBom(b); setRid(id||''); setRevision(r); setTree(t); setConflict(false);
    } catch(e) { if(seq===requestSeq.current)failure(e); } finally { if(seq===requestSeq.current)setLoading(false); }
  }
  useEffect(()=>{void load();return()=>{requestSeq.current++;};},[bomId]);
  const rows=flattenBom(tree?.tree), canEdit=revision?.can_edit===true;
  function failure(e) {setError(e); if([409,412,428].includes(e.status)&&['CONCURRENT_MODIFICATION','PRECONDITION_REQUIRED'].includes(e.code||e.details?.code))setConflict(true);}
  async function save(payload,version,item) {
    setBusy(true); setError(null);
    try {await apiRequest(`/bom-revisions/${rid}/items${item?'/'+item.id:''}`,{method:item?'PATCH':'POST',rowVersion:version,body:payload});setEditor(null);setNotice('结构行已保存。');await load();}
    catch(e){failure(e);}finally{setBusy(false);}
  }
  async function confirmAction(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      if(pending.item) await apiRequest(`/bom-revisions/${rid}/items/${pending.item.id}/actions`,{method:'POST',rowVersion:pending.version,body:{action:'delete'}});
      else await apiRequest(`/bom-revisions/${rid}/actions`,{method:'POST',rowVersion:pending.version,body:{action:pending.action,reason},idempotencyKey:crypto.randomUUID()});
      setPending(null);setReason('');setNotice('操作已完成，结构已刷新。');await load();
    } catch(e){failure(e);} finally{setBusy(false);}
  }
  function beginEdit(item=null,parent='') {setError(null);setNotice('');setEditor({item,parent,version:tree.row_version});}
  return <section className="card bom-detail"><div className="card-head"><div><h2 className="bom-number">{bom?.bom_code||'BOM 结构'}</h2><p>{bom?.name}</p></div><button className="btn ghost" onClick={close} disabled={busy}>关闭结构</button></div>
    <div className="toolbar bom-toolbar"><label className="field"><span>结构版本</span><select value={rid} disabled={busy||loading||Boolean(editor)||Boolean(pending)} onChange={e=>{setNotice('');void load(e.target.value);}}>{bom?.revisions?.map(r=><option key={r.id} value={r.id}>{r.revision} · {bomStates[r.revision_state]||r.revision_state}</option>)}</select></label>
      {revision&&<Badge tone={revision.revision_state==='released'?'green':'blue'}>{bomStates[revision.revision_state]||revision.revision_state}</Badge>}
      <button className="btn secondary" disabled={busy||loading||Boolean(editor)||Boolean(pending)} onClick={()=>void load()}>刷新结构</button>
      {canEdit&&<button className="btn primary" disabled={busy||loading||Boolean(editor)||Boolean(pending)||!tree} onClick={()=>beginEdit()}>新增结构行</button>}
    </div>
    {revision&&<p className="muted">根零件 <span className="part-number">{revision.root_part_code}</span> · {revision.root_part_revision_code} · {canEdit?'草稿可编辑':'当前版本只读'}</p>}
    <ErrorBox error={error}/>{notice&&<p role="status" className="success-banner">{notice}</p>}
    {conflict&&<div className="notice" role="alert">结构已发生变化，未覆盖服务器数据。<button className="btn secondary" disabled={busy} onClick={()=>{setEditor(null);setPending(null);setNotice('');void load();}}>放弃本次编辑并加载最新结构</button></div>}
    {editor&&<BomRowEditor key={editor.item?.id||'new'} editor={editor} rows={rows} busy={busy||conflict} save={save} cancel={()=>setEditor(null)}/>}
    {pending&&<form className="bom-confirm" onSubmit={confirmAction}><h3>{pending.item?`删除行 ${pending.item.line_no} · ${pending.item.child_part_code}`:bomActions[pending.action]}</h3><p>{pending.item?'此操作删除当前草稿中的一行；含子行的结构需先调整子行。':'确认对当前 BOM 版本执行此操作。'}</p>
      {!pending.item&&<label className="field"><span>操作说明{['reject','withdraw'].includes(pending.action)?'（必填）':'（可选）'}</span><textarea value={reason} disabled={busy} required={['reject','withdraw'].includes(pending.action)} onChange={e=>setReason(e.target.value)}/></label>}
      <div className="bom-editor-actions"><button className="btn primary" disabled={busy||conflict}>确认{pending.item?'删除':bomActions[pending.action]}</button><button type="button" className="btn secondary" disabled={busy} onClick={()=>setPending(null)}>取消</button></div>
    </form>}
    {!editor&&!pending&&revision?.allowed_actions?.length>0&&<div className="toolbar bom-toolbar">{revision.allowed_actions.filter(a=>bomActions[a]).map(a=><button key={a} className="btn secondary" disabled={busy||loading||!tree} onClick={()=>{setReason('');setError(null);setPending({action:a,version:revision.row_version});}}>{bomActions[a]}</button>)}</div>}
    {loading?<p className="empty">加载结构中…</p>:tree?<div className="bom-tree"><div className="tree-summary"><strong>{tree.node_count} 行</strong><span className="muted">数量保留至 6 位小数 · 子件固定到已发布版本</span></div><div className="bom-tree-scroll">{tree.tree.map(node=><BomNode key={node.id} node={node} canEdit={canEdit&&!editor&&!pending&&!conflict} busy={busy} edit={beginEdit} remove={item=>{setError(null);setPending({item,version:tree.row_version});}}/>)}</div>{!tree.node_count&&<p className="empty">当前版本暂无结构行。</p>}</div>:!error&&<p className="empty">当前 BOM 尚无版本。</p>}
  </section>;
}

function BomNode({node,depth=0,canEdit,busy,edit,remove}) {
  const [open,setOpen]=useState(true), children=node.children||[];
  return <div className="bom-node" style={{'--bom-depth':depth}}><div className="bom-node-row">
    {children.length?<button className="tree-toggle" aria-expanded={open} aria-label={`${open?'折叠':'展开'}行 ${node.line_no}`} onClick={()=>setOpen(!open)}>{open?'−':'+'}</button>:<span className="tree-spacer"/>}
    <span className="mono muted">{node.line_no}</span><strong className="part-number">{node.child_part_code}</strong><span className="rev">{node.child_revision}</span><span>{node.child_name}</span>
    <span className="bom-node-meta">{node.quantity} {node.unit_code} · {node.position==='__NO_POSITION__'?'无位号':node.position}</span>
    {canEdit&&<span className="bom-row-actions"><button className="row-action" disabled={busy} onClick={()=>edit(node)}>编辑行 {node.line_no}</button><button className="row-action" disabled={busy} onClick={()=>edit(null,node.id)}>加子行</button><button className="row-action" disabled={busy||children.length>0} title={children.length?'请先移除或移动子行':'删除该行'} onClick={()=>remove(node)}>删除</button></span>}
  </div>{open&&children.map(child=><BomNode key={child.id} node={child} depth={depth+1} canEdit={canEdit} busy={busy} edit={edit} remove={remove}/>)}</div>;
}

function BomRowEditor({editor,rows,busy,save,cancel}) {
  const item=editor.item, [form,setForm]=useState(()=>({line_no:item?.line_no||Math.max(0,...rows.map(r=>r.line_no))+10,child_part_revision:item?.child_part_revision||'',quantity:item?.quantity||'1',unit:item?.unit||'',parent_item:item?.parent_item||editor.parent||'',position:item?.position==='__NO_POSITION__'?'':item?.position||'',no_position_reason:item?.no_position_reason||''}));
  const [units,setUnits]=useState([]),[parts,setParts]=useState(item?[{id:item.child_part_revision,part_code:item.child_part_code,revision:item.child_revision,name:item.child_name,unit:item.unit}]:[]),[q,setQ]=useState(''),[error,setError]=useState(null),[searching,setSearching]=useState(false);
  useEffect(()=>{let alive=true;apiRequest('/units').then(r=>{if(alive)setUnits(list(r));}).catch(e=>alive&&setError(e));return()=>{alive=false;};},[]);
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  async function search() {setSearching(true);setError(null);try{const result=list(await apiRequest(`/parts?revision_state=released&q=${encodeURIComponent(q)}`)).flatMap(p=>(p.revisions||[]).filter(r=>r.revision_state==='released').map(r=>({...r,part_code:p.part_code})));setParts(current=>[...new Map([...current.filter(p=>String(p.id)===String(form.child_part_revision)),...result].map(p=>[p.id,p])).values()]);}catch(e){setError(e);}finally{setSearching(false);}}
  function submit(event){event.preventDefault();setError(null);try{const payload=bomItemPayload(form);void save(payload,editor.version,item);}catch(e){setError(e);}}
  return <form className="bom-editor" onSubmit={submit}><h3>{item?`编辑结构行 ${item.line_no}`:'新增结构行'}</h3><ErrorBox error={error}/><fieldset disabled={busy}><div className="form-grid">
    <label className="field"><span>行号</span><input type="number" min="1" max="2147483647" step="1" required value={form.line_no} onChange={e=>set('line_no',e.target.value)}/></label>
    <label className="field"><span>父行</span><select value={form.parent_item} onChange={e=>set('parent_item',e.target.value)}><option value="">根层级</option>{parentCandidates(rows,item?.id).map(row=><option key={row.id} value={row.id}>{'· '.repeat(row.depth)}{row.line_no} · {row.child_part_code}</option>)}</select></label>
    <div className="field wide"><label htmlFor="bom-part-query">搜索已发布子零件</label><div className="bom-search"><input id="bom-part-query" value={q} onChange={e=>setQ(e.target.value)} placeholder="零件号或名称"/><button type="button" className="btn secondary" disabled={searching} onClick={()=>void search()}>{searching?'查询中…':'查询'}</button></div></div>
    <label className="field wide"><span>子零件 / 固定版本</span><select required value={form.child_part_revision} onChange={e=>{const p=parts.find(p=>String(p.id)===e.target.value);setForm(current=>({...current,child_part_revision:e.target.value,unit:p?.unit||''}));}}><option value="">请选择已发布的子零件版本</option>{parts.map(p=><option key={p.id} value={p.id}>{p.part_code} · {p.revision} · {p.name}</option>)}</select><small>仅显示已发布版本；可输入零件号缩小检索范围。</small></label>
    <label className="field"><span>数量</span><input required inputMode="decimal" value={form.quantity} onChange={e=>set('quantity',e.target.value)}/></label>
    <label className="field"><span>计量单位</span><select required value={form.unit} onChange={e=>set('unit',e.target.value)}><option value="">选择单位</option>{units.map(u=><option key={u.id} value={u.id}>{u.code} · {u.name}</option>)}</select></label>
    <label className="field"><span>位号（如 R1、P1.1）</span><input maxLength="32" value={form.position} onChange={e=>set('position',e.target.value)}/></label>
    <label className="field"><span>无位号原因</span><input required={!form.position.trim()} disabled={Boolean(form.position.trim())} value={form.no_position_reason} onChange={e=>set('no_position_reason',e.target.value)}/></label>
  </div></fieldset><div className="bom-editor-actions"><button className="btn primary" disabled={busy||searching}>{busy?'保存中…':'保存结构行'}</button><button type="button" className="btn secondary" disabled={busy} onClick={cancel}>取消编辑</button></div></form>;
}
