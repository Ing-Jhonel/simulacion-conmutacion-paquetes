/* Interacciones locales. No necesita servidor, conexión, bibliotecas ni cuentas. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const core = window.NetworkCore;
  const coords = {1:[65,185],2:[205,75],3:[365,75],4:[205,290],5:[365,290],6:[505,185]};
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cost = value => Number.isFinite(value) ? value : '∞';
  const line = (a,b) => `M${coords[a].join(' ')} L${coords[b].join(' ')}`;
  function selectGroup(selector, attribute, value) {
    $$(selector).forEach(button => {
      const selected=button.getAttribute(attribute)===String(value);
      button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected);
    });
  }
  function nodesSVG(fixed=[],source=1) {
    return core.nodes.map(n=>{
      const [x,y]=coords[n], active=fixed.includes(n), origin=n===source;
      return `<g><circle cx="${x}" cy="${y}" r="22" fill="${origin?'#172b35':active?'#d5ed89':'#f6f7f2'}" stroke="${active?'#6c8b3c':'#87978c'}" stroke-width="${active?2:1.3}"/><text x="${x}" y="${y+5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${origin?'#fff':'#172b35'}">${n}</text></g>`;
    }).join('');
  }
  $('#menu-toggle').addEventListener('click',()=>{
    const open=$('#menu-toggle').getAttribute('aria-expanded')!=='true';
    $('#menu-toggle').setAttribute('aria-expanded',open);$('#navigation').classList.toggle('open',open);
  });
  $$('#navigation a').forEach(a=>a.addEventListener('click',()=>{
    $('#menu-toggle').setAttribute('aria-expanded','false');$('#navigation').classList.remove('open');
  }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){
    $('#menu-toggle').setAttribute('aria-expanded','false');$('#navigation').classList.remove('open');
  }});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){
      $$('#navigation a').forEach(a=>{const active=a.hash==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    }}),{rootMargin:'-15% 0px -55% 0px',threshold:0});
    ['fundamentos','laboratorio','rutas','x25','repaso'].forEach(id=>observer.observe(document.getElementById(id)));
  }

  // Simulación conceptual por estados, con reproducción finita y control manual.
  let mode='datagram',simStep=0,timer=null;
  const simulations={
    datagram:[
      {title:'Tres partes, un mensaje.',text:'El mensaje se divide en P1, P2 y P3. Cada datagrama puede tomar una ruta diferente.',insight:'No hay una fase de establecimiento de conexión.',pos:[1,1,1],arrived:[]},
      {title:'Una decisión por paquete.',text:'P1 toma la ruta superior. P2 y P3 se encaminan por la inferior, según las condiciones del ejemplo.',insight:'Cada paquete lleva información para alcanzar el destino.',pos:[2,4,1],arrived:[]},
      {title:'Los nodos reciben y reenvían.',text:'P1 llega al nodo 3. P2 avanza al nodo 5 y P3 alcanza el nodo 4.',insight:'El enlace 3–6 tiene una espera mayor en este escenario.',pos:[3,5,4],arrived:[]},
      {title:'El segundo llega primero.',text:'P2 llega al destino. P1 sigue esperando su salida del nodo 3; P3 ya está en el nodo 5.',insight:'El orden de envío no garantiza el orden de llegada.',pos:[3,6,5],arrived:[2]},
      {title:'La ruta cambia el retardo.',text:'P3 también llega al nodo 6. P1 todavía está en la ruta superior.',insight:'Las diferencias de cola y recorrido producen retardos distintos.',pos:[3,6,6],arrived:[2,3]},
      {title:'Recibidos. Ahora, a reordenar.',text:'P1 llega al final. En este ejemplo se recibieron P2, P3 y P1; deben reordenarse para reconstruir el mensaje.',insight:'El sistema receptor debe resolver el desorden y detectar pérdidas con los protocolos adecuados.',pos:[6,6,6],arrived:[2,3,1]}
    ],
    virtual:[
      {title:'Primero, una conexión lógica.',text:'Antes de enviar los datos se necesita establecer el circuito virtual entre el origen y el destino.',insight:'La ruta se elige antes de transferir los datos.',pos:[],arrived:[]},
      {title:'Petición de conexión.',text:'La solicitud recorre 1 → 4 → 5 → 6. Los nodos preparan el estado lógico del circuito virtual.',insight:'Establecer una ruta lógica no reserva un cable exclusivo.',pos:[],arrived:[]},
      {title:'Circuito virtual establecido.',text:'La aceptación confirma el circuito. Los tres paquetes utilizarán la misma ruta lógica.',insight:'Los paquetes se identifican mediante el circuito virtual.',pos:[1,1,1],arrived:[]},
      {title:'La misma ruta para los datos.',text:'P1 avanza por el nodo 4. P2 y P3 siguen detrás, asociados a la misma conexión.',insight:'No se calcula una nueva ruta independiente para cada paquete.',pos:[4,1,1],arrived:[]},
      {title:'Transmisiones solapadas.',text:'P1 alcanza el nodo 5 y P2 el nodo 4. Los distintos enlaces pueden trabajar a la vez.',insight:'Los enlaces físicos siguen compartidos con otros circuitos.',pos:[5,4,1],arrived:[]},
      {title:'Primer paquete entregado.',text:'P1 llega al destino; P2 y P3 continúan por la ruta establecida.',insight:'El servicio de circuito virtual descrito mantiene el orden de entrega.',pos:[6,5,4],arrived:[1]},
      {title:'El orden se conserva.',text:'P2 llega detrás de P1. P3 está en el último nodo intermedio.',insight:'La fiabilidad y el control de errores dependen del servicio y de sus protocolos.',pos:[6,6,5],arrived:[1,2]},
      {title:'Mensaje completo y en orden.',text:'Se entregan P1, P2 y P3. Una llamada virtual puede liberarse después del intercambio.',insight:'Si falla un nodo de la ruta, el circuito afectado requiere recuperación o restablecimiento.',pos:[6,6,6],arrived:[1,2,3]}
    ]
  };
  function stopPlayback(){if(timer!==null)clearInterval(timer);timer=null;$('#sim-play').innerHTML='<span aria-hidden="true">▶</span> Reproducir';}
  function drawSimulation(){
    const frames=simulations[mode],frame=frames[simStep],isVirtual=mode==='virtual';
    let svg='<title>Recorrido de paquetes: '+(isVirtual?'circuito virtual':'datagramas')+'</title>';
    [[1,2],[2,3],[3,6],[1,4],[4,5],[5,6],[2,4],[3,5],[3,4]].forEach(([a,b])=>{svg+=`<path d="${line(a,b)}" stroke="#d2dbcd" stroke-width="1.5" fill="none"/>`;});
    if(!isVirtual || simStep>0){
      if(!isVirtual)svg+='<path d="M65 185 205 75 365 75 505 185" stroke="#97b152" stroke-width="3" fill="none"/>';
      svg+='<path d="M65 185 205 290 365 290 505 185" stroke="#4797a2" stroke-width="3" fill="none"/>';
    }
    svg+=nodesSVG(isVirtual&&simStep>=2?[1,4,5,6]:[1],1);
    svg+='<g font-family="Arial,sans-serif" font-size="9" fill="#57666b" text-anchor="middle"><text x="65" y="224">ORIGEN</text><text x="505" y="224">DESTINO</text></g>';
    if(!isVirtual)svg+='<rect x="394" y="98" width="105" height="20" rx="4" fill="#ece6d4"/><text x="446" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#6e5d35">Espera mayor</text>';
    if(isVirtual&&simStep===1)svg+='<text x="282" y="337" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#397d88">Petición: 1 → 4 → 5 → 6</text>';
    if(isVirtual&&simStep===2)svg+='<text x="282" y="337" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#397d88">Aceptación: circuito establecido</text>';
    const groups={};frame.pos.forEach((node,i)=>{if(frame.arrived.includes(i+1))return;(groups[node] ||= []).push(i+1);});
    Object.entries(groups).forEach(([node,packets])=>packets.forEach((packet,k)=>{
      const [x,y]=coords[node],px=x-17+(k-(packets.length-1)/2)*38,py=y-54;
      svg+=`<rect x="${px}" y="${py}" width="34" height="23" rx="4" fill="${packet===1?'#d5ed89':'#6fc6ce'}" stroke="#728d76" stroke-width=".5"/><text x="${px+17}" y="${py+16}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="10" fill="#172b35">P${packet}</text>`;
    }));
    $('#packet-map').innerHTML=svg;
    $('#sim-counter').textContent=`PASO ${simStep} / ${frames.length-1}`;
    $('#sim-title').textContent=frame.title;$('#sim-description').textContent=frame.text;$('#sim-insight').textContent=frame.insight;
    $('#arrival').innerHTML=frame.arrived.length?frame.arrived.map(n=>`<span class="received">P${n}</span>`).join(''):'<span class="empty-arrival">Esperando paquetes…</span>';
    $('#sim-next').disabled=simStep===frames.length-1;
    $('#sim-status').textContent=`Paso ${simStep}. ${frame.title} ${frame.text}`;
    if(simStep===frames.length-1)stopPlayback();
  }
  $$('[data-mode]').forEach(button=>button.addEventListener('click',()=>{stopPlayback();mode=button.dataset.mode;simStep=0;selectGroup('[data-mode]','data-mode',mode);drawSimulation();}));
  $('#sim-next').addEventListener('click',()=>{stopPlayback();if(simStep<simulations[mode].length-1)simStep++;drawSimulation();});
  $('#sim-reset').addEventListener('click',()=>{stopPlayback();simStep=0;drawSimulation();});
  $('#sim-play').addEventListener('click',()=>{
    if(timer!==null){stopPlayback();return;}
    if(simStep===simulations[mode].length-1){simStep=0;drawSimulation();}
    $('#sim-play').innerHTML='<span aria-hidden="true">Ⅱ</span> Pausar';
    timer=setInterval(()=>{simStep++;drawSimulation();},1800);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
  $$('[data-count]').forEach(button=>button.addEventListener('click',()=>{
    const count=Number(button.dataset.count),time=core.packetTime(count);
    selectGroup('[data-count]','data-count',count);
    $('#size-time').textContent=time;$('#size-fill').style.width=`${time/129*100}%`;
    $('#size-detail').textContent=`${40/count+3} octetos por paquete · ${3+count-1} intervalos en el modelo solapado · ${count*3} octetos de cabeceras en el mensaje.`;
  }));

  // Algoritmos reales sobre los 20 arcos dirigidos de la figura 10.6.
  let algorithm='dijkstra',source=1,routeStep=0,routeSteps=core.dijkstra(1);
  const labelPositions=[[115,120],[237,50],[112,257],[285,65],[172,190],[279,184],[391,188],[459,111],[285,311],[457,263]];
  function drawRoutes(){
    const step=routeSteps[routeStep],previous=routeSteps[routeStep-1];
    let svg='<title>Costes dirigidos y rutas conocidas desde el nodo '+source+'</title><desc>Etiquetas de ida y vuelta. El detalle textual de las rutas figura en la tabla contigua.</desc>';
    core.links.forEach(([a,b,ab,ba],i)=>{
      const selected=core.nodes.some(n=>{const path=core.pathTo(source,n,step);return path.some((v,j)=>j>0&&((path[j-1]===a&&v===b)||(path[j-1]===b&&v===a)));}),[x,y]=labelPositions[i];
      const routeLine=a===1&&b===3?'M65 185 Q75 -10 365 75':line(a,b);
      svg+=`<path d="${routeLine}" fill="none" stroke="${selected?'#6e933a':'#d1d9cb'}" stroke-width="${selected?3:1.6}"/>`;
      svg+=`<rect x="${x-21}" y="${y-11}" width="42" height="18" rx="3" fill="#f6f7f2"/><text x="${x}" y="${y+2}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#4d6257">${ab} / ${ba}</text>`;
    });
    svg+=nodesSVG(step.fixed,source);$('#route-map').innerHTML=svg;
    $('#route-counter').textContent=`PASO ${routeStep+1} / ${routeSteps.length}`;
    $('#route-fixed').textContent=algorithm==='dijkstra'?`T = {${step.fixed.join(', ')}}`:`h = ${step.round}`;
    $('#route-explanation').textContent=step.label;
    $('#route-rows').innerHTML=core.nodes.map(n=>{
      const path=core.pathTo(source,n,step),changed=previous&&previous.dist[n]!==step.dist[n];
      return `<tr class="${step.fixed.includes(n)?'fixed ':''}${changed?'changed':''}"><td>${n}${n===source?' · origen':''}</td><td>${cost(step.dist[n])}</td><td>${path.length?path.join(' → '):'Sin ruta'}</td><td>${path.length>1?path[1]:'—'}</td></tr>`;
    }).join('');
    $('#route-prev').disabled=routeStep===0;$('#route-next').disabled=routeStep===routeSteps.length-1;
    $('#algorithm-name').textContent=algorithm==='dijkstra'?'Dijkstra: fijar etiquetas':'Bellman-Ford: mejorar por rondas';
    $('#algorithm-description').textContent=algorithm==='dijkstra'?'Selecciona el nodo pendiente con menor coste y actualiza sus vecinos. Necesita la topología completa y costes no negativos.':'Amplía el máximo de enlaces considerados en cada ronda. Su versión distribuida utiliza los costes locales y las estimaciones de los vecinos.';
    $('#algorithm-formula').textContent=algorithm==='dijkstra'?'L(n) = mín[L(n), L(x) + w(x,n)]':'Lₕ₊₁(n) = mínⱼ[Lₕ(j) + w(j,n)]';
  }
  function resetRoutes(){routeStep=0;routeSteps=algorithm==='dijkstra'?core.dijkstra(source):core.bellmanFord(source);drawRoutes();}
  $$('[data-algorithm]').forEach(button=>button.addEventListener('click',()=>{algorithm=button.dataset.algorithm;selectGroup('[data-algorithm]','data-algorithm',algorithm);resetRoutes();}));
  $('#route-source').addEventListener('change',event=>{source=Number(event.target.value);resetRoutes();});
  $('#route-prev').addEventListener('click',()=>{if(routeStep>0)routeStep--;drawRoutes();});
  $('#route-next').addEventListener('click',()=>{if(routeStep<routeSteps.length-1)routeStep++;drawRoutes();});
  $('#route-reset').addEventListener('click',resetRoutes);

  const layers={
    3:['La conexión lógica entre abonados.','El nivel de paquete identifica los circuitos virtuales y gestiona el establecimiento, los datos, el control de flujo y la liberación.'],
    2:['Una transferencia fiable por el enlace.','LAPB, derivado de HDLC, se ocupa de las tramas entre DTE y DCE. Detecta errores y utiliza confirmaciones y retransmisiones. Sus funciones no son idénticas a las del nivel de paquete.'],
    1:['Las señales también necesitan reglas.','La capa física define la interfaz entre el equipo terminal y el acceso a la red. El capítulo presenta X.21 y también menciona interfaces como EIA-232.']
  };
  $$('[data-layer]').forEach(button=>button.addEventListener('click',()=>{const layer=button.dataset.layer;selectGroup('[data-layer]','data-layer',layer);$('#layer-title').textContent=layers[layer][0];$('#layer-text').textContent=layers[layer][1];}));

  const questions=[
    {topic:'Principios',q:'¿Por qué la conmutación de paquetes aprovecha mejor un enlace con tráfico intermitente?',options:['Reserva toda la capacidad para un usuario.','Comparte la capacidad entre paquetes de distintas comunicaciones.','Elimina las cabeceras y el almacenamiento.'],answer:1,why:'Los enlaces se comparten en el tiempo: cuando una comunicación no envía, otras pueden utilizar la capacidad disponible.'},
    {topic:'Datagramas',q:'P2 llega antes que P1. ¿Es posible en un servicio de datagramas?',options:['Sí, pueden seguir rutas o sufrir esperas diferentes.','No, todos los paquetes tienen el mismo retardo.','Solo si antes se establece un circuito físico.'],answer:0,why:'Cada datagrama se trata de forma independiente. Las diferencias de ruta y cola pueden alterar el orden de llegada.'},
    {topic:'Circuitos virtuales',q:'¿Qué significa establecer un circuito virtual?',options:['Disponer siempre de un cable físico exclusivo.','Eliminar las colas de todos los nodos.','Crear una conexión lógica y una ruta para una secuencia de paquetes.'],answer:2,why:'El circuito virtual fija una conexión lógica. Sus paquetes pueden compartir los enlaces físicos con otras comunicaciones.'},
    {topic:'Mínimo coste',q:'Si 1 → 3 → 6 cuesta 10 y 1 → 4 → 5 → 6 cuesta 4, ¿cuál es la ruta de menor coste?',options:['1 → 3 → 6, porque tiene menos enlaces.','1 → 4 → 5 → 6, porque suma menos coste.','Las dos, porque el destino coincide.'],answer:1,why:'Minimizar el coste significa comparar la suma de los pesos; el número de enlaces es solo una posible métrica.'},
    {topic:'Dijkstra',q:'¿Qué nodo incorpora Dijkstra al conjunto de rutas definitivas en cada paso?',options:['El pendiente con menor coste conocido desde el origen.','El que tiene más vecinos, sin considerar costes.','Cualquier nodo escogido al azar.'],answer:0,why:'Con costes no negativos, la menor etiqueta pendiente ya no puede mejorarse pasando por otros nodos pendientes.'},
    {topic:'Bellman-Ford',q:'En la versión por rondas del capítulo, ¿qué representa h?',options:['El tamaño en octetos de la cabecera.','El número de circuitos virtuales.','El máximo de enlaces admitidos en los caminos considerados.'],answer:2,why:'La ronda h obtiene los mejores costes usando hasta h enlaces. Cada nueva ronda permite considerar un enlace adicional.'},
    {topic:'X.25',q:'¿Qué capa de X.25 ofrece el servicio de circuito virtual externo?',options:['La capa física.','El nivel de paquete.','Solo LAPB, sin un nivel de paquete.'],answer:1,why:'El nivel de paquete ofrece los circuitos virtuales. LAPB gestiona las tramas sobre el enlace DTE–DCE.'},
    {topic:'Congestión',q:'¿Qué puede ocurrir al crecer demasiado el tráfico de una red de paquetes?',options:['No hay consecuencias porque la capacidad es ilimitada.','Todos los paquetes llegan con retardo constante.','Aumentan las colas y el retardo; pueden perderse paquetes.'],answer:2,why:'La capacidad y los búferes son finitos. Las colas elevan el retardo y, si se agota el almacenamiento, puede haber descartes.'}
  ];
  let questionIndex=0,answers=[];
  function updateProgress(){
    $('#quiz-progress').value=answers.length;
    $('#quiz-progress-label').textContent=questionIndex<questions.length?`PREGUNTA ${questionIndex+1} DE ${questions.length}`:'REPASO COMPLETADO';
  }
  function renderQuiz(focus=false){
    updateProgress();
    const q=questions[questionIndex];
    $('#quiz-content').innerHTML=`<p class="eyebrow">${escape(q.topic)}</p><form id="quiz-form"><fieldset class="quiz-options"><legend><h3 id="quiz-question" tabindex="-1">${escape(q.q)}</h3></legend>${q.options.map((option,i)=>`<label class="quiz-option"><input type="radio" name="answer" value="${i}" required><span>${escape(option)}</span></label>`).join('')}</fieldset><button class="button primary" type="submit">Comprobar respuesta →</button><div id="quiz-feedback" aria-live="polite"></div></form>`;
    $('#quiz-form').addEventListener('submit',event=>{
      event.preventDefault();const selected=$('input[name="answer"]:checked');if(!selected)return;
      const answer=Number(selected.value),correct=answer===q.answer;answers.push({correct,topic:q.topic});
      $$('.quiz-option').forEach((label,i)=>{label.classList.toggle('correct',i===q.answer);label.classList.toggle('incorrect',i===answer&&!correct);label.querySelector('input').disabled=true;});
      $('#quiz-form button[type="submit"]').disabled=true;
      $('#quiz-feedback').innerHTML=`<div class="quiz-feedback"><strong>${correct?'Respuesta correcta.':'Revisa esta idea.'}</strong>${escape(q.why)}</div><button id="quiz-next" type="button" class="button primary">${questionIndex===questions.length-1?'Ver resultado':'Siguiente pregunta'} →</button>`;
      $('#quiz-progress').value=answers.length;
      $('#quiz-next').addEventListener('click',()=>{questionIndex++;if(questionIndex===questions.length)renderResult();else renderQuiz(true);});
      $('#quiz-next').focus({preventScroll:true});
    },{once:true});
    if(focus){$('#quiz-question').focus({preventScroll:true});$('#quiz-question').scrollIntoView({block:'center',behavior:'instant'});}
  }
  function renderResult(){
    const score=answers.filter(a=>a.correct).length,review=answers.filter(a=>!a.correct).map(a=>a.topic);updateProgress();
    $('#quiz-content').innerHTML=`<p class="eyebrow">MENSAJE RECIBIDO</p><div class="quiz-result-number" id="quiz-result" tabindex="-1">${score}<small> / ${questions.length}</small></div><h3>${score===8?'Todos los conceptos llegaron.':score>=5?'La ruta está bastante clara.':'Vale la pena recorrer la red otra vez.'}</h3><p class="quiz-result-copy">${score===8?'Distingues las técnicas de conmutación y reconoces cómo se buscan rutas y se organizan las capas de X.25.':'Vuelve a las secciones para reforzar las ideas y repite el cuestionario cuando quieras.'}</p>${review.length?`<p class="small">Temas para repasar:</p><ul class="quiz-review">${review.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:''}<button type="button" id="quiz-restart" class="button primary">Repetir cuestionario ↺</button>`;
    $('#quiz-restart').addEventListener('click',()=>{questionIndex=0;answers=[];renderQuiz(true);});$('#quiz-result').focus({preventScroll:true});$('#quiz-result').scrollIntoView({block:'center',behavior:'instant'});
  }
  drawSimulation();drawRoutes();renderQuiz();
})();
