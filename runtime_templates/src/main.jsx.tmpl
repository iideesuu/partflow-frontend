import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {apiRequest} from './api.js';
import {Field, ErrorBox} from './ui.jsx';
import {WorkbenchPage, PartsPage} from './part-search.jsx';
import {NewPartPage} from './part-editor.jsx';
import {PartDetailPage} from './part-detail.jsx';
import {AuditPage, AdminPage, JobsPage, BomsPage} from './management.jsx';
import './styles.css';

const roleLabels = {viewer:'查看者',engineer:'工程师',reviewer:'审核员',publisher:'发布员',auditor:'审计员',sysadmin:'系统管理员',admin:'管理员'};
const routeValue = () => location.hash.slice(1) || 'workbench';
function Login({onLogin, initialError}) {
  const [username,setUsername] = useState(''), [password,setPassword] = useState('');
  const [error,setError] = useState(null), [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try { const response = await apiRequest('/auth/login',{method:'POST',body:{username,password}}); onLogin(response.user || response); }
    catch (error) { setError(error); } finally { setBusy(false); }
  }
  return <main className="login-page"><form className="card login-card" onSubmit={submit}>
    <div className="brand center"><div className="brand-mark">P</div><div><b>PartFlow PLM</b><span>PRODUCT LIFECYCLE MANAGEMENT</span></div></div>
    <h1>登录研发物料平台</h1><p className="muted">使用已授权的 LDAP 或本地账号</p><ErrorBox error={error||initialError}/>
    <Field label="账号"><input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/></Field>
    <Field label="密码"><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></Field>
    <button className="btn primary full" disabled={busy}>{busy?'登录中…':'登录'}</button>
  </form></main>;
}
class PageBoundary extends React.Component {
  state = {error:null};
  static getDerivedStateFromError(error) { return {error}; }
  render() {
    if (this.state.error) return <section className="page"><h1>页面暂时无法显示</h1>
      <ErrorBox error={this.state.error}/><button className="btn secondary" onClick={()=>this.setState({error:null})}>重试页面</button></section>;
    return this.props.children;
  }
}
function App() {
  const [user,setUser] = useState(null), [checking,setChecking] = useState(true);
  const [route,setRoute] = useState(routeValue), [open,setOpen] = useState(false), [error,setError] = useState(null);
  useEffect(()=>{const changed=()=>setRoute(routeValue()); window.addEventListener('hashchange',changed); return ()=>window.removeEventListener('hashchange',changed);},[]);
  useEffect(()=>{let alive=true; (async()=>{try {
    await apiRequest('/auth/csrf'); const response=await apiRequest('/auth/me'); if(alive)setUser(response.user||response);
  }catch(error){if(alive&&error.status!==401&&error.status!==403)setError(error);}finally{if(alive)setChecking(false);}})(); return ()=>{alive=false};},[]);
  const navigate = target => {setOpen(false); location.hash=target==='uploads'?'jobs':target; setRoute(routeValue());};
  const openPart = part => navigate('parts/'+part.id+(part.selected_revision_id?'?revision='+part.selected_revision_id:''));
  if (checking) return <div className="loading-screen">加载 PartFlow…</div>;
  if (!user) return <Login onLogin={setUser} initialError={error}/>;
  const role=user.role, page=route.split('?')[0], isAdmin=role==='admin'||role==='sysadmin';
  if (!role) return <NoRolePage user={user} onLogout={async()=>{try{await apiRequest('/auth/logout',{method:'POST',body:{}});}finally{setUser(null);}}}/>;
  const auditAllowed=['admin','reviewer','publisher','auditor','sysadmin'].includes(role);
  const nav=[['workbench','工作台','⌂'],['parts','物料与零件','▦'],['boms','BOM 管理','⌘'],['jobs','导入导出','↥'],['approvals','审核与发布','✓']];
  let content;
  if(page==='workbench') content=<WorkbenchPage user={user} navigate={navigate} openPart={openPart}/>;
  else if(page==='parts') content=<PartsPage user={user} navigate={navigate} openPart={openPart}/>;
  else if(page==='new') content=<NewPartPage user={user} navigate={navigate} openPart={openPart}/>;
  else if(page.startsWith('parts/')) content=<PartDetailPage partId={page.slice(6)} user={user} navigate={navigate}/>;
  else if(page==='boms') content=<BomsPage user={user} navigate={navigate}/>;
  else if(page==='jobs'||page==='uploads') content=<JobsPage user={user}/>;
  else if(page==='approvals') content=<PartsPage user={user} navigate={navigate} openPart={openPart} reviewOnly/>;
  else if(page==='admin'&&isAdmin) content=<AdminPage navigate={navigate}/>;
  else if(page==='audit'&&auditAllowed) content=<AuditPage/>;
  else content=<section className="page"><h1>页面不存在或当前角色无权访问</h1><button className="btn secondary" onClick={()=>navigate('workbench')}>返回工作台</button></section>;
  async function logout(){try{await apiRequest('/auth/logout',{method:'POST',body:{}});setUser(null);}catch(error){setError(error);}}
  return <div className="app">
    <aside className={open?'open':''}><div className="brand"><div className="brand-mark">P</div><div><b>PartFlow</b><span>PLM PLATFORM</span></div></div>
      <div className="tenant"><span className="tenant-dot"/>研发中心 <small>V1.6</small></div>
      <nav aria-label="主导航"><div className="nav-label">零件与产品结构</div>
        {nav.map(([id,label,icon])=><button key={id} className={page===id||(id==='parts'&&(page==='new'||page.startsWith('parts/')))?'active':''} onClick={()=>navigate(id)}><strong>{icon}</strong>{label}</button>)}
        {(isAdmin||auditAllowed)&&<div className="nav-label">管理与追溯</div>}
        {isAdmin&&<button className={page==='admin'?'active':''} onClick={()=>navigate('admin')}><strong>⚙</strong>分类与单位管理</button>}
        {auditAllowed&&<button className={page==='audit'?'active':''} onClick={()=>navigate('audit')}><strong>◌</strong>审计中心</button>}
      </nav>
      <div className="aside-bottom"><div className="user"><div className="avatar">{(user.username||'U').slice(0,1).toUpperCase()}</div>
        <div><b>{user.display_name||user.username}</b><span>{roleLabels[role]||role}</span></div><button aria-label="退出登录" onClick={logout}>↪</button></div></div>
    </aside>
    <main><header><button className="menu-btn" aria-label="打开导航" onClick={()=>setOpen(!open)}>☰</button>
      <div className="breadcrumbs"><span>PartFlow</span><b>/</b><strong>研发 PLM</strong></div><div className="header-actions">{user.username}</div></header>
      <ErrorBox error={error}/><PageBoundary key={page}>{content}</PageBoundary>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);

function NoRolePage({user,onLogout}) {
  return <main className="login-page"><section className="card login-card">
    <div className="brand center"><div className="brand-mark">P</div><div><b>PartFlow PLM</b><span>PRODUCT LIFECYCLE MANAGEMENT</span></div></div>
    <h1>等待分配 PLM 角色</h1>
    <p className="muted">LDAP 登录已成功（{user.display_name||user.username}），但当前账号尚未分配本地业务角色。</p>
    <p className="muted">请联系 PLM 系统管理员在“管理中心 → 用户与角色”中分配角色。分配完成后重新登录即可生效。</p>
    <button className="btn secondary full" onClick={onLogout}>退出登录</button>
  </section></main>;
}
