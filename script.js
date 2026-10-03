(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const todayISO = () => new Date().toLocaleDateString('en-CA');
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = () => { localStorage.setItem('capydoto.tasks', JSON.stringify(state.tasks)); localStorage.setItem('capydoto.pet', JSON.stringify(state.pet)); };
  const state = { tasks: read('capydoto.tasks', []), pet: read('capydoto.pet', { name:'Mochi', happiness:78, energy:64, fullness:52, coins:12, xp:0, level:1, streak:0, lastDone:'', skin:'classic', scene:'spring', accessories:[], equipped:'', reminded:[], night:false, reduceMotion:false }), filter:'all' };
  const assets = 'assets/stickers/';
  const accessoryShop = [
    {id:'hat',name:'Tiny hat',art:'🎩',cost:12,desc:'A very important little hat.'}, {id:'glasses',name:'Round glasses',art:'👓',cost:14,desc:'For thoughtful capybara moments.'}, {id:'flower',name:'Flower crown',art:'🌼',cost:16,desc:'A meadow, in miniature.'}, {id:'scarf',name:'Cozy scarf',art:'🧣',cost:18,desc:'Extra warmth for chilly days.'}, {id:'bow',name:'Bow tie',art:'🎀',cost:10,desc:'Dressed up, still very relaxed.'}, {id:'orange',name:'Orange on head',art:'🍊',cost:20,desc:'The classic citrus look.'}
  ];
  const cap = n => Math.max(0, Math.min(100, n));
  const newId = () => globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dayString = d => { if (!d) return ''; const date = new Date(`${d}T00:00:00`); return date.toLocaleDateString(undefined,{month:'short',day:'numeric'}); };
  const timeString = t => { if (!t) return ''; const [h,m]=t.split(':'); return new Date(2000,0,1,+h,+m).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); };
  const dueStamp = task => task.due ? new Date(`${task.due}T${task.time || '23:59'}`).getTime() : null;
  const isOverdue = t => !t.done && dueStamp(t) !== null && dueStamp(t) < Date.now();
  const completedToday = () => state.tasks.filter(t=>t.done && t.completedAt?.slice(0,10)===todayISO()).length;

  function updatePet() {
    const pet = state.pet;
    $('#petNameHeading').childNodes[0].textContent = pet.name + ' ';
    $('#settingsPetName').textContent = pet.name;
    $('#levelPill').textContent = `LVL ${pet.level}`;
    $('#coinValue').textContent = pet.coins; $('#shopCoinValue').textContent = pet.coins;
    for (const [key, id] of [['happiness','happiness'],['energy','energy'],['fullness','hunger']]) {
      $(`#${id}Bar`).style.width = cap(pet[key]) + '%'; $(`#${id}Value`).textContent = cap(pet[key]);
    }
    $('#streakValue').textContent = pet.streak;
    const overdue = state.tasks.some(isOverdue);
    const idle = Date.now() - (pet.lastActive || Date.now()) > 1000 * 60 * 60 * 5;
    let mood = overdue ? 'A little sleepy about overdue tasks' : idle ? 'Sleepy and taking it slow' : pet.moodUntil > Date.now() ? pet.mood : 'Feeling cozy';
    $('#moodText').textContent = mood;
    $('#petSticker').src = assets + (overdue ? 'sad.svg' : idle ? 'sleeping.svg' : pet.moodUntil > Date.now() ? pet.moodSticker || 'excited.svg' : pet.scene === 'spring' ? 'hot-spring.svg' : 'happy.svg');
    $('#petSticker').alt = `${pet.name}, ${mood.toLowerCase()}`;
    $('#petSticker').dataset.skin = pet.skin;
    $('#petScene').className = `pet-scene scene-${pet.scene}`;
    $('#sceneCaption').textContent = ({spring:'a warm little soak',river:'right by the river',room:'a cozy little corner',night:'under the sleepy stars'})[pet.scene];
    $('#accessoryOverlay').textContent = pet.equipped ? (accessoryShop.find(a=>a.id===pet.equipped)?.art || '') : '';
    $$('.swatch').forEach(b=>{b.classList.toggle('selected',b.dataset.skin===pet.skin);const level={classic:1,golden:2,mint:3,pink:4,galaxy:5}[b.dataset.skin];b.disabled=pet.level<level;b.title=pet.level<level?`${b.getAttribute('aria-label')} unlocks at level ${level}`:b.getAttribute('aria-label');});
    $$('.scene-option').forEach(b=>b.classList.toggle('selected',b.dataset.scene===pet.scene));
    $('.galaxy-swatch').title = pet.level >= 5 ? 'Galaxy' : 'Galaxy (unlocks at level 5)';
    $('#streakValue').parentElement.title = pet.lastDone === todayISO() ? 'Tasks completed today' : 'Daily streak';
  }
  function renderTasks() {
    const list = $('#taskList');
    const filtered = state.tasks.filter(t => {
      if (state.filter==='done') return t.done;
      if (t.done) return false;
      if (state.filter==='today') return t.due===todayISO() || !t.due;
      if (state.filter==='upcoming') return t.due && t.due>todayISO();
      return true;
    }).sort((a,b)=>Number(a.done)-Number(b.done) || (dueStamp(a)||Infinity)-(dueStamp(b)||Infinity) || b.createdAt-a.createdAt);
    $('#taskCount').textContent = state.tasks.filter(t=>!t.done).length;
    $('#countAll').textContent = state.tasks.filter(t=>!t.done).length;
    const todayTasks=state.tasks.filter(t=>!t.done && (t.due===todayISO()||!t.due));
    const todayDone=state.tasks.filter(t=>t.done && t.completedAt?.slice(0,10)===todayISO()).length;
    const pct=todayTasks.length?Math.round(todayDone/(todayDone+todayTasks.length)*100):0;
    $('#progressRing').style.setProperty('--progress',pct+'%'); $('#progressRing').setAttribute('aria-label',pct+' percent complete'); $('#progressPercent').textContent=pct+'%';
    $('#progressText').textContent = todayTasks.length ? `${todayDone} of ${todayDone+todayTasks.length} little things done` : todayDone ? 'You showed up for yourself today' : 'A fresh little start';
    $('#progressSub').textContent = todayTasks.length ? 'Little steps add up.' : 'Every small thing counts.';
    if(!filtered.length){
      const messages={all:['Nothing to do… just like a capybara in a hot spring.','Add a little task whenever you’re ready.','hot-spring.svg'],today:['No tasks for today. Your capy approves this pause.','Rest is allowed, too.','sleeping.svg'],upcoming:['No future plans yet. Lovely and spacious.','Add a task with a date to see it here.','waving.svg'],done:['Nothing checked off just yet.','Your little wins will live here.','happy.svg']};
      const [title,sub,sticker]=messages[state.filter]; list.innerHTML=`<div class="empty-state"><img src="${assets+sticker}" alt=""><strong>${title}</strong><p>${sub}</p></div>`;
    } else list.innerHTML=filtered.map(t=>{
      const overdue=isOverdue(t), due=t.due?`<span class="due-tag">${esc(dayString(t.due))}${t.time?' · '+esc(timeString(t.time)):''}</span>`:'';
      return `<article class="task-item ${t.done?'completed':''} ${overdue?'overdue':''}" data-id="${esc(t.id)}"><button class="task-check ${t.done?'checked':''}" aria-label="${t.done?'Mark incomplete':'Complete '+esc(t.title)}" aria-pressed="${!!t.done}">${t.done?'✓':''}</button><div class="task-main"><div class="task-title">${esc(t.title)}</div>${t.note?`<div class="task-note">${esc(t.note)}</div>`:''}<div class="task-meta"><span class="tag ${t.category.toLowerCase()}">${esc(t.category)}</span><span class="priority ${t.priority.toLowerCase()}">${esc(t.priority)} priority</span>${due}${overdue?'<span class="overdue-badge">capy is waiting</span>':''}${t.reminder?'<span class="due-tag" title="Reminder set">♧ reminder</span>':''}</div></div><div class="task-actions"><button class="mini-action edit-task" aria-label="Edit task" title="Edit">✎</button><button class="mini-action delete-task" aria-label="Delete task" title="Delete">×</button></div></article>`;
    }).join('');
  }
  function renderShop(){
    $('#shopGrid').innerHTML=accessoryShop.map(a=>{const owned=state.pet.accessories.includes(a.id), equipped=state.pet.equipped===a.id;return `<article class="shop-item ${owned?'owned':''}"><div class="shop-art" aria-hidden="true">${a.art}</div><h3>${a.name}</h3><p>${a.desc}</p><button class="${owned?'soft-button':'primary-button'}" data-buy="${a.id}" ${!owned&&state.pet.coins<a.cost?'disabled':''}>${equipped?'Wearing':owned?'Wear it':`◉ ${a.cost} coins`}</button></article>`}).join('');
  }
  function render(){renderTasks();updatePet();renderShop();}
  function toast(title, message, taskId, choices=false){
    const el=document.createElement('div');el.className='toast';el.innerHTML=`<img src="${assets}waving.svg" alt=""><div><strong>${esc(title)}</strong><p>${esc(message)}</p>${choices?'<div class="snooze-options"><button data-snooze="5">5 min</button><button data-snooze="15">15 min</button><button data-snooze="60">1 hour</button></div>':''}</div><button class="toast-close" aria-label="Dismiss">×</button>`;
    el.dataset.taskId=taskId||'';$('#toastStack').prepend(el);el.querySelector('.toast-close').onclick=()=>el.remove();setTimeout(()=>el.remove(),choices?30000:5000);
  }
  function persistActivity(){state.pet.lastActive=Date.now();save();}
  function celebrate(){const c=$('#celebration');c.classList.remove('show');void c.offsetWidth;c.classList.add('show');setTimeout(()=>c.classList.remove('show'),1000);}
  function toggleTask(t){
    t.done=!t.done; if(t.done){t.completedAt=new Date().toISOString();state.pet.coins+=3;state.pet.xp+=1;state.pet.happiness=cap(state.pet.happiness+8);state.pet.energy=cap(state.pet.energy-3);const today=t.completedAt.slice(0,10);if(state.pet.lastDone!==today){state.pet.streak=state.pet.lastDone===new Date(Date.now()-86400000).toLocaleDateString('en-CA')?state.pet.streak+1:1;state.pet.lastDone=today;}if(state.pet.xp>=5){state.pet.level++;state.pet.xp=0;toast('Level up!','A new little look is ready to unlock.');}state.pet.mood=state.pet.streak>=3?'Excited! You’re on a roll':'Happy you did it';state.pet.moodSticker=state.pet.streak>=3?'celebrating.svg':'happy.svg';state.pet.moodUntil=Date.now()+5000;celebrate();toast('Lovely work!',`${state.pet.name} earned 3 carrot coins.`,t.id);}else{t.completedAt=null;}persistActivity();render();
  }
  function openTask(task){$('#taskForm').reset();$('#editTaskId').value=task?.id||'';$('#dialogTitle').textContent=task?'Edit task':'Add a task';$('#dialogEyebrow').textContent=task?'A LITTLE UPDATE':'A LITTLE THING TO DO';$('#taskTitle').value=task?.title||'';$('#taskNote').value=task?.note||'';$('#taskCategory').value=task?.category||'Study';$('#taskPriority').value=task?.priority||'Medium';$('#taskDue').value=task?.due||'';$('#taskTime').value=task?.time||'';$('#taskReminder').checked=!!task?.reminder;$('#permissionNote').classList.toggle('hidden',!$('#taskReminder').checked || 'Notification' in window);$('#taskDialog').showModal();setTimeout(()=>$('#taskTitle').focus(),50);}
  function changeView(view){
    const layout=$('.layout'); layout.classList.toggle('hidden',view==='shop'||view==='settings'); $('#tasksView').classList.toggle('hidden',view==='shop'||view==='settings');layout.classList.toggle('show-pet',view==='pet');$('#shopView').classList.toggle('hidden',view!=='shop');$('#settingsPage').classList.toggle('hidden',view!=='settings');
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===(view==='pet'?'pet':view)));
    if(view==='pet'&&innerWidth>700) $('#petView').scrollIntoView({behavior:'smooth',block:'start'});
    if(view==='tasks'&&innerWidth>700){$('#tasksView').classList.remove('hidden');$('#petView').classList.remove('hidden');}
    if(view==='pet'&&innerWidth>700){$('#petView').classList.remove('hidden');}
  }
  function maybeAskNotification(){
    if(!('Notification' in window)){toast('Browser reminders unavailable','You can still use Capydoto’s in-app reminder nudges.');return;}
    if(Notification.permission==='granted'){state.pet.notifications=true;save();toast('Reminders are on','Mochi will give you a gentle nudge.');return;}
    if(Notification.permission==='denied'){toast('Notifications are turned off','You can change this in your browser site settings.');return;}
    $('#permissionOverlay').classList.remove('hidden');
  }
  function checkReminders(){
    const now=Date.now();for(const t of state.tasks){if(t.done||!t.reminder||!t.due)continue;const at=dueStamp(t),key=t.id+':'+at;if(at<=now&&!state.pet.reminded.includes(key)){state.pet.reminded.push(key);toast('A little reminder',t.title,t.id,true);if('Notification'in window&&Notification.permission==='granted'){try{new Notification('A little reminder',{body:t.title,icon:assets+'waving.svg',tag:key});}catch{}}}}
    save();
  }
  function setTheme(night){state.pet.night=night;document.body.classList.toggle('dark',night);$('#themeToggle').innerHTML=night?'☀':'☾';$('#themeToggle').setAttribute('aria-label',night?'Switch to day mode':'Switch to night mode');save();}

  $('#todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  setTheme(!!state.pet.night);$('#motionToggle').checked=!!state.pet.reduceMotion;document.documentElement.classList.toggle('reduce-motion',!!state.pet.reduceMotion);
  $('#taskList').addEventListener('click',e=>{const row=e.target.closest('.task-item');if(!row)return;const task=state.tasks.find(t=>t.id===row.dataset.id);if(!task)return;if(e.target.closest('.task-check'))toggleTask(task);else if(e.target.closest('.edit-task'))openTask(task);else if(e.target.closest('.delete-task')){state.tasks=state.tasks.filter(t=>t.id!==task.id);save();render();}});
  $$('.filter-tab').forEach(b=>b.addEventListener('click',()=>{$$('.filter-tab').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',x===b?'true':'false')});state.filter=b.dataset.filter;renderTasks();}));
  $('#addTaskButton').onclick=()=>openTask();$('.close-dialog').onclick=()=>$('#taskDialog').close();$('#cancelTask').onclick=()=>$('#taskDialog').close();
  $('#taskReminder').onchange=()=>$('#permissionNote').classList.toggle('hidden',!$('#taskReminder').checked||'Notification'in window);
  $('#taskForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#editTaskId').value;const prev=state.tasks.find(t=>t.id===id);const item={id:id||newId(),title:$('#taskTitle').value.trim(),note:$('#taskNote').value.trim(),category:$('#taskCategory').value,priority:$('#taskPriority').value,due:$('#taskDue').value,time:$('#taskTime').value,reminder:$('#taskReminder').checked,done:prev?.done||false,completedAt:prev?.completedAt||null,createdAt:prev?.createdAt||Date.now()};if(item.reminder&&'Notification'in window&&Notification.permission==='default')maybeAskNotification();if(prev)state.tasks=state.tasks.map(t=>t.id===id?item:t);else state.tasks.push(item);persistActivity();$('#taskDialog').close();render();});
  $('#clearDone').onclick=()=>{state.tasks=state.tasks.filter(t=>!t.done);save();render();};
  $$('.nav-item,[data-nav]').forEach(b=>b.addEventListener('click',()=>changeView(b.dataset.nav)));
  $('#themeToggle').onclick=()=>setTheme(!state.pet.night);$('#settingsThemeToggle').onclick=()=>setTheme(!state.pet.night);
  $$('.swatch').forEach(b=>b.onclick=()=>{const level={classic:1,golden:2,mint:3,pink:4,galaxy:5}[b.dataset.skin];if(state.pet.level<level){toast('A little something to look forward to',`${b.getAttribute('aria-label')} unlocks at level ${level}.`);return;}state.pet.skin=b.dataset.skin;toast('A fresh little look','Coat colour saved.');save();render();});
  $$('.scene-option').forEach(b=>b.onclick=()=>{state.pet.scene=b.dataset.scene;save();render();});
  $('#shopGrid').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(!b)return;const item=accessoryShop.find(a=>a.id===b.dataset.buy);if(state.pet.accessories.includes(item.id)){state.pet.equipped=state.pet.equipped===item.id?'':item.id;}else if(state.pet.coins>=item.cost){state.pet.coins-=item.cost;state.pet.accessories.push(item.id);state.pet.equipped=item.id;toast('A new little treasure!',`${item.name} is yours.`);}else{toast('A few more coins','Complete tasks to earn carrot coins.');return;}save();render();});
  $('#petButton').onclick=()=>{state.pet.happiness=cap(state.pet.happiness+2);state.pet.lastActive=Date.now();const heart=document.createElement('span');heart.textContent='♥';heart.className='pet-heart';$('#petScene').append(heart);setTimeout(()=>heart.remove(),1000);save();render();};
  $('#feedButton').onclick=()=>{if(state.pet.coins<2){toast('No carrots just yet','Complete a task to earn a few coins.');return;}state.pet.coins-=2;state.pet.fullness=cap(state.pet.fullness+22);state.pet.happiness=cap(state.pet.happiness+3);state.pet.mood='Enjoying a little snack';state.pet.moodSticker='eating.svg';state.pet.moodUntil=Date.now()+3500;state.pet.lastActive=Date.now();toast('Nom nom','Mochi enjoyed a crunchy carrot.');save();render();};
  $('#playButton').onclick=()=>{if(state.pet.energy<10){toast('A little rest first','Mochi needs a cozy break before playing.');return;}state.pet.energy=cap(state.pet.energy-12);state.pet.happiness=cap(state.pet.happiness+14);state.pet.mood='Playtime was lovely';state.pet.moodSticker='excited.svg';state.pet.moodUntil=Date.now()+4000;state.pet.lastActive=Date.now();toast('Playtime!','A very nice little break.');save();render();};
  function rename(){const next=prompt('What shall we call your capy?',state.pet.name);if(next&&next.trim()){state.pet.name=next.trim().slice(0,20);save();render();}}
  $('#renameButton').onclick=rename;$('#settingsRename').onclick=rename;
  $('#notificationButton').onclick=maybeAskNotification;
  $('#skipPermission').onclick=()=>$('#permissionOverlay').classList.add('hidden');$('#allowPermission').onclick=async()=>{try{const result=await Notification.requestPermission();state.pet.notifications=result==='granted';save();toast(result==='granted'?'Reminders are on':'No worries','You can change this anytime.');}catch{toast('Not available here','Browser notifications need a secure page.');}$('#permissionOverlay').classList.add('hidden');};
  $('#motionToggle').onchange=e=>{state.pet.reduceMotion=e.target.checked;document.documentElement.classList.toggle('reduce-motion',e.target.checked);save();};
  $('#toastStack').addEventListener('click',e=>{const b=e.target.closest('[data-snooze]');if(!b)return;const el=b.closest('.toast'),task=state.tasks.find(t=>t.id===el.dataset.taskId);if(task){const ms=Number(b.dataset.snooze)*60000;task.snoozeUntil=Date.now()+ms;setTimeout(()=>{const still=state.tasks.find(t=>t.id===task.id);if(still&&!still.done){toast('Snoozed reminder',still.title,still.id,true);if('Notification'in window&&Notification.permission==='granted')new Notification('A little reminder',{body:still.title,icon:assets+'waving.svg'});}},ms);state.pet.reminded=state.pet.reminded.filter(k=>k!==`${task.id}:${dueStamp(task)}`);save();el.remove();toast('Snoozed','I’ll nudge you again in '+b.dataset.snooze+' minutes.');}});
  $('#nameOverlay').classList.toggle('hidden',!!localStorage.getItem('capydoto.pet'));
  $('#saveFirstName').onclick=()=>{const val=$('#firstPetName').value.trim();if(val){state.pet.name=val.slice(0,20);save();$('#nameOverlay').classList.add('hidden');render();}};
  render();checkReminders();setInterval(checkReminders,30000);setInterval(()=>{if(state.pet.moodUntil<Date.now())render();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminders();});
})();
