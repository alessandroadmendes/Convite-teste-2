(() => {
  'use strict';
  const c = window.WEDDING_CONFIG || {}, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  $$('[data-name-one]').forEach(e => e.textContent = c.couple?.first || 'Alessandro');
  $$('[data-name-two]').forEach(e => e.textContent = c.couple?.second || 'Marina');
  $$('[data-long-date]').forEach(e => e.textContent = c.longDate || '10 de julho de 2027');
  $$('[data-venue]').forEach(e => e.textContent = c.venue || 'Quinta Montebello');
  $('#map-link').href = c.mapUrl || '#';
  let modalScrollY=0,pageLocked=false;
  const lockPage=()=>{if(pageLocked)return;modalScrollY=window.scrollY;pageLocked=true;document.documentElement.classList.add('modal-open');document.body.style.position='fixed';document.body.style.top='-'+modalScrollY+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%'};
  const unlockPage=()=>{if(!pageLocked)return;pageLocked=false;document.documentElement.classList.remove('modal-open');document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo(0,modalScrollY)};
  const invitedName=new URLSearchParams(location.search).get('convidado');
  if(invitedName){$('#guest-name').textContent=invitedName;$('#guest-invite').hidden=false}
  try{if(localStorage.getItem('wedding_names_seen'))document.body.classList.remove('name-reveal-pending');else setTimeout(()=>{localStorage.setItem('wedding_names_seen','1');document.body.classList.remove('name-reveal-pending')},2400)}catch(_){setTimeout(()=>document.body.classList.remove('name-reveal-pending'),2400)}
  const icons = {
    calendar:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="7" width="22" height="20" rx="2"/><path d="M10 4v6M22 4v6M5 13h22"/><path d="M11 18h3M18 18h3M11 23h3M18 23h3"/></svg>',
    rings:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="18" r="8"/><circle cx="20" cy="18" r="8"/><path d="m8 8 4-4 4 4-4 4Z"/></svg>',
    toast:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 5 6 11-5 3L3 8Z M25 5 19 16l5 3 5-11Z"/><path d="m10 18 4 9M22 18l-4 9M10 27h7M15 27h7"/></svg>',
    moon:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M25 22.5A11 11 0 0 1 10 7.2 10.5 10.5 0 1 0 25 22.5Z"/><path d="M22 6v4M20 8h4"/></svg>'
  };
  const detailData = [
    {kind:'event',icon:icons.rings,meta:'13:30',title:'Casamento Civil',text:'Quinta Montebello'},
    {kind:'event',icon:icons.toast,meta:'14:30',title:'Copo de Água',text:'Quinta Montebello'},
    {kind:'event',icon:icons.moon,meta:'',title:'Fim da celebração',text:'Até à última dança'}
  ];
  $('#details-grid').innerHTML = detailData.map(x=>'<article class="timeline-entry '+x.kind+'-entry"><div class="timeline-node"><span class="timeline-icon">'+x.icon+'</span></div><div class="timeline-card"><span class="timeline-meta'+(x.meta?'':' is-empty')+'">'+(x.meta||'00:00')+'</span><h3>'+x.title+'</h3><p>'+x.text+'</p></div></article>').join('');
  const backgroundMusic=$('#background-music'),musicToggle=$('#music-toggle');
  const MUSIC_MAX=.40,MUSIC_TARGET=Math.min(.40,MUSIC_MAX),MUSIC_FADE_MS=3000;
  let inviteActivated=false,resumeMusicOnReturn=false,musicContext=null,musicGain=null,musicSource=null,musicVolumeFrame=0;
  if(backgroundMusic&&c.music){backgroundMusic.src=c.music;backgroundMusic.volume=1}
  const prepareMusicGraph=()=>{try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return false;if(!musicContext){musicContext=new AudioContextClass();musicSource=musicContext.createMediaElementSource(backgroundMusic);musicGain=musicContext.createGain();musicSource.connect(musicGain).connect(musicContext.destination)}return true}catch(_){return false}};
  const cancelMusicFade=()=>{if(musicVolumeFrame){cancelAnimationFrame(musicVolumeFrame);musicVolumeFrame=0}if(musicGain&&musicContext){const now=musicContext.currentTime;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setValueAtTime(musicGain.gain.value,now)}};
  const fadeMusicIn=()=>{cancelMusicFade();if(musicGain&&musicContext){const now=musicContext.currentTime;musicGain.gain.setValueAtTime(.012,now);musicGain.gain.linearRampToValueAtTime(MUSIC_TARGET,now+MUSIC_FADE_MS/1000);return}backgroundMusic.volume=.012;const started=performance.now();const step=now=>{const progress=Math.min(1,(now-started)/MUSIC_FADE_MS);backgroundMusic.volume=.012+(MUSIC_TARGET-.012)*(1-Math.pow(1-progress,3));if(progress<1)musicVolumeFrame=requestAnimationFrame(step);else musicVolumeFrame=0};musicVolumeFrame=requestAnimationFrame(step)};
  const updateMusicButton=()=>{if(!musicToggle||!backgroundMusic)return;const playing=!backgroundMusic.paused;musicToggle.classList.toggle('is-playing',playing);musicToggle.setAttribute('aria-label',playing?'Pausar música':'Reproduzir música');musicToggle.title=playing?'Pausar música':'Reproduzir música';musicToggle.querySelector('span').textContent=playing?'♫':'♪'};
  const startMusic=()=>{if(!backgroundMusic||!c.music||document.hidden||!inviteActivated)return;const hasGraph=prepareMusicGraph();if(hasGraph&&musicContext.state==='suspended')musicContext.resume();if(!hasGraph)backgroundMusic.volume=.012;const attempt=backgroundMusic.play();if(attempt&&typeof attempt.then==='function')attempt.then(()=>{fadeMusicIn();musicToggle.hidden=false;updateMusicButton()}).catch(()=>{musicToggle.hidden=false;updateMusicButton()})};
  const pauseMusicForBackground=()=>{if(!backgroundMusic||backgroundMusic.paused)return;cancelMusicFade();resumeMusicOnReturn=true;backgroundMusic.pause()};
  const resumeMusicAfterBackground=()=>{if(!document.hidden&&inviteActivated&&resumeMusicOnReturn){resumeMusicOnReturn=false;startMusic()}};
  if(backgroundMusic){backgroundMusic.addEventListener('play',updateMusicButton);backgroundMusic.addEventListener('pause',updateMusicButton);backgroundMusic.addEventListener('error',()=>{musicToggle.hidden=true})}
  if(musicToggle)musicToggle.addEventListener('click',()=>{if(backgroundMusic.paused){resumeMusicOnReturn=false;startMusic()}else{cancelMusicFade();resumeMusicOnReturn=false;backgroundMusic.pause()}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMusicForBackground();else resumeMusicAfterBackground()});
  window.addEventListener('pagehide',pauseMusicForBackground);
  window.addEventListener('pageshow',resumeMusicAfterBackground);
  $('#open-invite').addEventListener('click', () => {
    if(navigator.vibrate)navigator.vibrate(18);
    inviteActivated=true;
    startMusic();
    document.body.classList.add('invitation-opening');
    setTimeout(()=>{
      document.body.classList.remove('cover-locked'); document.body.classList.add('invitation-open');
      $('#convite').setAttribute('aria-hidden','false'); window.scrollTo(0,0);
    },620);
  });
  const target=new Date(c.date).getTime(),tick=()=>{const n=Math.max(0,target-Date.now()),v=[Math.floor(n/86400000),Math.floor(n/3600000)%24,Math.floor(n/60000)%60,Math.floor(n/1000)%60];['days','hours','minutes','seconds'].forEach((id,i)=>$('#'+id).textContent=String(v[i]).padStart(i?2:3,'0'))};tick();setInterval(tick,1000);
  const revealObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target)}}),{threshold:.14}):null;
  $$('.second-intro,.embedded-photo,.section-head,.timeline-entry,.countdown-content,.rsvp-block,.quick-actions,.farewell').forEach(el=>{el.classList.add('scroll-reveal');if(revealObserver)revealObserver.observe(el);else el.classList.add('in-view')});
  $$('button:not(.dialog-close),.quick-actions a').forEach(el=>el.addEventListener('pointerdown',e=>{const r=el.getBoundingClientRect(),s=document.createElement('span'),size=Math.max(r.width,r.height);s.className='tap-ripple';s.style.width=s.style.height=size+'px';s.style.left=(e.clientX-r.left-size/2)+'px';s.style.top=(e.clientY-r.top-size/2)+'px';el.style.position='relative';el.style.overflow='hidden';el.appendChild(s);setTimeout(()=>s.remove(),600)}));
  const addCalendar=()=>{const s=new Date(c.date),e=new Date(s.getTime()+15.5*3600000),fmt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:'+fmt(s),'DTEND:'+fmt(e),'SUMMARY:Casamento de '+c.couple.first+' e '+c.couple.second,'LOCATION:'+c.venue,'END:VEVENT','END:VCALENDAR'].join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='casamento-alessandro-marina.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  $('#calendar-button').addEventListener('click',addCalendar);$('#success-calendar').addEventListener('click',addCalendar);$('#success-map').href=c.mapUrl||'#';
  const dialog=$('#rsvp-dialog'),rsvpButton=$('#rsvp-open');
  const storedReply=()=>{try{const saved=JSON.parse(localStorage.getItem('rsvp_alessandro_marina')||'null');if(saved)return saved}catch(_){}return document.cookie.split(';').some(item=>item.trim().startsWith('rsvp_alessandro_marina='))?{presenca:null}:null};
  const replyNames=reply=>{const detailed=Array.isArray(reply?.pessoasDetalhes)?reply.pessoasDetalhes.map(person=>String(person.nome||'').trim()).filter(Boolean):[];if(detailed.length)return detailed;return Array.isArray(reply?.pessoas)?reply.pessoas.map(person=>String(person).split(' — ')[0].replace(/^\d+\.\s*/,'').trim()).filter(Boolean):[]};
  const listNames=names=>{if(names.length<2)return names[0]||'';if(typeof Intl!=='undefined'&&Intl.ListFormat)return new Intl.ListFormat('pt-PT',{style:'long',type:'conjunction'}).format(names);return names.slice(0,-1).join(', ')+' e '+names[names.length-1]};
  const showReply=(reply,fresh=false)=>{const names=replyNames(reply),invitation=String(reply?.convidadosDoLink||reply?.responsavel||'').trim(),namedGuests=listNames(names);$('#rsvp-form').hidden=true;$('#rsvp-success').hidden=false;$('#success-title').textContent=fresh?'Obrigado pela resposta!':'Resposta já registada';$('#success-copy').textContent=reply?.presenca===true?(names.length===1?'Obrigado, '+namedGuests+'. A tua presença fará parte da nossa história.':names.length>1?'Obrigado, '+namedGuests+'. A vossa presença fará parte da nossa história.':'A vossa presença fará parte da nossa história.'):reply?.presenca===false?(invitation?'Obrigado pela resposta, '+invitation+'. Sentiremos a vossa falta nesse dia.':'Obrigado pela resposta. Sentiremos a vossa falta nesse dia.'):'Já recebemos uma resposta enviada a partir deste dispositivo.'};
  const openRsvp=()=>{const reply=storedReply();if(reply)showReply(reply);else{$('#rsvp-form').hidden=false;$('#rsvp-success').hidden=true}lockPage();dialog.showModal();requestAnimationFrame(()=>{dialog.querySelector('.rsvp-surface').scrollTop=0;dialog.focus({preventScroll:true})})};
  if(storedReply())rsvpButton.querySelector('span').textContent='Resposta enviada ✓';
  rsvpButton.addEventListener('click',openRsvp);$('#rsvp-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',unlockPage);
  const guestCount=$('#guest-count'),guestFields=$('#guest-fields');
  const renderGuests=()=>{
    const count=Math.min(10,Math.max(1,Number(guestCount.value)||1)),old=[...guestFields.querySelectorAll('.guest-card')].map(card=>({name:card.querySelector('[data-person-name]')?.value||'',age:card.querySelector('[data-person-age]')?.value||'',diet:card.querySelector('[data-person-diet]')?.value||''}));
    guestCount.value=count;guestFields.innerHTML=Array.from({length:count},(_,i)=>'<fieldset class="guest-card"><legend>Pessoa '+(i+1)+'</legend><label>Nome<input data-person-name name="person_name_'+(i+1)+'" required value="'+(old[i]?.name||'')+'"></label><label>Faixa etária<select data-person-age name="person_age_'+(i+1)+'" required><option value="">Seleciona</option><option value="adult">Adulto — 18 anos ou mais</option><option value="baby">Criança — até 3 anos</option><option value="child">Criança — 4 a 8 anos</option><option value="youth">Jovem — 9 a 17 anos</option></select></label><label>Restrições alimentares<textarea data-person-diet name="person_diet_'+(i+1)+'" rows="2" placeholder="Nenhuma / opcional">'+(old[i]?.diet||'')+'</textarea></label></fieldset>').join('');
    old.forEach((p,i)=>{const select=guestFields.querySelector('[name="person_age_'+(i+1)+'"]');if(select)select.value=p.age});
  };
  $('#guest-minus').addEventListener('click',()=>{guestCount.value=Math.max(1,Number(guestCount.value)-1);renderGuests()});
  $('#guest-plus').addEventListener('click',()=>{guestCount.value=Math.min(10,Number(guestCount.value)+1);renderGuests()});
  const attendance=$('#attendance-select'),attendeeDetails=$('#attendee-details');
  const updateAttendance=()=>{const coming=attendance.value==='yes';attendeeDetails.hidden=!coming;attendeeDetails.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=!coming)};
  attendance.addEventListener('change',updateAttendance);
  renderGuests();
  updateAttendance();
  $('#success-close').addEventListener('click',()=>dialog.close());
  $('#rsvp-form').addEventListener('submit',async e=>{
    e.preventDefault();if(e.currentTarget.dataset.submitting==='true')return;e.currentTarget.dataset.submitting='true';e.currentTarget.querySelector('[type="submit"]').disabled=true;const form=new FormData(e.currentTarget),coming=form.get('attendance')==='yes',count=coming?Number(form.get('guests')):0,labels={adult:'Adultos (18+)',baby:'Crianças (0–3)',child:'Crianças (4–8)',youth:'Jovens (9–17)'},totals={adult:0,baby:0,child:0,youth:0},people=[],peopleDetails=[];
    for(let i=1;i<=count;i++){const age=form.get('person_age_'+i),name=String(form.get('person_name_'+i)||''),diet=String(form.get('person_diet_'+i)||'Nenhuma');if(totals[age]!==undefined)totals[age]++;peopleDetails.push({nome:name,faixaEtaria:age,restricoes:diet});people.push(i+'. '+name+' — '+labels[age]+' — Restrições: '+diet)}
    const summary=Object.keys(totals).map(k=>labels[k]+': '+totals[k]).join('\n');
    const body=coming?'Responsável: '+form.get('name')+'\nPresença: Sim\nTotal de pessoas: '+count+'\n\n'+summary+'\n\nPESSOAS\n'+people.join('\n'):'Responsável: '+form.get('name')+'\nPresença: Não';
    const payload={responsavel:form.get('name'),convidadosDoLink:invitedName||'',presenca:coming,total:count,contagens:totals,pessoas:people,pessoasDetalhes:peopleDetails,dataResposta:new Date().toISOString()};
    $('#netlify-details').value=JSON.stringify(payload);
    try{localStorage.setItem('rsvp_alessandro_marina',JSON.stringify(payload))}catch(_){}
    document.cookie='rsvp_alessandro_marina=1; Max-Age=31536000; Path=/; SameSite=Lax';
    e.currentTarget.hidden=true;$('#rsvp-success').hidden=false;rsvpButton.querySelector('span').textContent='Resposta enviada ✓';
    dialog.close();setTimeout(()=>{showReply(payload,true);lockPage();dialog.showModal();requestAnimationFrame(()=>{dialog.querySelector('.rsvp-surface').scrollTop=0;dialog.focus({preventScroll:true})})},180);
    let saved=false;
    if(c.rsvpEndpoint){try{const response=await fetch(c.rsvpEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});saved=response.ok}catch(_){}}
    if(!saved&&location.protocol.startsWith('http')){try{const netlifyData=new URLSearchParams();netlifyData.set('form-name','wedding-rsvp');netlifyData.set('name',String(form.get('name')||''));netlifyData.set('attendance',coming?'Sim':'Não');netlifyData.set('guests',String(count));netlifyData.set('details',JSON.stringify(payload));const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:netlifyData.toString()});saved=response.ok}catch(_){}}
    if(!saved&&c.rsvpEmail)location.href='mailto:'+c.rsvpEmail+'?subject='+encodeURIComponent('RSVP — Casamento Alessandro e Marina')+'&body='+encodeURIComponent(body);
    if(navigator.vibrate)navigator.vibrate([20,40,30]);
  });
})();
