import React, {useEffect, useMemo, useRef, useState} from 'react';
import {apiRequest, endpoints} from './api.js';
import {Badge, ErrorBox, Field, PageHead, list} from './ui.jsx';

const STATES = [['draft','草稿'],['pending_review','待审核'],['approved','已批准 / 待发布'],['released','已发布'],['obsolete','已废止']];
const LIFECYCLES = [['active','活动'],['development','开发中'],['frozen','冻结'],['obsolete','废止']];
const KINDS = [['standard','标准件'],['assembly','装配件'],['manufactured','自制件'],['raw','原材料'],['purchased','外购件']];
const BLANK = {q:'',major_code:'',minor_code:'',kind:'',lifecycle:'',revision_state:'',manufacturer:'',manufacturer_part_number:'',standard_code:'',material:'',is_customized:'',rohs_standard:''};
const label = (items, value) => items.find(([key]) => key === value)?.[1] || value || '—';
const date = value => value ? new Date(value).toLocaleString('zh-CN') : '—';
const roleOf = user => user?.role || user?.user?.role || 'viewer';
const queryOf = filters => new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')).toString();
const revisionsOf = part => [...(part.revisions || [])].sort((a,b) => Number(b.revision_seq) - Number(a.revision_seq));
const latestOf = part => revisionsOf(part)[0] || {};

function initialFilters(reviewOnly, role) {
  const defaults = {...BLANK, revision_state: reviewOnly ? (role === 'publisher' ? 'approved' : 'pending_review') : ''};
  const route = location.hash.slice(1).split('?')[0];
  if (route !== (reviewOnly ? 'approvals' : 'parts')) return defaults;
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  Object.keys(BLANK).forEach(key => { if (params.has(key)) defaults[key] = params.get(key); });
  return defaults;
}

function Choice({title, value, onChange, choices, disabled = false}) {
  return <Field label={title}>
    <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">全部</option>
      {choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </Field>;
}

function SearchFields({filters, setFilters, categories, compact = false}) {
  const set = (key, value) => setFilters(current => ({...current, [key]: value}));
  const majors = [...new Map(categories.map(category => [category.major_code,
    [category.major_code, `${category.major_code} · ${category.major_name || category.parent_name ||
      categories.find(parent => parent.major_code === category.major_code && parent.minor_code === '00')?.name || '未命名大类'}`]
  ])).values()];
  const minors = categories.filter(category => category.major_code === filters.major_code && category.minor_code !== '00');
  return <div className="form-grid">
    <Field label="关键词" wide>
      <input value={filters.q} onChange={event => set('q', event.target.value)}
        placeholder="搜索物料号、名称、制造商料号、标准号、材料、描述与技术参数" />
    </Field>
    <Choice title="大类" value={filters.major_code} choices={majors}
      onChange={value => setFilters(current => ({...current, major_code: value, minor_code: ''}))} />
    <Choice title="小类" value={filters.minor_code} disabled={!filters.major_code}
      choices={minors.map(category => [category.minor_code, `${category.minor_code} · ${category.name}`])}
      onChange={value => set('minor_code', value)} />
    <Choice title="零件类型" value={filters.kind} choices={KINDS} onChange={value => set('kind', value)} />
    <Choice title="生命周期" value={filters.lifecycle} choices={LIFECYCLES} onChange={value => set('lifecycle', value)} />
    {!compact && <>
      <Choice title="版本状态" value={filters.revision_state} choices={STATES} onChange={value => set('revision_state', value)} />
      <Choice title="是否定制" value={filters.is_customized} choices={[["true","是"],["false","否"]]}
        onChange={value => set('is_customized', value)} />
      {[
        ['manufacturer','制造商'], ['manufacturer_part_number','制造商料号'],
        ['standard_code','标准号'], ['material','材料'], ['rohs_standard','RoHS 标准'],
      ].map(([key, title]) => <Field label={title} key={key}>
        <input value={filters[key]} onChange={event => set(key, event.target.value)} placeholder={`包含${title}`} />
      </Field>)}
    </>}
  </div>;
}

function PartTable({parts, categories, openPart, loading, stateFilter = '', compact = false}) {
  return <div className="table-wrap"><table>
    <thead><tr><th>物料号</th><th>名称 / 类型</th><th>分类</th><th>版本 / 状态</th>
      {!compact && <><th>生命周期</th><th>标准号 / 材料</th><th>制造商料号</th></>}
      <th>更新时间</th><th>操作</th>
    </tr></thead>
    <tbody>
      {loading ? <tr><td colSpan={compact ? 6 : 9} className="empty">正在加载零件…</td></tr> :
        parts.map(part => {
          const revision = revisionsOf(part).find(item => !stateFilter || item.revision_state === stateFilter) || latestOf(part);
          const category = categories.find(item => `${item.major_code}${item.minor_code}` === part.category_code);
          return <tr key={part.id}>
            <td className="mono strong">{part.part_code}</td>
            <td><b>{revision.name || '未命名'}</b><div className="muted">{label(KINDS, revision.kind)}</div></td>
            <td>{category?.name || part.category_code || '—'}<div className="muted mono">{category ? part.category_code : ''}</div></td>
            <td><span className="rev">{revision.revision || '—'}</span><div>
              <Badge tone={revision.revision_state === 'released' ? 'green' : revision.revision_state === 'obsolete' ? 'red' : 'blue'}>
                {label(STATES, revision.revision_state)}
              </Badge>
            </div></td>
            {!compact && <>
              <td>{label(LIFECYCLES, revision.business_lifecycle)}</td>
              <td>{revision.standard_code || '—'}<div className="muted">{revision.material || '—'}</div></td>
              <td>{revision.manufacturer_part_number || '—'}<div className="muted">{revision.manufacturer || ''}</div></td>
            </>}
            <td className="muted">{date(part.updated_at)}</td>
            <td><button className="row-action" onClick={() => openPart(part)}>查看 →</button></td>
          </tr>;
        })}
      {!loading && !parts.length && <tr><td colSpan={compact ? 6 : 9} className="empty">暂无匹配的零件。</td></tr>}
    </tbody>
  </table></div>;
}

export function PartsPage({user, navigate, openPart, reviewOnly = false}) {
  const role = roleOf(user);
  const [filters, setFilters] = useState(() => initialFilters(reviewOnly, role));
  const [applied, setApplied] = useState(() => initialFilters(reviewOnly, role));
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [serverMore, setServerMore] = useState(false);
  const pageSize = 25;
  const query = queryOf(applied);
  const canEdit = ['admin','engineer'].includes(role);

  useEffect(() => {
    let alive = true;
    apiRequest(endpoints.categories).then(result => alive && setCategories(list(result)))
      .catch(problem => alive && setError(problem.message));
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    apiRequest(`${endpoints.parts}${query ? `?${query}` : ''}`)
      .then(result => {
        if (!alive) return;
        setRows(list(result));
        setTotal(result.count ?? list(result).length);
        setServerMore(Boolean(result.next));
        setPage(1);
      })
      .catch(problem => alive && setError(problem.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query, refresh]);

  function apply(next = filters) {
    setFilters(next);
    setApplied({...next});
    setRefresh(value => value + 1);
    const query = queryOf(next);
    history.replaceState(null, '', `#${reviewOnly ? 'approvals' : 'parts'}${query ? `?${query}` : ''}`);
  }

  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  return <div className="page">
    <PageHead eyebrow={reviewOnly ? '版本审批' : '零件与版本'} title={reviewOnly ? '审核中心' : '物料与零件'}
      desc={reviewOnly ? '检索待审核或待发布版本，打开零件详情查看工程属性、图纸和历史，再执行审核。' : '按分类、工程属性与版本状态检索零件，支持搜索技术参数和历史版本。'} />
    <div className="toolbar">
      {canEdit && <button className="btn primary" onClick={() => navigate('new')}>＋ 新建零件 / 取号</button>}
      <button className="btn secondary" onClick={() => navigate('uploads')}>导入 / 导出</button>
      <button className="btn secondary" onClick={() => setRefresh(value => value + 1)} disabled={loading}>刷新列表</button>
    </div>
    <form className="card form-card" onSubmit={event => { event.preventDefault(); apply(); }}>
      <div className="card-head"><div><h2>高级检索</h2><span className="muted">筛选条件保留在页面地址中。</span></div></div>
      <SearchFields filters={filters} setFilters={setFilters} categories={categories} />
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={() => apply({...BLANK, revision_state: reviewOnly ? (role === 'publisher' ? 'approved' : 'pending_review') : ''})}>重置筛选</button>
        <button className="btn primary" disabled={loading}>{loading ? '查询中…' : '查询物料'}</button>
      </div>
    </form>
    <ErrorBox error={error} />
    <section className="card">
      <div className="card-head"><div><h2>检索结果</h2><span className="muted">共 {total} 个零件；工程属性可能匹配历史版本，详情可查看全部版本。</span></div></div>
      <PartTable parts={visible} categories={categories} openPart={openPart} loading={loading} stateFilter={applied.revision_state} />
      <div className="table-footer">
        <span className="muted">第 {page} / {pages} 页，每页 {pageSize} 条{serverMore ? '（当前为服务端首批结果，请缩小筛选范围）' : ''}</span>
        <div className="toolbar">
          <button className="btn secondary tiny" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>上一页</button>
          <button className="btn secondary tiny" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>下一页</button>
        </div>
      </div>
    </section>
  </div>;
}

function Stat({label: title, value, tone, icon, hint}) {
  return <div className="stat"><div className={`stat-icon ${tone}`}>{icon}</div><div>
    <span className="stat-label">{title}</span><div className="stat-value">{value ?? '—'}</div><span className="stat-hint">{hint}</span>
  </div></div>;
}

export function WorkbenchPage({user, navigate, openPart}) {
  const role = roleOf(user);
  const canEdit = ['admin','engineer'].includes(role);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({parts:null,boms:null,pending:null,tasks:null});
  const [filters, setFilters] = useState({...BLANK});
  const [searchRows, setSearchRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const searchId = useRef(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const requests = [
      ['parts', endpoints.parts], ['categories', endpoints.categories], ['boms', endpoints.boms],
      ['imports', endpoints.imports], ['exports', endpoints.exports],
    ];
    Promise.allSettled(requests.map(([,path]) => apiRequest(path))).then(results => {
      if (!alive) return;
      const data = {};
      const failures = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') data[requests[index][0]] = result.value;
        else if (result.reason.status !== 403) failures.push(result.reason.message);
      });
      const allParts = list(data.parts);
      const allJobs = [...list(data.imports).map(job => ({...job, direction:'导入'})), ...list(data.exports).map(job => ({...job, direction:'导出'}))];
      setParts(allParts);
      setCategories(list(data.categories));
      setJobs(allJobs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      setCounts({
        parts: data.parts ? (data.parts.count ?? allParts.length) : null,
        boms: data.boms ? (data.boms.count ?? list(data.boms).length) : null,
        pending: data.parts ? allParts.reduce((sum,part) => sum + (part.revisions || []).filter(revision => ['pending_review','approved'].includes(revision.revision_state)).length, 0) : null,
        tasks: data.imports || data.exports ? allJobs.filter(job => ['queued','running','processing'].includes(job.status)).length : null,
      });
      setError([...new Set(failures)].join('；'));
      setLoading(false);
    });
    return () => { alive = false; searchId.current++; };
  }, [refresh]);

  async function search(event) {
    event.preventDefault();
    const id = ++searchId.current;
    setSearching(true);
    setError('');
    try {
      const query = queryOf(filters);
      const result = await apiRequest(`${endpoints.parts}${query ? `?${query}` : ''}`);
      if (id === searchId.current) setSearchRows(list(result));
    } catch (problem) { if (id === searchId.current) setError(problem.message); }
    finally { if (id === searchId.current) setSearching(false); }
  }

  const recent = useMemo(() => [...parts].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0,8), [parts]);
  const pending = parts.filter(part => (part.revisions || []).some(revision => ['pending_review','approved'].includes(revision.revision_state))).slice(0,5);
  return <div className="page">
    <PageHead eyebrow="PLM · 研发工作台" title={`你好，${user?.display_name || user?.username || '同事'}`}
      desc="从物料检索、编号申请到版本审核，集中处理研发零件的日常工作。" />
    <div className="toolbar">
      {canEdit && <button className="btn primary" onClick={() => navigate('new')}>＋ 取号并新建零件</button>}
      <button className="btn secondary" onClick={() => navigate('parts')}>全部零件</button>
      <button className="btn secondary" onClick={() => navigate('boms')}>BOM 管理</button>
      <button className="btn secondary" onClick={() => setRefresh(value => value + 1)} disabled={loading}>刷新工作台</button>
    </div>
    <div className="stats">
      <Stat label="物料总数" value={counts.parts} tone="blue" icon="▦" hint="PLM 零件主数据" />
      <Stat label="产品 BOM" value={counts.boms} tone="purple" icon="⌘" hint="产品结构数量" />
      <Stat label="待审核 / 待发布版本" value={counts.pending} tone="green" icon="✓" hint="已提交或已批准的版本" />
      <Stat label="执行中任务" value={counts.tasks} tone="amber" icon="↥" hint="排队或执行中的导入导出" />
    </div>
    <ErrorBox error={error} />
    <form className="card form-card" onSubmit={search}>
      <div className="card-head"><div><h2>搜索物料</h2><span className="muted">分类与关键词组合检索，可搜索版本参数。</span></div></div>
      <SearchFields filters={filters} setFilters={setFilters} categories={categories} compact />
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={() => { setFilters({...BLANK}); setSearchRows(null); }}>重置</button>
        <button className="btn primary" disabled={searching}>{searching ? '查询中…' : '搜索物料'}</button>
      </div>
    </form>
    <section className="card">
      <div className="card-head"><div><h2>{searchRows === null ? '最近更新的零件' : '搜索结果'}</h2>
        <span className="muted">{searchRows === null ? '按更新时间展示最近 8 条' : `匹配 ${searchRows.length} 条，显示前 25 条`}</span>
      </div><button className="link" onClick={() => navigate('parts')}>高级检索 →</button></div>
      <PartTable parts={searchRows === null ? recent : searchRows.slice(0,25)} categories={categories}
        openPart={openPart} loading={loading || searching} compact />
    </section>
    <div className="grid-2">
      <section className="card">
        <div className="card-head"><div><h2>待审核与待发布</h2><span className="muted">打开详情查看对应版本</span></div>
          <button className="link" onClick={() => navigate('approvals')}>审核中心 →</button></div>
        <div className="todo-list">
          {pending.map(part => <div className="todo" key={part.id}><div className="todo-icon amber">✓</div><div>
            <b>{part.part_code} · {latestOf(part).name}</b><span>{(part.revisions || []).filter(revision => ['pending_review','approved'].includes(revision.revision_state)).map(revision => `${revision.revision} ${label(STATES,revision.revision_state)}`).join('、')}</span>
          </div><button className="row-action" onClick={() => openPart(part)}>查看</button></div>)}
          {!pending.length && <div className="empty">{loading ? '正在加载…' : '暂无待审核或待发布版本'}</div>}
        </div>
      </section>
      <section className="card">
        <div className="card-head"><div><h2>最近导入导出</h2><span className="muted">任务状态来自后台执行记录</span></div>
          <button className="link" onClick={() => navigate('uploads')}>任务中心 →</button></div>
        <div className="todo-list">
          {jobs.slice(0,5).map(job => <div className="todo" key={`${job.direction}-${job.id}`}><div className="todo-icon blue">↥</div><div>
            <b>{({part:'零件',category:'分类',bom:'BOM'})[job.kind] || job.kind} {job.direction}</b>
            <span>{({queued:'排队中',running:'执行中',processing:'执行中',dry_run:'预检完成',completed:'已完成',failed:'失败',cancelled:'已取消'})[job.status] || job.status} · {date(job.created_at)}</span>
          </div></div>)}
          {!jobs.length && <div className="empty">{loading ? '正在加载…' : '暂无可查看的任务记录'}</div>}
        </div>
      </section>
    </div>
  </div>;
}
