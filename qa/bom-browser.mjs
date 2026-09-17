// Container-only browser regression. API fixtures isolate UI writes from lab data.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/tmp/browserqa/node_modules/playwright/index.mjs');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium-browser',args:['--no-sandbox']});
try {
  for(const width of [1366,1920]) {
    const page=await browser.newPage({viewport:{width,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    let version=1, rows=[], writes=0, stale=false, role='engineer';
    const revision=()=>({id:'rev1',revision:'A',revision_state:'draft',root_part_code:'010100001',root_part_revision_code:'A',row_version:version,can_edit:role==='engineer',allowed_actions:role==='engineer'?['submit']:[]});
    const bom=()=>({id:'bom1',bom_code:'BOM-000001',name:'结构编辑验证',bom_type:'EBOM',revisions:[revision()]});
    await page.route('**/api/v1/**',async route=>{
      const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,''),method=request.method();
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
      if(path.endsWith('/auth/csrf'))return reply({detail:'ok'});
      if(path.endsWith('/auth/me'))return reply({user:{username:'qa',role}});
      if(path.endsWith('/units'))return reply([{id:'unit1',code:'EA',name:'个'}]);
      if(path.endsWith('/parts'))return reply([{id:'part1',part_code:'010100002',revisions:[{id:'child1',revision:'A',name:'螺钉',revision_state:'released',unit:'unit1'}]}]);
      if(path.endsWith('/boms'))return reply([bom()]);
      if(path.endsWith('/boms/bom1'))return reply(bom());
      if(path.endsWith('/bom-revisions/rev1'))return reply(revision());
      if(path.endsWith('/tree'))return reply({row_version:version,node_count:rows.length,tree:rows.map(r=>({...r,children:[]}))});
      if(method==='POST'||method==='PATCH') {
        writes++; assert.equal(request.headers()['if-match'],String(version));
        if(stale){stale=false;version++;return reply({code:'CONCURRENT_MODIFICATION',detail:'结构已经变更'},412);}
        const body=request.postDataJSON();
        if(path.endsWith('/items')&&method==='POST')rows.push({...body,id:'row1',child_part_code:'010100002',child_revision:'A',child_name:'螺钉',unit_code:'EA'});
        else if(method==='PATCH')rows=rows.map(r=>({...r,...body}));
        else if(path.endsWith('/row1/actions'))rows=[];
        else throw Error(`Unexpected write ${path}`);
        version++;return reply(rows[0]||{});
      }
      throw Error(`Unexpected API ${method} ${path}`);
    });
    await page.goto('http://127.0.0.1:4173/#boms');
    await page.getByRole('button',{name:'打开结构'}).click();
    await page.getByRole('button',{name:'新增结构行'}).click();
    await page.getByLabel('搜索已发布子零件').fill('010100002');
    await page.getByRole('button',{name:'查询',exact:true}).click();
    await page.getByLabel('子零件 / 固定版本').selectOption('child1');
    await page.getByLabel('数量',{exact:true}).fill('2.123456');
    await page.getByLabel('位号（如 R1、P1.1）',{exact:true}).fill('P1.1');
    await page.getByRole('button',{name:'保存结构行'}).click();
    await page.getByRole('button',{name:'编辑行 10',exact:true}).waitFor();
    assert.equal(rows[0].quantity,'2.123456');assert.equal(writes,1);
    await page.getByRole('button',{name:'编辑行 10',exact:true}).click();
    await page.getByLabel('数量',{exact:true}).fill('3');stale=true;
    await page.getByRole('button',{name:'保存结构行'}).click();
    await page.getByRole('button',{name:'放弃本次编辑并加载最新结构'}).waitFor();
    assert.equal(rows[0].quantity,'2.123456');
    await page.getByRole('button',{name:'放弃本次编辑并加载最新结构'}).click();
    await page.getByRole('button',{name:'编辑行 10',exact:true}).click();
    await page.getByLabel('数量',{exact:true}).fill('3');
    await page.getByRole('button',{name:'保存结构行'}).click();
    await page.getByRole('button',{name:'编辑行 10',exact:true}).waitFor();
    assert.equal(rows[0].quantity,'3');
    await page.screenshot({path:`/tmp/bom-workspace-${width}.png`,fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.getByRole('button',{name:'删除',exact:true}).click();
    await page.getByRole('button',{name:'确认删除',exact:true}).click();
    await page.getByText('当前版本暂无结构行。').waitFor();assert.equal(rows.length,0);
    role='viewer';await page.reload();await page.getByRole('button',{name:'打开结构'}).click();
    await page.getByText('当前版本只读',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'新增结构行'}).count(),0);
    assert.equal(await page.getByRole('button',{name:'提交审核',exact:true}).count(),0);
    assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width}: create, edit, conflict, delete, read-only role, no overflow`);
  }
  const detail=await browser.newPage();let action=null;
  await detail.route('**/api/v1/**',route=>{
    const path=new URL(route.request().url()).pathname,request=route.request();let data={};
    if(path.includes('/auth/me'))data={user:{username:'publisher',role:'publisher'}};
    else if(path.includes('/actions/')){action=request.postDataJSON().action;assert.equal(request.headers()['if-match'],'4');}
    else if(path.includes('/timeline/'))data=[];
    else if(path.includes('/parts/part1/'))data={id:'part1',part_code:'0101-00001',revisions:[{id:'r1',revision:'A',revision_seq:1,revision_state:'release_pending',allowed_actions:['release'],row_version:4}]};
    return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  await detail.goto('http://127.0.0.1:4173/#parts/part1');await detail.getByRole('button',{name:'发布',exact:true}).click();
  await detail.waitForResponse(r=>r.url().includes('/timeline/'));assert.equal(action,'release');await detail.close();
  console.log('PASS Part release button sends release action');
  for(const role of ['viewer','reviewer','publisher','engineer','sysadmin']){
    const jobs=await browser.newPage();
    await jobs.route('**/api/v1/**',route=>{
      const path=new URL(route.request().url()).pathname;
      const data=path.includes('/auth/me')?{user:{username:'qa',role}}:path.includes('/imports/')?[{id:'j1',status:'awaiting_confirmation'}]:[];
      return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
    });
    await jobs.goto('http://127.0.0.1:4173/#jobs');await jobs.getByRole('heading',{name:'导入导出任务'}).waitFor();
    await jobs.getByText('待确认',{exact:true}).waitFor();
    assert.equal(await jobs.getByRole('button',{name:'确认提交',exact:true}).count(),role==='engineer'?1:0);
    assert.equal(await jobs.getByRole('button',{name:'创建导出',exact:true}).count(),role==='sysadmin'?0:1);await jobs.close();
  }
  console.log('PASS import/export action visibility for five roles');
} finally {await browser.close();}
