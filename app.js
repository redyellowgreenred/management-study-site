(function(){
'use strict';
const {chapters,sources}=window.COURSE,M=window.OrgModels;
const pages=chapters.flatMap(ch=>ch.pages.map(p=>({...p,chapter:ch})));
const byId=new Map(pages.map((p,i)=>[p.id,{...p,index:i}]));
const main=document.querySelector('main'),sidebar=document.getElementById('sidebar');
const KEY='organization-math-v1';let storageOK=true,loaded={};
try{loaded=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{storageOK=false;}
const state={page:'start',done:{},notes:{},drafts:{},answers:{},labs:{},review:{},...loaded};
for(const key of ['done','notes','drafts','answers','labs','review'])if(!state[key]||typeof state[key]!=='object')state[key]={};
let active=0,reviewIndex=0,reviewReveal=false,weakOnly=false;
const math=s=>String(s).replaceAll('@',String.fromCharCode(92));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{if(storageOK){storageOK=false;warnStorage();}}}
function warnStorage(){if(!document.querySelector('.storage-warning')){const x=document.createElement('p');x.className='storage-warning';x.textContent='浏览器未允许保存本地数据。本次仍可学习，请及时导出笔记。';document.querySelector('.masthead').after(x);}}
function typeset(el){if(window.renderMathInElement)renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,trust:false,strict:'warn'});}
function questionPath(p){
 const ch=p.chapter;if(!ch.questions)return '';
 const q=p.question>=0?ch.questions[p.question]:null,map=ch.pages.find(x=>/-map$/.test(x.id));
 return '<div class="question-context"><p>总问题：'+ch.problem+'</p><span>'+(q?'第 '+(p.question+1)+' 问 / '+ch.questions.length+' · '+q.title:'先看情境和整章问题')+'</span>'+(map&&map.id!==p.id?'<button class="text-link" data-page="'+map.id+'">查看问题关系 →</button>':'')+'</div>';
}
function quizHTML(q,print=false){const a=state.answers[q.id],d=state.drafts[q.id]??a?.value??'';return '<section class="quiz" id="quiz-'+q.id+'"><form data-quiz="'+q.id+'"><fieldset><legend>'+q.prompt+'</legend>'+(q.numeric?'<label for="input-'+q.id+'">数值答案</label><br><input class="answer-input" id="input-'+q.id+'" name="value" type="number" step="any" inputmode="decimal" value="'+esc(d)+'" required>':q.options.map((o,i)=>'<label class="option"><input type="radio" name="value" value="'+i+'" '+(String(d)===String(i)?'checked':'')+' required><span>'+o+'</span></label>').join(''))+'</fieldset><button type="submit" class="primary">检查答案</button></form><div class="feedback '+(a?(a.correct?'correct':'wrong'):'')+'" aria-live="polite" '+(!a&&!print?'hidden':'')+'>'+(print?'<strong>答案：</strong>'+(q.numeric?String(Number(q.answer.toFixed(5))):q.options[q.answer])+'。'+q.explanation:a?'<strong>'+(a.correct?'正确。':'这次还不对。')+'</strong> '+q.explanation+'<p>已检查 '+a.tries+' 次。</p>':'')+'</div></section>';}
function renderSidebar(ch){
  const done=Object.keys(state.done).filter(id=>state.done[id]&&byId.has(id)).length;
  sidebar.innerHTML='<button data-page="start">课程首页</button>'+chapters.map(c=>'<button class="chapter-btn '+(ch?.id===c.id?'current':'')+'" data-page="'+c.pages[0].id+'">'+c.number+' '+c.title.split('：')[0]+'</button>'+(ch?.id===c.id?'<nav class="steps" aria-label="本章页码">'+sidebarSteps(c)+'</nav>':'')).join('')+'<div class="sidebar-meta">已标记完成 '+done+' / '+pages.length+' 页<progress value="'+done+'" max="'+pages.length+'" aria-label="已标记完成页数"></progress><p>键盘 ← → 翻页</p></div>';
}
function sidebarSteps(ch){
 let previous=null;return ch.pages.map((p,i)=>{
  const group=p.question??-1;
  const heading=ch.questions&&group!==previous?'<p class="step-group">'+(group<0?'开场与问题':(group+1)+'. '+ch.questions[group].title)+'</p>':'';
  previous=group;
  return heading+'<button class="'+(p.id===pages[active]?.id?'current ':'')+(state.done[p.id]?'done':'')+'" data-page="'+p.id+'" '+(p.id===pages[active]?.id?'aria-current="page"':'')+'>'+(i+1)+'. '+p.title.split('｜').pop()+'</button>';
 }).join('');
}
function articleHTML(p,print=false){
 const ch=p.chapter,step=ch.pages.findIndex(x=>x.id===p.id)+1;
 return '<article data-page-id="'+p.id+'"><div class="eyebrow"><span class="num">'+ch.number+'</span><span>'+ch.title+'</span><span>'+p.minutes+' 分钟</span></div>'+questionPath(p)+'<h1>'+p.title+'</h1>'+p.body+(p.quiz||[]).map(q=>quizHTML(q,print)).join('')+'<div class="complete-row"><button data-complete="'+p.id+'" class="'+(state.done[p.id]?'':'primary')+'">'+(state.done[p.id]?'✓ 已完成本页':'标记本页完成')+'</button><span>本章第 '+step+' / '+ch.pages.length+' 页</span></div></article>';
}
function renderPage(id){
 const p=byId.get(id)||byId.get('start');active=p.index;state.page=p.id;persist();
 main.innerHTML=math(articleHTML(p));renderSidebar(p.chapter);
 const route=main.querySelector('#course-route');
 if(route)route.innerHTML=chapters.filter(c=>['agency','multitask','teams','ownership'].includes(c.id)).map(c=>'<button data-page="'+c.pages[0].id+'"><span>'+c.number+'</span><span><b>'+c.title+'</b><span class="desc">'+c.short+'</span></span><em>'+c.duration+' →</em></button>').join('');
 const all=main.querySelector('#all-sources');
 if(all)all.innerHTML='<ol>'+Object.values(sources).map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+s.label+'</a><p>'+s.note+'</p></li>').join('')+'</ol>';
 main.querySelectorAll('[data-lab]').forEach(el=>initLab(el));
 typeset(main);bindPage(p);
 document.getElementById('pagecount').textContent=(active+1)+' / '+pages.length;
 document.getElementById('readingProgress').value=(active+1)/pages.length*100;
 document.getElementById('prevBtn').disabled=active===0;
 document.getElementById('nextBtn').disabled=active===pages.length-1;
 document.getElementById('pagebar').hidden=false;
 document.title=p.id==='start'?'组织的数学｜交互讲义':p.title+'｜组织的数学';
 window.scrollTo({top:0,behavior:'instant'});
 main.focus({preventScroll:true});
}
function navigate(id){if(location.hash==='#'+id)route();else location.hash=id;}
function bindPage(p){
 main.querySelectorAll('form[data-quiz]').forEach(form=>{
  const q=p.quiz.find(q=>q.id===form.dataset.quiz);
  form.addEventListener('change',()=>{const val=new FormData(form).get('value');state.drafts[q.id]=val;persist();});
  form.addEventListener('submit',ev=>{
   ev.preventDefault();const raw=new FormData(form).get('value');if(raw===null||raw==='')return;
   const value=Number(raw);if(!Number.isFinite(value))return;
   const correct=q.numeric?Math.abs(value-q.answer)<=q.tolerance:value===q.answer;
   const old=state.answers[q.id];state.answers[q.id]={value:raw,correct,tries:(old?.tries||0)+1};state.drafts[q.id]=raw;persist();
   const out=form.nextElementSibling;out.hidden=false;out.className='feedback '+(correct?'correct':'wrong');out.innerHTML=math('<strong>'+(correct?'正确。':'这次还不对。')+'</strong> '+q.explanation+'<p>已检查 '+state.answers[q.id].tries+' 次。</p>');typeset(out);
  });
 });
 const complete=main.querySelector('[data-complete]');complete?.addEventListener('click',()=>{state.done[p.id]=!state.done[p.id];persist();complete.textContent=state.done[p.id]?'✓ 已完成本页':'标记本页完成';complete.classList.toggle('primary',!state.done[p.id]);renderSidebar(p.chapter);});
}
document.addEventListener('click',e=>{if(e.target.closest('.skip')){e.preventDefault();main.focus();return;}const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page);});
document.getElementById('prevBtn').onclick=()=>{if(active>0)navigate(pages[active-1].id);};
document.getElementById('nextBtn').onclick=()=>{if(active<pages.length-1)navigate(pages[active+1].id);};
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY/.test(document.activeElement?.tagName)||document.activeElement?.closest('.plot')||document.activeElement?.isContentEditable||location.hash==='#review')return;if(e.key==='ArrowRight'&&active<pages.length-1){e.preventDefault();navigate(pages[active+1].id);}if(e.key==='ArrowLeft'&&active>0){e.preventDefault();navigate(pages[active-1].id);}});
const fmt=(n,d=3)=>Number(n.toFixed(d)).toString();
function stat(label,value){return '<div class="stat"><span>'+label+'</span><b>'+fmt(value)+'</b></div>';}
function control(key,label,min,max,step,value){return '<div class="control"><label for="lab-'+key+'">'+label+'<output id="out-'+key+'">'+value+'</output></label><input id="lab-'+key+'" data-key="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></div>';}
function chartLine({title,series,xMax,yMin=0,yMax,marker,xlabel='奖金 b'}){
 const W=760,H=340,L=70,R=28,T=32,B=64,pw=W-L-R,ph=H-T-B;
 const sx=x=>L+x/xMax*pw,sy=y=>T+(yMax-y)/(yMax-yMin)*ph;
 let svg='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>';
 for(let k=0;k<=4;k++){const y=yMin+(yMax-yMin)*k/4;svg+='<line x1="'+L+'" y1="'+sy(y)+'" x2="'+(W-R)+'" y2="'+sy(y)+'" stroke="#d5cdc3"/><text x="'+(L-12)+'" y="'+(sy(y)+7)+'" text-anchor="end">'+fmt(y,2)+'</text>';}
 if(yMin<0&&yMax>0)svg+='<line x1="'+L+'" y1="'+sy(0)+'" x2="'+(W-R)+'" y2="'+sy(0)+'" stroke="#655c65"/>';
 for(let k=0;k<=4;k++){const x=xMax*k/4;svg+='<text x="'+sx(x)+'" y="'+(H-30)+'" text-anchor="middle">'+fmt(x,2)+'</text>';}
 for(const s of series){let d='';for(let k=0;k<=120;k++){const x=xMax*k/120;d+=(k?'L':'M')+sx(x).toFixed(2)+','+sy(s.fn(x)).toFixed(2);}svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="4"/>';}
 if(marker!==undefined)svg+='<line x1="'+sx(marker)+'" y1="'+T+'" x2="'+sx(marker)+'" y2="'+(H-B)+'" stroke="#392645" stroke-dasharray="6,5"/>'+series.map(s=>'<circle cx="'+sx(marker)+'" cy="'+sy(s.fn(marker))+'" r="6" fill="'+s.color+'" stroke="white" stroke-width="2"/>').join('');
 svg+='<text x="'+(L+pw/2)+'" y="'+(H-3)+'" text-anchor="middle">'+esc(xlabel)+'</text></svg>';
 return svg;
}
function chartBars(title,items,max){
 const W=760,H=82+items.length*70,L=180,R=85,T=25,pw=W-L-R;
 return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+items.map((x,i)=>'<text x="'+(L-16)+'" y="'+(T+i*70+27)+'" text-anchor="end">'+esc(x.label)+'</text><rect x="'+L+'" y="'+(T+i*70)+'" width="'+Math.max(0,x.value/max*pw)+'" height="38" fill="'+x.color+'"/><text x="'+(L+x.value/max*pw+12)+'" y="'+(T+i*70+27)+'">'+fmt(x.value)+'</text>').join('')+'<text x="'+L+'" y="'+(H-15)+'">0</text><text x="'+(W-R)+'" y="'+(H-15)+'" text-anchor="middle">'+fmt(max,2)+'</text></svg>';
}
function initLab(el,print=false){
 const type=el.dataset.lab;
 const defs={
  agency:{title:'激励与风险',defaults:{b:.5,c:1,r:1,sigma:1},inputs:[['b','奖金 b',0,1.5,.01],['c','成本系数 c',.5,3,.1],['r','风险厌恶 r',0,3,.1],['sigma','标准差 σ',0,3,.1]]},
  attention:{title:'一天的时间如何分配',defaults:{bonus:.2,base:.5,k:1},inputs:[['bonus','数量奖金 b',0,1,.01],['base','基准份额 t₀',.1,.8,.05],['k','偏离成本 k',.5,3,.1]]},
  multitask:{title:'任务之间的反应',defaults:{b1:.8,b2:.6,rho:.5},inputs:[['b1','任务 1 奖金 b₁',0,2,.01],['b2','任务 2 奖金 b₂',0,2,.01],['rho','成本联系 ρ',-.8,.8,.05]]},
  team:{title:'等分团队与第一最佳',defaults:{n:4,teamC:1},inputs:[['n','团队人数 n',1,12,1],['teamC','成本系数 c',.5,3,.1]]},
  ownership:{title:'资产与投资激励',defaults:{A:2,B:1,theta:.6,owner:'buyer'},inputs:[['A','买方生产率 A',.5,3,.1],['B','卖方生产率 B',.5,3,.1],['theta','可回收比例 θ',0,1,.05]]}
 };
 const def=defs[type];if(!def)return;
 const values={...def.defaults,...(print?{}:state.labs[type])};
 const select=type==='ownership'?'<label for="owner-select">当前所有者</label><select id="owner-select"><option value="buyer">买方拥有资产</option><option value="seller">卖方拥有资产</option></select>':'';
 el.className='experiment';
 el.innerHTML='<h2>'+def.title+'</h2>'+select+'<div class="controls">'+def.inputs.map(([key,label,min,max,step])=>control(key,label,min,max,step,values[key])).join('')+'</div>'+(type==='agency'?'<button data-optimal>使用最优奖金</button>':'')+'<button data-reset>恢复初始参数</button><div class="exp-result" aria-live="polite"></div><div class="plot" tabindex="0" role="region" aria-label="实验图形，可横向滚动"></div><div class="chart-caption"></div>';
 const result=el.querySelector('.exp-result'),plot=el.querySelector('.plot'),caption=el.querySelector('.chart-caption');
 const sel=el.querySelector('select');if(sel)sel.value=values.owner;
 function update(){
  if(!print){state.labs[type]={...values};persist();}
  el.querySelectorAll('input').forEach(inp=>{inp.value=values[inp.dataset.key];el.querySelector('#out-'+inp.dataset.key).textContent=fmt(values[inp.dataset.key],2);});
  if(type==='agency'){
   const z=M.agency(values),f=b=>M.agency({...values,b}).surplus;
   const ys=Array.from({length:121},(_,i)=>f(i*1.5/120));
   result.innerHTML='<div class="stats">'+stat('实际努力 e',z.e)+stat('最优奖金 b*',z.bStar)+stat('净剩余 / 利润',z.surplus)+stat('风险溢价',z.risk)+'</div><p>固定工资 a = '+fmt(z.a)+'；第一最佳努力 = '+fmt(z.firstBest)+'。固定工资随参数调整，保持员工 CE = 0。</p>';
   plot.innerHTML=chartLine({title:'线性奖金下的公司利润；虚线为当前奖金',series:[{fn:f,color:'#392645'}],xMax:1.5,yMin:Math.min(0,...ys)*1.05,yMax:Math.max(.1,...ys)*1.15,marker:values.b});
   caption.textContent='紫线：扣除努力成本与风险溢价后的公司利润（u₀=0）；虚线：当前奖金。纵轴为模型货币单位。';
  }else if(type==='attention'){
   const t=Math.min(1,Math.max(0,values.base+values.bonus/values.k)),cost=values.k*(t-values.base)**2/2;
   result.innerHTML='<div class="stats">'+stat('数量任务时间',t)+stat('另一任务时间',1-t)+stat('偏离成本',cost)+'</div><p>总时间固定为 1；本实验不把数量指标直接当作总绩效。</p>';
   plot.innerHTML=chartBars('时间份额',[{label:'数量任务',value:t,color:'#392645'},{label:'另一任务',value:1-t,color:'#d87960'}],1);
   caption.textContent='两条长度之和始终为 1。t* = clip(t₀ + b/k, 0, 1)；这是带偏好基准的固定时间教学例子。';
  }else if(type==='multitask'){
   const z=M.multi(values),f1=x=>M.multi({...values,b1:x}).e1,f2=x=>M.multi({...values,b1:x}).e2;
   const ymax=Math.max(1,...Array.from({length:121},(_,i)=>Math.max(f1(i/60),f2(i/60))))*1.12;
   result.innerHTML='<div class="stats">'+stat('任务 1 努力 e₁',z.e1)+stat('任务 2 努力 e₂',z.e2)+stat('总努力成本',z.cost)+'</div><p>'+ (z.corner?'当前在非负约束边界，内点交叉导数不适用。':'当前两任务均为正，内点公式适用。')+'</p>';
   plot.innerHTML=chartLine({title:'两任务努力随任务一奖金变化',series:[{fn:f1,color:'#392645'},{fn:f2,color:'#c75e42'}],xMax:2,yMax:ymax,marker:values.b1,xlabel:'任务 1 奖金 b₁'});
   caption.textContent='紫线：任务 1；橙线：任务 2。横轴只改变 b₁，b₂ 与 ρ 保持滑块值。纵轴为努力。程序按非负努力求解。';
  }else if(type==='team'){
   const z=M.team({n:values.n,c:values.teamC});
   result.innerHTML='<div class="stats">'+stat('每人均衡努力',z.e)+stat('每人第一最佳',z.fb)+stat('总产出（均衡）',z.total)+stat('总产出（基准）',z.fbTotal)+'</div><p>均衡总剩余 '+fmt(z.surplus)+'；第一最佳总剩余 '+fmt(z.fbSurplus)+'；总剩余比 '+fmt(z.surplus/z.fbSurplus)+'。</p>';
   plot.innerHTML=chartBars('等分收入与第一最佳的总产出比较',[{label:'等分均衡产出',value:z.total,color:'#392645'},{label:'第一最佳产出',value:z.fbTotal,color:'#7a8c34'}],Math.max(z.fbTotal,1/values.teamC)*1.1);
   caption.textContent='比较产出时保持成员生产率与成本相同。人数变化不引入技术收益或协调成本；总剩余已扣除所有努力成本。';
  }else if(type==='ownership'){
   const {A,B,theta}=values,zb=M.ownership({A,B,alpha:theta,beta:0}),zs=M.ownership({A,B,alpha:0,beta:theta}),z=values.owner==='buyer'?zb:zs;
   result.innerHTML='<div class="stats">'+stat('买方投资 i',z.i)+stat('卖方投资 j',z.j)+stat('当前总净剩余',z.surplus)+stat('第一最佳剩余',z.fb)+'</div><p>买方拥有 − 卖方拥有的净剩余差 = '+fmt(zb.surplus-zs.surplus)+'。当前不合作收益 dB = '+fmt(z.db)+'，dS = '+fmt(z.ds)+'。</p>';
   plot.innerHTML=chartBars('两种产权与第一最佳的净剩余',[{label:'买方拥有',value:zb.surplus,color:'#392645'},{label:'卖方拥有',value:zs.surplus,color:'#d87960'},{label:'第一最佳',value:z.fb,color:'#7a8c34'}],z.fb*1.1);
   caption.textContent='净剩余 = 合作价值 − 双方投资成本。固定资产转移价格在双方内部抵消。本例只改变外部收益，不改变合作技术。';
  }
  caption.textContent+=' 窄屏可左右滚动图形。';
 }
 el.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{values[inp.dataset.key]=Number(inp.value);update();}));
 sel?.addEventListener('change',()=>{values.owner=sel.value;update();});
 el.querySelector('[data-reset]').onclick=()=>{Object.assign(values,def.defaults);if(sel)sel.value=values.owner;update();};
 el.querySelector('[data-optimal]')?.addEventListener('click',()=>{values.b=M.agency(values).bStar;update();});
 update();
}
const cards=chapters.flatMap(ch=>ch.pages.filter(p=>p.memory).map(p=>({...p.memory,chapter:ch.number,page:p.id}))).concat([
 {chapter:'01',page:'a-ir',question:'IC 与 IR 分别限制什么？',answer:'IC：合同诱导的努力必须是员工自己的最优选择。IR：接受合同的确定性等价不低于外部机会。在本模型里 $e=b/c$，再用 IR 解出固定工资。'},
 {chapter:'01',page:'a-risk',question:'奖金翻倍，风险溢价变为多少？',answer:'给定 $r,@sigma$，$RP=rb^2@sigma^2/2$ 变为四倍。它是收入波动的补偿，不是努力成本。'},
 {chapter:'02',page:'b-boundary',question:'两任务公式算出负努力，下一步怎么办？',answer:'检查非负约束，求边界最优；不能继续使用内点斜率。若 $@rho&gt;0,b_2=0$ 且任务 2 没有私人收益，其努力本来就是零。'},
 {chapter:'02',page:'b-vector',question:'成本矩阵 H 与噪声矩阵 Σ 分别表示什么？',answer:'H 描述任务在私人边际成本上的联系；Σ 描述测量信号的方差与协方差。它们是不同的机制，共同影响最优奖金。'},
 {chapter:'03',page:'c-nash',question:'等分团队中，每人努力与总产出是多少？',answer:'本章加总产出、同质二次成本中，$e_i=1/(nc)$、$Q=1/c$；第一最佳为每人 $1/c$、总产出 $n/c$。不是所有团队的普适规律。'},
 {chapter:'03',page:'c-remedies',question:'增加固定工资为何不能修复团队边际缺口？',answer:'固定转移不改变 $T_i^{@prime}(Q)$。需要改变可契约信息、预算约束、重复关系或其他行为约束，并重新验证制度能否实施目标。'},
 {chapter:'04',page:'d-contract',question:'可观察与可验证有什么区别？',answer:'可观察是双方知道；可验证是第三方能够确认并执行合同。双方知道投入有价值，不意味着可把其贡献写入可执行条款。'},
 {chapter:'04',page:'d-margin',question:'外部收益提高一个常数，投资一定增加吗？',answer:'不一定。本模型中的投资由边际回报决定；常数提高外部收益水平，却不改变其对投资的导数。产权的激励效果需要看边际变化。'}
]);
function reviewCards(){const list=weakOnly?cards.filter(c=>state.review[c.page+'|'+c.question]==='weak'):cards;return list;}
function renderReview(){
 document.title='复习卡｜组织的数学';
 document.getElementById('pagebar').hidden=true;renderSidebar(null);
 const list=reviewCards();reviewIndex=Math.max(0,Math.min(reviewIndex,list.length-1));const card=list[reviewIndex];
 main.innerHTML=math('<article><div class="eyebrow"><span class="num">复习</span><span>先回答，再展开</span></div><h1>把公式从记忆里取出来</h1><p>可以在纸上写，也可以口述。答对数和卡片自评分别记录，标记“已会”不是系统测得的掌握度。</p><div class="stack"><button id="weakToggle">'+(weakOnly?'查看全部卡片':'只看需重练')+'</button><button data-page="'+esc(state.page)+'">返回上次页面</button></div>'+(card?'<div class="memory"><p class="review-progress">第 '+(reviewIndex+1)+' / '+list.length+' 张 · 主题 '+card.chapter+'</p><h2>'+card.question+'</h2><button id="revealCard" class="primary">'+(reviewReveal?'隐藏答案':'展开答案')+'</button>'+(reviewReveal?'<div class="answer">'+card.answer+'</div><div class="stack"><button id="cardWeak">需重练</button><button id="cardKnown">已会</button><button data-page="'+card.page+'">回到原页</button></div>':'')+'</div><div class="stack"><button id="cardPrev" '+(reviewIndex===0?'disabled':'')+'>← 前一张</button><button id="cardNext" '+(reviewIndex>=list.length-1?'disabled':'')+'>后一张 →</button></div>':'<div class="memory">还没有标记为“需重练”的卡片。切回全部卡片开始自测。</div>')+'</article>');
 typeset(main);
 document.getElementById('weakToggle').onclick=()=>{weakOnly=!weakOnly;reviewIndex=0;reviewReveal=false;renderReview();};
 if(card){
  document.getElementById('revealCard').onclick=()=>{reviewReveal=!reviewReveal;renderReview();};
  document.getElementById('cardPrev').onclick=()=>{reviewIndex--;reviewReveal=false;renderReview();};
  document.getElementById('cardNext').onclick=()=>{reviewIndex++;reviewReveal=false;renderReview();};
  const mark=value=>{state.review[card.page+'|'+card.question]=value;persist();if(weakOnly){reviewReveal=false;renderReview();}else{main.querySelector('.review-progress').textContent='第 '+(reviewIndex+1)+' / '+list.length+' 张 · 已标记：'+(value==='weak'?'需重练':'已会');}};
  document.getElementById('cardWeak')?.addEventListener('click',()=>mark('weak'));
  document.getElementById('cardKnown')?.addEventListener('click',()=>mark('known'));
 }
 window.scrollTo({top:0,behavior:'instant'});
}
document.getElementById('reviewBtn').onclick=()=>navigate('review');
function strip(s){const d=document.createElement('div');d.innerHTML=s;return math(d.textContent||'');}
document.getElementById('exportBtn').onclick=()=>{
 const lines=['# 组织的数学｜学习记录','', '导出时间：'+new Date().toLocaleString('zh-CN'),'', '学习数据仅来自此浏览器。原版本已保存的笔记一并保留。',''];
 for(const ch of chapters){lines.push('## '+ch.number+' '+ch.title,'');for(const p of ch.pages){if(state.notes[p.id])lines.push('### '+p.title,'',state.notes[p.id],'');for(const q of p.quiz||[]){const a=state.answers[q.id];if(a)lines.push('- '+strip(q.prompt), '  - 我的答案：'+(q.numeric?a.value:strip(q.options[Number(a.value)]))+'；'+(a.correct?'正确':'需重做')+'；尝试 '+a.tries+' 次','  - 解释：'+strip(q.explanation),'');}if(p.memory)lines.push('### 公式卡','',strip(p.memory.question),'',strip(p.memory.answer),'');}}
 lines.push('## 实验参数','',JSON.stringify(state.labs,null,2),'','## 复习卡自评','');cards.forEach(c=>{const v=state.review[c.page+'|'+c.question];if(v)lines.push('- '+strip(c.question)+'：'+(v==='weak'?'需重练':'已会'));});
 lines.push('','## 文献','',...Object.values(sources).map(s=>'- '+s.label+' '+s.url));
 const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='组织经济学-学习记录.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
function printView(){
 document.body.classList.add('print-view');main.innerHTML=math('<article><h1>组织的数学</h1><p>四章交互讲义 · 完整阅读与打印版</p><p>实验在本版显示初始参数及对应结果。请返回常规页面操作滑块；本版显示所有题目答案。</p><button id="printNow">打印 / 保存为 PDF</button></article>'+pages.map(p=>articleHTML(p,true)).join(''));
 main.querySelectorAll('[data-lab]').forEach(el=>initLab(el,true));main.querySelectorAll('details').forEach(d=>d.open=true);typeset(main);document.getElementById('printNow').onclick=()=>window.print();
 const all=main.querySelector('#all-sources');if(all)all.innerHTML='<ol>'+Object.values(sources).map(s=>'<li><a href="'+esc(s.url)+'">'+s.label+'</a></li>').join('')+'</ol>';
}
function route(){const id=decodeURIComponent(location.hash.slice(1));if(id==='review')renderReview();else renderPage(id||state.page||'start');}
if(!storageOK)warnStorage();
if(new URLSearchParams(location.search).has('print'))printView();else{window.addEventListener('hashchange',route);route();}
})();
