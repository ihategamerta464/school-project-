(()=>{'use strict';
const $=id=>document.getElementById(id);
const WORLD_SCALE=.43,ROAD_WIDTH=22,MAX_SPEED=92,MAX_REVERSE_SPEED=12,TRACK_SAMPLES=900,START_INDEX=18,CAR_RADIUS=1.62,BARRIER_CENTRE=ROAD_WIDTH/2+6.5;
let scene,camera,renderer,car,body,frontWing,rearWing,frontWheels=[],rearWheels=[],trackSamples=[],trackTangents=[],trackCurve,clock=new THREE.Clock();
const solidBoxes=[],solidCircles=[],impactEffects=[],wingDebris=[];let collisionCooldown=0,collisionShake=0,collisionBanner=0,collisionKind='',impactDetail='',damage=0,sparkGeometry=null,sparkMaterial=null;
let bots=[],cornerLimit=[],trackDs=1,startTimer=3,lastCount=-1,pastStart=false,finishCounter=0,playerFinishRank=0,playerProg=0,carHitCooldown=0,sunLight=null,cloudGroup=null,sunDiskRef=null,fxEnabled=true,puffTimer=0,puffGeo=null,quality='high',difficulty='normal',towerTick=0;
const PLAYER_GRID_BACK=42;
let chassisDamage=0,engineIntegrity=100,tyreIntegrity=[100,100,100,100],tyrePunctured=[false,false,false,false],wrecked=false,scrapeTimer=0,sparkTimer=0,smokeTimer=0,frameDt=.016;const TYRE_KEYS=['tyreFL','tyreFR','tyreRL','tyreRR'];
let frontWingIntegrity=100,rearWingIntegrity=100,suspensionIntegrity=100,steeringBias=0,frontWingBend=0,rearWingBend=0,frontWingDetached=false,rearWingDetached=false;
let started=false,paused=false,muted=false,raceFinished=false,audioCtx,osc1,osc2,filter,gain,mix,compressor;
let speed=0,heading=0,steer=0,steerAngle=0,slipAngle=0,lap=1,lapTime=0,best=Infinity,lastProgress=0,offroad=false,toastTimer=0,previousGear=1,ers=100,cameraMode=0,sensitivity=1,frameCount=0,elapsed=0,lapStartToast=false;
const keys=Object.create(null),materialCache={};
const CONTROL_DEFAULTS={accelerate:['KeyW','ArrowUp'],reverse:['KeyS'],brake:['Space'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],boost:['KeyE','ShiftLeft','ShiftRight'],camera:['KeyC'],pause:['KeyP','Escape'],reset:['KeyR']};
let controlBindings=JSON.parse(JSON.stringify(CONTROL_DEFAULTS)),mobileActions=new Set(),controlCaptureAction=null,language='en';
const STRINGS={
 en:{arcade:'ARCADE',arcadeBtn:'♠ ARCADE: POKER · PLINKO · BLACKJACK',position:'POSITION',you:'YOU',carContact:'CAR CONTACT',quality:'GRAPHICS QUALITY',qLow:'Standard',qHigh:'High',qUltra:'Ultra',difficulty:'AI DIFFICULTY',diffEasy:'Easy',diffNormal:'Normal',diffHard:'Hard',gridGo:'GO! GO! GO!',lightsOut:'LIGHTS OUT — GREEN FLAG',engine:'ENGINE',tyres:'TYRES',tyreFL:'FL',tyreFR:'FR',tyreRL:'RL',tyreRR:'RR',punctured:'FLAT',engineImpact:'ENGINE DAMAGED',tyreImpact:'TYRE DAMAGED',tyrePuncture:'PUNCTURE',wrecked:'CAR WRECKED — LIMP MODE',wreckedCopy:'The chassis is destroyed and the car can barely move. Press R to repair and reset the session.',scrape:'SCRAPING BARRIER',scrapeCopy:'Sliding along the wall wears the tyres and bodywork. Steer away to stop the damage.',settings:'SETTINGS',optionsEyebrow:'GAME OPTIONS',language:'LANGUAGE',controls:'CONTROLS',controlsHint:'Choose a control, then press the key you want to use.',resetControls:'RESTORE DEFAULT CONTROLS',keyConflict:'That key is already assigned to another action.',done:'DONE',changeKey:'CHANGE',pressKey:'PRESS A KEY…',reservedKey:'That key is reserved for a game command.',controlSaved:'CONTROL UPDATED',controlsRestored:'DEFAULT CONTROLS RESTORED',suspension:'SUSPENSION',suspensionImpact:'SUSPENSION DAMAGED',bent:'BENT',damaged:'DAMAGED',detached:'DETACHED',missing:'MISSING',impact:'IMPACT',barrierImpact:'BARRIER IMPACT',objectImpact:'OBJECT IMPACT',runoffSurface:'RUNOFF',curbGrass:'CURB / GRASS',tarmac:'TARMAC',reverseGear:'REVERSE',reverseStatus:'REVERSING',reverseCopy:'Hold {key} to reverse; press {brake} to stop.',lapComplete:'LAP {lap} COMPLETE · {time}',raceComplete:'CHEQUERED FLAG · SESSION COMPLETE',accelerate:'ACCELERATE',reverse:'REVERSE',brake:'BRAKE',left:'TURN LEFT',right:'TURN RIGHT',camera:'CAMERA',cameraChase:'CHASE CAM',cameraCockpit:'COCKPIT CAM',cameraTv:'TV CAM',pause:'PAUSE',flightDeck:'FLIGHT DECK',brandSub:'COASTLINE MOTORSPORTS',pageTitle:'APEX GP — Coastline Grand Prix',circuitMap:'CIRCUIT MAP',coastGp:'COASTLINE GP',trackLength:'2.55 KM CIRCUIT',telemetry:'APEX TELEMETRY',engineRevs:'ENGINE REVOLUTION',gear:'GEAR',throttle:'THROTTLE',driverStatus:'DRIVER STATUS',carDamage:'CAR DAMAGE',frontWing:'FRONT WING',rearWing:'REAR WING',session:'SESSION',lap:'LAP',best:'BEST',time:'TIME',soundOn:'SOUND ON',soundOff:'SOUND OFF',liveTrack:'LIVE TRACK',raceMode:'RACE MODE · DRY',ersMode:'ERS DEPLOYED · DRY',overtake:'⚡ OVERTAKE',deploying:'⚡ DEPLOYING',heroEyebrow:'APEX MOTORSPORTS · DRIVER PROGRAM',heroTitle:'CHASE THE<br><span>HORIZON.</span>',heroDesc:'A coastal street-circuit sprint with a clear racing surface and trackside structures kept outside the barriers. Take the wheel of the APEX R-01 and find the limit through the sunset sector.',tagCircuit:'3D COASTAL CIRCUIT',tagCar:'OPEN-WHEEL CAR',tagTelemetry:'LIVE TELEMETRY',tagERS:'OVERTAKE ERS',startRace:'START GRAND PRIX ↗',drivingGuide:'DRIVING GUIDE',prototypeNote:'Browser racing prototype with procedural scenery and synthesized engine audio. Three.js loads from a CDN, so an internet connection is required.',eventKicker:'ROUND 01 / SUNSET SPRINT',eventTitle:'COASTLINE<br>GRAND PRIX',eventDesc:'Palm-lined straights. Technical final sector. One clean lap can change everything.',trackLengthLabel:'TRACK LENGTH',raceDistance:'RACE DISTANCE',carLabel:'CAR',conditions:'CONDITIONS',dryGolden:'DRY / GOLDEN',steerResponse:'STEERING RESPONSE',startHints:'{accelerate} ACCELERATE · {reverse} REVERSE · {brake} BRAKE<br>{left} LEFT · {right} RIGHT · {boost} OVERTAKE<br>{camera} CAMERA · {pause} PAUSE · {reset} RESET',pauseEyebrow:'APEX GP / SESSION CONTROL',racePaused:'RACE PAUSED.',pauseCopy:'Take a breath. The track is waiting. Resume when you are ready.',resume:'RESUME RACE',restart:'RESTART SESSION',guideEyebrow:'DRIVER SCHOOL / QUICK GUIDE',smoothFast:'SMOOTH IS FAST.',guideCopy:'Brake before the corner, release the brake as you turn, and unwind the steering as you return to throttle. If the front washes wide, lift off and reduce steering input.',steer:'Steer',overtakeERS:'Overtake ERS',overtakeControl:'OVERTAKE ERS',cameraControl:'CAMERA',pauseControl:'PAUSE / RESUME',resetControl:'RESET CAR',changeCamera:'Change camera',resetCar:'Reset car',impactHelp:'Barriers and objects damage the car',gotIt:'GOT IT',driveHints:'<b>{accelerate}</b> ACCELERATE · <b>{reverse}</b> REVERSE · <b>{brake}</b> BRAKE<br><b>{left} / {right}</b> STEER · <b>{boost}</b> OVERTAKE · <b>{camera}</b> CAMERA · <b>{pause}</b> PAUSE · <b>{reset}</b> RESET',waitGreen:'WAITING FOR GREEN LIGHT',waitCopy:'Build speed down the main straight. Brake in a straight line, then turn in smoothly.',greenFlag:'GREEN FLAG — BUILD SPEED',greenCopy:'Brake before tight corners. Keep the car settled as you turn in.',runoff:'RUNOFF AREA — LIFT AND REJOIN',runoffCopy:'Low grip here. Ease off the throttle and guide the car back to the racing surface.',offTrack:'OFF TRACK — LOW GRIP',offTrackCopy:'You are outside the racing line. Reduce steering and rejoin smoothly.',boostActive:'OVERTAKE ERS ACTIVE',boostCopy:'Energy deploying. Use it on the main straight for maximum effect.',understeer:'FRONT TIRES SATURATED',understeerCopy:'The car is understeering. Brake earlier and unwind the steering a little.',slip:'TIRE SLIP — SETTLE THE CAR',slipCopy:'Ease off the input until the tires find grip again.',pushLap:'PUSH LAP — BRAKE FOR THE NEXT CORNER',pushCopy:'Keep the car straight under braking. Turn in after speed comes down.',cleanLine:'CLEAN LINE — BUILD SPEED',cleanCopy:'Smooth steering and an early exit throttle make the lap faster.',impactCopy:'Speed lost and car damage increased. Avoid repeat contact; press R to repair and reset the session.',wingImpactCopy:'Aerodynamic grip is reduced. Press R to repair the car and wings.',impactToast:'IMPACT · SPEED LOST',carReset:'RACE RESET — GET READY',sessionReset:'SESSION RESET',paused:'SESSION PAUSED',chequered:'CHEQUERED FLAG — RACE COMPLETE',chequeredCopy:'You brought it home. Restart the session to chase a faster lap.'},
 es:{arcade:'ARCADE',arcadeBtn:'♠ ARCADE: PÓKER · PLINKO · BLACKJACK',position:'POSICIÓN',you:'TÚ',carContact:'CONTACTO CON COCHE',quality:'CALIDAD GRÁFICA',qLow:'Estándar',qHigh:'Alta',qUltra:'Ultra',difficulty:'DIFICULTAD DE LA IA',diffEasy:'Fácil',diffNormal:'Normal',diffHard:'Difícil',gridGo:'¡YA! ¡YA! ¡YA!',lightsOut:'SEMÁFOROS APAGADOS — BANDERA VERDE',engine:'MOTOR',tyres:'NEUMÁTICOS',tyreFL:'DI',tyreFR:'DD',tyreRL:'TI',tyreRR:'TD',punctured:'PINCHADO',engineImpact:'MOTOR DAÑADO',tyreImpact:'NEUMÁTICO DAÑADO',tyrePuncture:'PINCHAZO',wrecked:'COCHE DESTROZADO — MODO AVERÍA',wreckedCopy:'El chasis está destruido y el coche apenas avanza. Pulsa R para reparar y reiniciar la sesión.',scrape:'ROZANDO LA BARRERA',scrapeCopy:'Deslizarte por el muro desgasta neumáticos y carrocería. Aléjate para parar el daño.',settings:'AJUSTES',optionsEyebrow:'OPCIONES DEL JUEGO',language:'IDIOMA',controls:'CONTROLES',controlsHint:'Elige una acción y pulsa la tecla que quieras asignar.',resetControls:'RESTAURAR CONTROLES',keyConflict:'Esa tecla ya está asignada a otra acción.',done:'LISTO',changeKey:'CAMBIAR',pressKey:'PULSA UNA TECLA…',reservedKey:'Esa tecla está reservada para una acción del juego.',controlSaved:'CONTROL ACTUALIZADO',controlsRestored:'CONTROLES RESTAURADOS',suspension:'SUSPENSIÓN',suspensionImpact:'SUSPENSIÓN DAÑADA',bent:'DOBLADO',damaged:'DAÑADO',detached:'DESPRENDIDO',missing:'AUSENTE',impact:'IMPACTO',barrierImpact:'IMPACTO CON BARRERA',objectImpact:'IMPACTO',runoffSurface:'ESCAPE',curbGrass:'BORDE / HIERBA',tarmac:'ASFALTO',reverseGear:'MARCHA ATRÁS',reverseStatus:'MARCHA ATRÁS',reverseCopy:'Mantén {key} para retroceder; pulsa {brake} para frenar.',lapComplete:'VUELTA {lap} COMPLETADA · {time}',raceComplete:'BANDERA A CUADROS · CARRERA TERMINADA',accelerate:'ACELERAR',reverse:'MARCHA ATRÁS',brake:'FRENAR',left:'GIRAR A LA IZQUIERDA',right:'GIRAR A LA DERECHA',camera:'CÁMARA',cameraChase:'CÁMARA TRASERA',cameraCockpit:'CÁMARA DE CABINA',cameraTv:'CÁMARA TV',pause:'PAUSA',flightDeck:'PANEL DE VUELO',brandSub:'MOTORSPORT COSTERO',pageTitle:'APEX GP — Gran Premio Costero',circuitMap:'MAPA DEL CIRCUITO',coastGp:'GP COSTERO',trackLength:'CIRCUITO DE 2,55 KM',telemetry:'TELEMETRÍA APEX',engineRevs:'REVOLUCIONES DEL MOTOR',gear:'MARCHA',throttle:'ACELERADOR',driverStatus:'ESTADO DEL PILOTO',carDamage:'DAÑOS DEL COCHE',frontWing:'ALERÓN DELANTERO',rearWing:'ALERÓN TRASERO',session:'SESIÓN',lap:'VUELTA',best:'RÉCORD',time:'TIEMPO',soundOn:'SONIDO SÍ',soundOff:'SONIDO NO',liveTrack:'PISTA EN VIVO',raceMode:'CARRERA · SECO',ersMode:'ERS ACTIVADO · SECO',overtake:'⚡ ADELANTAR',deploying:'⚡ ACTIVADO',heroEyebrow:'APEX MOTORSPORTS · PROGRAMA DE PILOTOS',heroTitle:'PERSIGUE EL<br><span>HORIZONTE.</span>',heroDesc:'Un sprint por un circuito costero con una pista despejada y estructuras fuera de las barreras. Ponte al volante del APEX R-01 y encuentra el límite en el sector del atardecer.',tagCircuit:'CIRCUITO COSTERO 3D',tagCar:'MONOPLAZA',tagTelemetry:'TELEMETRÍA EN VIVO',tagERS:'ERS DE ADELANTAMIENTO',startRace:'INICIAR GRAN PREMIO ↗',drivingGuide:'GUÍA DE CONDUCCIÓN',prototypeNote:'Prototipo de carreras en navegador con escenario procedural y audio de motor sintetizado. Three.js se carga desde CDN y requiere conexión a internet.',eventKicker:'RONDA 01 / SPRINT AL ATARDECER',eventTitle:'GRAN PREMIO<br>COSTERO',eventDesc:'Rectas con palmeras. Sector final técnico. Una vuelta limpia puede cambiarlo todo.',trackLengthLabel:'LONGITUD DEL CIRCUITO',raceDistance:'DISTANCIA DE CARRERA',carLabel:'COCHE',conditions:'CONDICIONES',dryGolden:'SECO / ATARDECER',steerResponse:'RESPUESTA DE DIRECCIÓN',startHints:'{accelerate} ACELERAR · {reverse} ATRÁS · {brake} FRENAR<br>{left} IZQUIERDA · {right} DERECHA · {boost} ADELANTAR<br>{camera} CÁMARA · {pause} PAUSA · {reset} REINICIAR',pauseEyebrow:'APEX GP / CONTROL DE SESIÓN',racePaused:'CARRERA EN PAUSA.',pauseCopy:'Tómate un respiro. La pista te espera. Continúa cuando quieras.',resume:'CONTINUAR',restart:'REINICIAR SESIÓN',guideEyebrow:'ESCUELA DE PILOTOS / GUÍA',smoothFast:'SUAVE ES RÁPIDO.',guideCopy:'Frena antes de la curva, suelta el freno al girar y endereza el volante al acelerar. Si el coche subvira, reduce el acelerador y el giro.',steer:'Dirección',overtakeERS:'ERS de adelantamiento',overtakeControl:'ERS DE ADELANTAMIENTO',cameraControl:'CÁMARA',pauseControl:'PAUSA / REANUDAR',resetControl:'REINICIAR COCHE',changeCamera:'Cambiar cámara',resetCar:'Reiniciar coche',impactHelp:'Las barreras y los objetos dañan el coche',gotIt:'ENTENDIDO',driveHints:'<b>{accelerate}</b> ACELERAR · <b>{reverse}</b> ATRÁS · <b>{brake}</b> FRENAR<br><b>{left} / {right}</b> GIRAR · <b>{boost}</b> ADELANTAR · <b>{camera}</b> CÁMARA · <b>{pause}</b> PAUSA · <b>{reset}</b> REINICIAR',waitGreen:'ESPERANDO LA LUZ VERDE',waitCopy:'Acelera en la recta principal. Frena en línea recta y gira suavemente.',greenFlag:'LUZ VERDE — ACELERA',greenCopy:'Frena antes de las curvas cerradas y estabiliza el coche al girar.',runoff:'ZONA DE ESCAPE — LEVANTA Y REGRESA',runoffCopy:'Hay poco agarre. Suelta el acelerador y vuelve a la pista.',offTrack:'FUERA DE PISTA — POCO AGARRE',offTrackCopy:'Estás fuera de la trazada. Reduce el giro y regresa con suavidad.',boostActive:'ERS DE ADELANTAMIENTO ACTIVO',boostCopy:'Energía desplegada. Úsala en la recta principal.',understeer:'NEUMÁTICOS DELANTEROS SATURADOS',understeerCopy:'El coche subvira. Frena antes y reduce el giro.',slip:'NEUMÁTICOS DESLIZANDO — ESTABILIZA EL COCHE',slipCopy:'Reduce las acciones hasta recuperar el agarre.',pushLap:'VUELTA RÁPIDA — FRENA PARA LA CURVA',pushCopy:'Mantén el coche recto al frenar. Gira cuando baje la velocidad.',cleanLine:'TRAZADA LIMPIA — AUMENTA LA VELOCIDAD',cleanCopy:'Gira suavemente y acelera pronto al salir para ganar tiempo.',impactCopy:'Has perdido velocidad y el coche está dañado. Evita más golpes; pulsa R para reparar y reiniciar.',wingImpactCopy:'El agarre aerodinámico se ha reducido. Pulsa R para reparar el coche y los alerones.',impactToast:'IMPACTO · VELOCIDAD PERDIDA',carReset:'CARRERA REINICIADA — PREPÁRATE',sessionReset:'SESIÓN REINICIADA',paused:'SESIÓN EN PAUSA',chequered:'BANDERA A CUADROS — CARRERA TERMINADA',chequeredCopy:'Has terminado la carrera. Reinicia la sesión para mejorar tu vuelta.'}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const damp=(a,b,k,dt)=>THREE.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
const t=key=>STRINGS[language]?.[key]??STRINGS.en[key]??key;
function loadGameSettings(){try{const data=JSON.parse(localStorage.getItem('apexSettings')||'{}');if(data.language==='es')language='es';if(['low','high','ultra'].includes(data.quality))quality=data.quality;if(['easy','normal','hard'].includes(data.difficulty))difficulty=data.difficulty;if(data.controls&&typeof data.controls==='object'){for(const action of Object.keys(CONTROL_DEFAULTS)){const codes=data.controls[action];if(Array.isArray(codes)&&codes.length&&codes.every(code=>typeof code==='string'))controlBindings[action]=codes.slice(0,3);}}}catch(_){}}
function saveGameSettings(){try{localStorage.setItem('apexSettings',JSON.stringify({language,controls:controlBindings,quality,difficulty}));}catch(_){}}
function actionDown(action){return mobileActions.has(action)||(controlBindings[action]||[]).some(code=>keys[code]);}
function controlUses(action,code){return(controlBindings[action]||[]).includes(code);}
function keyName(code){const names={ArrowLeft:'←',ArrowUp:'↑',ArrowRight:'→',ArrowDown:'↓',Space:'SPACE',ShiftLeft:'LEFT SHIFT',ShiftRight:'RIGHT SHIFT',ControlLeft:'LEFT CTRL',ControlRight:'RIGHT CTRL',Escape:'ESC'};if(names[code])return names[code];if(code.startsWith('Key'))return code.slice(3);if(code.startsWith('Digit'))return code.slice(5);return code;}
function keysLabel(action){return(controlBindings[action]||[]).map(keyName).join('/')||'—';}
function localizeKeyHints(key){return t(key).replace('{accelerate}',keysLabel('accelerate')).replace('{reverse}',keysLabel('reverse')).replace('{brake}',keysLabel('brake')).replace('{left}',keysLabel('left')).replace('{right}',keysLabel('right')).replace('{boost}',keysLabel('boost')).replace('{camera}',keysLabel('camera')).replace('{pause}',keysLabel('pause')).replace('{reset}',keysLabel('reset'));}
function renderControlRows(){const host=$('controlRows');if(!host)return;const actions=['accelerate','reverse','brake','left','right','boost','camera','pause','reset'];const labels={boost:'overtakeControl',camera:'cameraControl',pause:'pauseControl',reset:'resetControl'};host.innerHTML=actions.map(action=>`<div class="control-row"><span>${t(labels[action]||action)}</span><button class="control-bind${controlCaptureAction===action?' listening':''}" data-bind-action="${action}">${controlCaptureAction===action?t('pressKey'):(controlBindings[action]||[]).map(keyName).join(' / ')} · ${t('changeKey')}</button></div>`).join('');}
function applyLanguage(){document.documentElement.lang=language;document.title=t('pageTitle');document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});document.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml);});if($('languageSelect'))$('languageSelect').value=language;if($('qualitySelect'))$('qualitySelect').value=quality;if($('difficultySelect'))$('difficultySelect').value=difficulty;if($('driveHints'))$('driveHints').innerHTML=localizeKeyHints('driveHints');if($('startHints'))$('startHints').innerHTML=localizeKeyHints('startHints');const steerLabel=$('steerResponseLabel');if(steerLabel)steerLabel.innerHTML=`${t('steerResponse')} <strong id="senseReadout">${Math.round(sensitivity*100)}%</strong>`;if($('sound'))$('sound').querySelector('.label').textContent=muted?t('soundOff'):t('soundOn');if($('cameraBtn'))$('cameraBtn').querySelector('.label').textContent=[t('cameraChase'),t('cameraCockpit'),t('cameraTv')][cameraMode]||t('camera');if($('pauseBtn'))$('pauseBtn').querySelector('.label').textContent=t('pause');if($('boostBtn'))$('boostBtn').textContent=t('overtake');if($('mapState'))$('mapState').textContent=t('liveTrack');if($('driveMode'))$('driveMode').textContent=t('raceMode');if(!started&&$('status')){$('status').textContent=t('waitGreen');$('substatus').textContent=t('waitCopy');}else if(paused&&$('status'))$('status').textContent=t('paused');document.querySelectorAll('[data-keys]').forEach(el=>{el.textContent=el.dataset.keys.split(',').map(a=>keysLabel(a).replace(/\//g,' / ')).join('  ·  ');});renderControlRows();}
function openSettings(){controlCaptureAction=null;keysClear();$('settingsModal').classList.add('show');renderControlRows();}
function closeSettings(){controlCaptureAction=null;$('settingsModal').classList.remove('show');renderControlRows();}
function keysClear(){for(const key in keys)keys[key]=false;mobileActions.clear();}
function registerSolidBox(x,z,hx,hz,yaw=0,kind='OBJECT'){solidBoxes.push({x,z,hx,hz,yaw,kind});}
function registerSolidCircle(x,z,r,kind='OBJECT'){solidCircles.push({x,z,r,kind});}
const M=(c,r=.78,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,envMapIntensity:.6});
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function skyTexture(){return canvasTexture(2048,1024,(ctx,w,h)=>{const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#4d7397');g.addColorStop(.33,'#8ca9bd');g.addColorStop(.60,'#efb59a');g.addColorStop(.77,'#f5c49b');g.addColorStop(1,'#667f87');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(let i=0;i<170;i++){const x=Math.random()*w,y=h*(.3+Math.random()*.44),ww=50+Math.random()*260,hh=4+Math.random()*15;ctx.globalAlpha=.025+Math.random()*.055;ctx.fillStyle=i%3?'#fff4e5':'#405b73';ctx.beginPath();ctx.ellipse(x,y,ww,hh,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;});}
function asphaltTexture(){return canvasTexture(512,512,(ctx,w,h)=>{ctx.fillStyle='#292d31';ctx.fillRect(0,0,w,h);for(let i=0;i<26000;i++){const v=30+Math.random()*55;ctx.fillStyle=`rgba(${v},${v+Math.random()*4},${v+Math.random()*6},${.08+Math.random()*.18})`;ctx.fillRect(Math.random()*w,Math.random()*h,Math.random()*2+.3,Math.random()*2+.3);}for(let i=0;i<40;i++){ctx.strokeStyle=`rgba(8,10,12,${Math.random()*.11})`;ctx.lineWidth=1+Math.random()*3;ctx.beginPath();const x=Math.random()*w,y=Math.random()*h;ctx.moveTo(x,y);ctx.lineTo(x+(Math.random()-.5)*130,y+Math.random()*90);ctx.stroke();}});}
function grassTexture(){return canvasTexture(512,512,(ctx,w,h)=>{ctx.fillStyle='#537952';ctx.fillRect(0,0,w,h);for(let i=0;i<32000;i++){const r=Math.random(),c=r>.72?[41,79,51]:r>.35?[73,112,62]:[93,128,70];ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${.15+Math.random()*.35})`;ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}});}
function runoffTexture(){return canvasTexture(256,256,(ctx,w,h)=>{ctx.fillStyle='#ded6c8';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(-130,0);ctx.rotate(-Math.PI/4);for(let x=-300;x<500;x+=32){ctx.fillStyle=(Math.floor(x/32)%2===0)?'#dd4b52':'#f2e5d3';ctx.fillRect(x,-100,16,600);}ctx.restore();for(let i=0;i<2000;i++){ctx.fillStyle=`rgba(65,68,67,${Math.random()*.07})`;ctx.fillRect(Math.random()*w,Math.random()*h,1,1);}});}
function windowTexture(base,lit){return canvasTexture(256,512,(ctx,w,h)=>{const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,base);g.addColorStop(.5,'#293e50');g.addColorStop(1,'#111e2d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(157,191,214,.17)';ctx.lineWidth=3;for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=27){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();for(let x=4;x<w;x+=32){if(Math.random()<lit){ctx.fillStyle=Math.random()>.5?'rgba(255,202,143,.8)':'rgba(116,219,224,.62)';ctx.fillRect(x,y+4,16,12);}}}});}
function signTexture(title,sub,color){return canvasTexture(512,160,(ctx,w,h)=>{ctx.fillStyle='#08121d';ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.fillRect(0,0,10,h);ctx.fillStyle='#f7f8fa';ctx.font='900 54px Arial';ctx.fillText(title,30,72);ctx.fillStyle='#8fded8';ctx.font='bold 18px Arial';ctx.fillText(sub.toUpperCase(),33,112);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(30,128,w-55,2);});}
function init(){
 solidBoxes.length=0;solidCircles.length=0;impactEffects.length=0;wingDebris.length=0;collisionCooldown=0;collisionShake=0;collisionBanner=0;damage=0;impactDetail='';
 try{const saved=Number(localStorage.getItem('apexBest'));if(saved>0)best=saved;}catch(_){}
 scene=new THREE.Scene();scene.background=new THREE.Color(0xa4b5c1);scene.fog=new THREE.FogExp2(0xd2a995,.00145);
 camera=new THREE.PerspectiveCamera(61,innerWidth/innerHeight,.1,2200);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.id='gameCanvas';renderer.domElement.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none';document.body.insertBefore(renderer.domElement,document.body.firstChild);
 const skyTex=skyTexture();const sky=new THREE.Mesh(new THREE.SphereGeometry(1150,48,32),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,depthWrite:false}));buildEnvironment(skyTex);sky.renderOrder=-5;scene.add(sky);
 scene.add(new THREE.HemisphereLight(0xe4f5ff,0x384238,1.05));const sun=new THREE.DirectionalLight(0xffd9b5,3.3);sun.position.set(-160,190,-40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;sun.shadow.camera.near=1;sun.shadow.camera.far=700;sunLight=sun;sun.shadow.bias=-.00035;sun.shadow.normalBias=.035;scene.add(sun);sun.target.position.set(0,0,0);scene.add(sun.target);
 const sunDisk=new THREE.Mesh(new THREE.SphereGeometry(24,24,18),new THREE.MeshBasicMaterial({color:0xffd7a1}));sunDisk.position.set(380,125,-470);scene.add(sunDisk);sunDiskRef=sunDisk;buildClouds();
 const groundTex=grassTexture();groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(48,38);const ground=new THREE.Mesh(new THREE.PlaneGeometry(1800,1450),new THREE.MeshStandardMaterial({map:groundTex,color:0xb5c1a4,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.48;ground.receiveShadow=true;scene.add(ground);
 // Coastal water and pale sand banks create a strong horizon and color contrast.
 const waterTex=canvasTexture(512,512,(ctx,w,h)=>{ctx.fillStyle='#2c98a5';ctx.fillRect(0,0,w,h);for(let i=0;i<950;i++){ctx.strokeStyle=`rgba(${150+Math.random()*70},${220+Math.random()*30},${226+Math.random()*28},${.03+Math.random()*.14})`;ctx.lineWidth=.5+Math.random()*2;ctx.beginPath();const x=Math.random()*w,y=Math.random()*h;ctx.moveTo(x,y);ctx.lineTo(x+15+Math.random()*90,y+(Math.random()-.5)*3);ctx.stroke();}});waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(8,10);const water=new THREE.Mesh(new THREE.PlaneGeometry(800,1200),new THREE.MeshPhysicalMaterial({map:waterTex,color:0x75b6bf,roughness:.3,metalness:.12,clearcoat:.45,clearcoatRoughness:.4}));water.rotation.x=-Math.PI/2;water.position.set(730,-.31,0);water.receiveShadow=true;scene.add(water);
 const sand=new THREE.Mesh(new THREE.PlaneGeometry(115,1150),M(0xd5bd98,1));sand.rotation.x=-Math.PI/2;sand.position.set(270,-.40,0);scene.add(sand);
 buildTrack();buildScenery();buildCar();buildBots();applyQuality();resetCar(false);bindControls();window.addEventListener('resize',resize);drawMiniMap();setTimeout(()=>{if(camera&&car)positionCamera(.016,true)},50);animate();
}
function buildTrack(){
 const pts=[[-175,-125],[-110,-125],[-45,-125],[20,-125],[90,-125],[135,-119],[165,-104],[188,-80],[200,-50],[198,-23],[184,-2],[162,12],[138,18],[116,12],[98,0],[82,5],[66,25],[64,50],[77,72],[78,90],[63,111],[40,126],[12,132],[-18,123],[-45,108],[-72,87],[-97,62],[-121,35],[-145,6],[-164,-23],[-178,-53],[-183,-82],[-176,-106]];
 trackCurve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])),true,'centripetal');trackSamples=trackCurve.getSpacedPoints(TRACK_SAMPLES).slice(0,TRACK_SAMPLES);trackTangents=trackSamples.map((p,i)=>{const prev=trackSamples[(i-1+TRACK_SAMPLES)%TRACK_SAMPLES],next=trackSamples[(i+1)%TRACK_SAMPLES],dx=next.x-prev.x,dz=next.z-prev.z,len=Math.hypot(dx,dz)||1;return{x:dx/len,z:dz/len,heading:Math.atan2(dx/len,dz/len)};});
 const roadTex=asphaltTexture();roadTex.wrapS=roadTex.wrapT=THREE.RepeatWrapping;roadTex.repeat.set(1,1);
 const runoffTex=runoffTexture();runoffTex.wrapS=runoffTex.wrapT=THREE.RepeatWrapping;runoffTex.repeat.set(1,12);
 const runoff=new THREE.MeshStandardMaterial({map:runoffTex,roughness:.9,side:THREE.DoubleSide});const shoulder=M(0x6d7376,.97),asphalt=new THREE.MeshPhysicalMaterial({map:roadTex,color:0xe4e4e0,roughness:.9,metalness:0,clearcoat:.28,clearcoatRoughness:.38,envMapIntensity:.95,side:THREE.DoubleSide});
 scene.add(ribbonMesh(ROAD_WIDTH+19,-.245,runoff,30));scene.add(ribbonMesh(ROAD_WIDTH+6,-.145,shoulder,26));scene.add(ribbonMesh(ROAD_WIDTH,-.055,asphalt,36));
 const edgeMat=new THREE.MeshBasicMaterial({color:0xf6f2e8,side:THREE.DoubleSide});scene.add(edgeLine(-ROAD_WIDTH/2+.95,.018,edgeMat,.19));scene.add(edgeLine(ROAD_WIDTH/2-.95,.018,edgeMat,.19));
 const redMat=M(0xf0444e,.61),whiteMat=M(0xf7f2e8,.76),darkBarrier=M(0x29333e,.68,.2),fenceMat=M(0x485b69,.55,.65);const dummy=new THREE.Object3D();
 const count=Math.ceil(TRACK_SAMPLES/2)*2;const curbsR=new THREE.InstancedMesh(new THREE.BoxGeometry(1.02,.20,2.8),redMat,count),curbsW=new THREE.InstancedMesh(new THREE.BoxGeometry(1.02,.20,2.8),whiteMat,count);let cr=0,cw=0;for(let i=0;i<TRACK_SAMPLES;i+=2){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x;for(const s of [-1,1]){dummy.position.set(p.x+nx*s*(ROAD_WIDTH/2-.55),.06,p.z+nz*s*(ROAD_WIDTH/2-.55));dummy.rotation.set(0,t.heading,0);dummy.scale.set(1,1,1);dummy.updateMatrix();if((Math.floor(i/2)+(s===1?1:0))%2===0)curbsR.setMatrixAt(cr++,dummy.matrix);else curbsW.setMatrixAt(cw++,dummy.matrix);}}curbsR.count=cr;curbsW.count=cw;curbsR.castShadow=curbsW.castShadow=false;scene.add(curbsR,curbsW);
 // Continuous outside barriers, regularly spaced fence posts, and horizontal safety rails.
 const barrierGeo=new THREE.BoxGeometry(5.4,1.15,1.25),barR=new THREE.InstancedMesh(barrierGeo,redMat,500),barW=new THREE.InstancedMesh(barrierGeo,whiteMat,500);let br=0,bw=0;for(let i=0;i<TRACK_SAMPLES;i+=4){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x;for(const s of [-1,1]){dummy.position.set(p.x+nx*s*(ROAD_WIDTH/2+6.5),.53,p.z+nz*s*(ROAD_WIDTH/2+6.5));dummy.rotation.set(0,t.heading-Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();if((Math.floor(i/4)+(s===1?0:1))%2===0)barR.setMatrixAt(br++,dummy.matrix);else barW.setMatrixAt(bw++,dummy.matrix);}}barR.count=br;barW.count=bw;barR.castShadow=barW.castShadow=false;scene.add(barR,barW);
 const postGeo=new THREE.CylinderGeometry(.045,.055,2.75,5),posts=new THREE.InstancedMesh(postGeo,fenceMat,Math.ceil(TRACK_SAMPLES/7)*2);let pc=0;for(let i=0;i<TRACK_SAMPLES;i+=7){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x;for(const s of [-1,1]){dummy.position.set(p.x+nx*s*(ROAD_WIDTH/2+9.3),1.55,p.z+nz*s*(ROAD_WIDTH/2+9.3));dummy.rotation.set(0,t.heading,0);dummy.updateMatrix();posts.setMatrixAt(pc++,dummy.matrix);}}posts.count=pc;posts.castShadow=false;scene.add(posts);const railMat=new THREE.MeshBasicMaterial({color:0x7f9aa8,side:THREE.DoubleSide});scene.add(edgeLine(ROAD_WIDTH/2+9.3,.82,railMat,.09));scene.add(edgeLine(ROAD_WIDTH/2+9.3,2.05,railMat,.07));
 // Start/finish line and numbered grid boxes on the main straight.
 const start=trackSamples[START_INDEX],st=trackTangents[START_INDEX];const stripe=new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH,.035,1.35),new THREE.MeshBasicMaterial({map:canvasTexture(256,128,(ctx,w,h)=>{for(let y=0;y<8;y++)for(let x=0;x<16;x++){ctx.fillStyle=(x+y)%2?'#f5f5ee':'#1b2027';ctx.fillRect(x*w/16,y*h/8,w/16,h/8);}}),side:THREE.DoubleSide}));stripe.position.set(start.x,.018,start.z);stripe.rotation.y=st.heading;scene.add(stripe);
 const gridMat=new THREE.MeshBasicMaterial({color:0xcfd6db,transparent:true,opacity:.9});for(let n=1;n<=6;n++){const idx=(START_INDEX-n*7+TRACK_SAMPLES)%TRACK_SAMPLES,p=trackSamples[idx],t=trackTangents[idx];const marker=new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH*.72,.018,.1),gridMat);marker.position.set(p.x,.012,p.z);marker.rotation.y=t.heading;scene.add(marker);}
 // Small racing-line scuffs on the heaviest braking zone.
 for(const idx of [205,214,226,237,248]){const p=trackSamples[idx],t=trackTangents[idx],nx=t.z,nz=-t.x;for(const s of [-1,1]){const mark=new THREE.Mesh(new THREE.BoxGeometry(.12,.012,7.5),new THREE.MeshBasicMaterial({color:0x171b20,transparent:true,opacity:.38}));mark.position.set(p.x+nx*s*2.8,.003,p.z+nz*s*2.8);mark.rotation.y=t.heading;scene.add(mark);}}
}
function ribbonMesh(width,y,material,repeats=24){const verts=[],uvs=[],indices=[];for(let i=0;i<TRACK_SAMPLES;i++){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x,u=i/TRACK_SAMPLES*repeats;verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2);uvs.push(u,0,u,1);}for(let i=0;i<TRACK_SAMPLES;i++){const j=(i+1)%TRACK_SAMPLES,a=i*2,b=a+1,c=j*2,d=c+1;indices.push(a,c,b,b,c,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();material.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.castShadow=false;return mesh;}
function edgeLine(offset,y,material,thickness){const verts=[],indices=[];for(let i=0;i<TRACK_SAMPLES;i++){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x;verts.push(p.x+nx*(offset-thickness/2),y,p.z+nz*(offset-thickness/2),p.x+nx*(offset+thickness/2),y,p.z+nz*(offset+thickness/2));}for(let i=0;i<TRACK_SAMPLES;i++){const j=(i+1)%TRACK_SAMPLES;indices.push(i*2,j*2,i*2+1,i*2+1,j*2,j*2+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return new THREE.Mesh(g,material);}
function nearestTrack(x,z){let bestI=0,bestD=Infinity;for(let i=0;i<TRACK_SAMPLES;i++){const p=trackSamples[i],dx=x-p.x,dz=z-p.z,d=dx*dx+dz*dz;if(d<bestD){bestD=d;bestI=i;}}return{index:bestI,distance:Math.sqrt(bestD),point:trackSamples[bestI],tangent:trackTangents[bestI],progress:bestI/TRACK_SAMPLES};}
function addPalm(x,z,s=1){const g=new THREE.Group(),bark=M(0x765744,1),leafMat=M(0x236c58,.94),leafLite=M(0x3e8968,.94);let last=new THREE.Vector3(0,0,0);for(let i=0;i<5;i++){const h=1.2*s,lean=.07*s*i;const next=new THREE.Vector3(lean,h*(i+1),-.02*s*i);const dir=new THREE.Vector3().subVectors(next,last);const seg=new THREE.Mesh(new THREE.CylinderGeometry(.20*s*(1-i*.12),.26*s*(1-i*.12),dir.length(),7),bark);seg.position.copy(last).add(next).multiplyScalar(.5);seg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());seg.castShadow=false;g.add(seg);last=next;}const crown=last.clone();for(let i=0;i<8;i++){const a=i*Math.PI*2/8+.2,reach=(3.2+Math.random()*1.1)*s;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.18*s,reach,5),i%3===0?leafLite:leafMat);leaf.position.set(crown.x+Math.cos(a)*reach*.35,crown.y-.25*s,crown.z+Math.sin(a)*reach*.35);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(a)*.95,-.38,Math.sin(a)*.95).normalize());leaf.castShadow=false;g.add(leaf);const leaflet=new THREE.Mesh(new THREE.ConeGeometry(.11*s,reach*.55,4),leafMat);leaflet.position.set(crown.x+Math.cos(a)*reach*.68,crown.y-.7*s,crown.z+Math.sin(a)*reach*.68);leaflet.quaternion.copy(leaf.quaternion);leaflet.castShadow=false;g.add(leaflet);}g.position.set(x,0,z);scene.add(g);registerSolidCircle(x,z,.38*s,'PALM');return g;}
function addBillboard(index,side,title,subtitle,color){const p=trackSamples[index],t=trackTangents[index],nx=t.z,nz=-t.x,g=new THREE.Group();const postMat=M(0x333b44,.6,.5);for(const x of [-4.8,4.8]){const pole=new THREE.Mesh(new THREE.BoxGeometry(.22,3.1,.22),postMat);pole.position.set(x,1.55,0);g.add(pole);}const texture=signTexture(title,subtitle,color);const panelMat=new THREE.MeshStandardMaterial({map:texture,roughness:.5,metalness:.15,emissive:0x20313c,emissiveIntensity:.12});const board=new THREE.Mesh(new THREE.BoxGeometry(10,2.35,.4),[postMat,postMat,postMat,postMat,panelMat,postMat]);board.position.set(0,3.35,0);board.castShadow=true;g.add(board);g.position.set(p.x+nx*side*(ROAD_WIDTH/2+15),0,p.z+nz*side*(ROAD_WIDTH/2+15));g.rotation.y=t.heading;scene.add(g);registerSolidBox(g.position.x,g.position.z,5,.4,g.rotation.y,'BILLBOARD');}
function buildStand(index,side){const p=trackSamples[index],t=trackTangents[index],nx=t.z,nz=-t.x,g=new THREE.Group(),structure=M(0x384956,.9),seatMats=[M(0x164c73,.85),M(0xe5e7e8,.85),M(0xb83e4b,.85),M(0x344b63,.85)];const base=new THREE.Mesh(new THREE.BoxGeometry(42,3,13),structure);base.position.set(0,1.5,0);base.castShadow=true;g.add(base);for(let r=0;r<6;r++){const seat=new THREE.Mesh(new THREE.BoxGeometry(39,.34,1.45),seatMats[r%seatMats.length]);seat.position.set(0,3+r*.48,-4.2+r*1.55);seat.castShadow=true;g.add(seat);}const roof=new THREE.Mesh(new THREE.BoxGeometry(44,.55,13.5),M(0x253643,.65,.25));roof.position.set(0,6.3,-.2);roof.castShadow=true;g.add(roof);for(let x=-18;x<=18;x+=9){const support=new THREE.Mesh(new THREE.BoxGeometry(.28,3,.28),M(0x8998a4,.6,.45));support.position.set(x,1.5,-5.7);g.add(support);}{const cols=[0xe5e7e8,0xe52d47,0x2c7be5,0xf4a521,0x31b36b,0x1b1f27,0xffd36b],crowd=new THREE.InstancedMesh(new THREE.BoxGeometry(.42,.62,.32),new THREE.MeshStandardMaterial({roughness:.9}),6*30),d=new THREE.Object3D(),c=new THREE.Color();let n=0;for(let r=0;r<6;r++)for(let k=0;k<30;k++){d.position.set(-18+k*1.25+(Math.random()-.5)*.3,3+r*.48+.55,-4.2+r*1.55);d.scale.setScalar(.85+Math.random()*.3);d.updateMatrix();crowd.setMatrixAt(n,d.matrix);crowd.setColorAt(n,c.setHex(cols[Math.floor(Math.random()*cols.length)]));n++;}crowd.instanceColor.needsUpdate=true;g.add(crowd);}
 g.position.set(p.x+nx*side*(ROAD_WIDTH/2+31),0,p.z+nz*side*(ROAD_WIDTH/2+31));g.rotation.y=t.heading-Math.PI/2;scene.add(g);registerSolidBox(g.position.x,g.position.z,22,6.8,g.rotation.y,'GRANDSTAND');}
function buildCityBuilding(x,z,w,h,d,glassM,roofMat){const g=new THREE.Group(),geo=new THREE.BoxGeometry(w,h,d),mesh=new THREE.Mesh(geo,[glassM,glassM,roofMat,roofMat,glassM,glassM]);mesh.position.y=h/2;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);const ledMat=new THREE.MeshBasicMaterial({color:Math.random()>.5?0x65d5d1:0xffbd82,transparent:true,opacity:.48});if(h>22){const line=new THREE.Mesh(new THREE.BoxGeometry(w+.12,.12,d+.12),ledMat);line.position.y=h*.7;g.add(line);}g.position.set(x,0,z);scene.add(g);registerSolidBox(x,z,w/2,d/2,0,'BUILDING');return g;}
function buildScenery(){
 const glassMat=(base,lit,r,m)=>{const tex=windowTexture(base,lit);return new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:.3,roughness:r,metalness:m,envMapIntensity:.9});};const windowMats=[glassMat('#152536',.22,.3,.35),glassMat('#233849',.38,.34,.25),glassMat('#35414b',.47,.4,.2)];const roofMats=[M(0xb9b4a9,.85),M(0x707a83,.72),M(0xe1d6c6,.78)];
 // Modern coastal skyline at distance and a second cluster across the water.
 let built=0,tries=0;while(built<74&&tries<1800){tries++;const x=-410+Math.random()*690,z=-390+Math.random()*780;if(x>225&&x<345)continue;const w=9+Math.random()*20,d=9+Math.random()*22,h=12+Math.pow(Math.random(),.65)*72;const near=nearestTrack(x,z);const footprint=Math.hypot(w,d)*.5;const safeClearance=ROAD_WIDTH/2+10+footprint;if(near.distance<Math.max(48,safeClearance))continue;buildCityBuilding(x,z,w,h,d,windowMats[Math.floor(Math.random()*windowMats.length)],roofMats[Math.floor(Math.random()*roofMats.length)]);built++;}
 for(let i=0;i<31;i++){const x=755+Math.random()*150,z=-350+Math.random()*700,w=11+Math.random()*22,d=11+Math.random()*20,h=25+Math.random()*105;buildCityBuilding(x,z,w,h,d,windowMats[i%windowMats.length],roofMats[i%roofMats.length]);}
 // Palm-lined verges: kept outside barriers so they frame the road rather than obstruct it.
 let palms=0,triesP=0;while(palms<48&&triesP<1800){triesP++;const x=-255+Math.random()*520,z=-260+Math.random()*500,near=nearestTrack(x,z);if(near.distance<29||near.distance>115)continue;if(x>220&&x<350)continue;addPalm(x,z,.72+Math.random()*.62);palms++;}
 for(const idx of [56,105,160,222,282])buildStand(idx,idx%2?1:-1);
 addBillboard(88,1,'APEX GP','CHASE THE HORIZON','#ff4c59');addBillboard(178,-1,'COASTLINE','SUNSET SPRINT','#74e6de');addBillboard(265,1,'OVERTAKE','ERS / ACTIVE','#ffb45f');
 // Pit building facing the start straight.
 const idx=48,p=trackSamples[idx],t=trackTangents[idx],nx=t.z,nz=-t.x,pit=new THREE.Group();const shell=new THREE.Mesh(new THREE.BoxGeometry(72,9,15),new THREE.MeshStandardMaterial({map:windowTexture('#172839',.72),roughness:.42,metalness:.22}));shell.position.y=4.5;shell.castShadow=true;pit.add(shell);const roof=new THREE.Mesh(new THREE.BoxGeometry(74,.65,16),M(0x303b46,.5,.3));roof.position.y=9.25;roof.castShadow=true;pit.add(roof);const balcony=new THREE.Mesh(new THREE.BoxGeometry(72,.45,1.7),M(0xc5cbd1,.5,.3));balcony.position.set(0,6.6,8.1);pit.add(balcony);const signTex=signTexture('APEX PADDOCK','RACE OPERATIONS','#ff4c59');const sign=new THREE.Mesh(new THREE.PlaneGeometry(19,3.2),new THREE.MeshBasicMaterial({map:signTex}));sign.position.set(0,7.9,7.65);pit.add(sign);pit.position.set(p.x+nx*(ROAD_WIDTH/2+34),0,p.z+nz*(ROAD_WIDTH/2+34));pit.rotation.y=t.heading-Math.PI/2;scene.add(pit);registerSolidBox(pit.position.x,pit.position.z,37,8,pit.rotation.y,'PIT BUILDING');
 // Tall floodlight masts and illuminated heads around selected corners.
 for(let i=34;i<TRACK_SAMPLES;i+=42){const p=trackSamples[i],t=trackTangents[i],nx=t.z,nz=-t.x,g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,8,8),M(0x34424d,.54,.5));pole.position.y=4;g.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(2.7,.18,.18),M(0x34424d,.54,.5));arm.position.set(1.05,7.8,0);g.add(arm);const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.2,.22,.5),new THREE.MeshStandardMaterial({color:0xfff5d8,emissive:0xffcc86,emissiveIntensity:.75}));lamp.position.set(2.2,7.7,0);g.add(lamp);g.position.set(p.x+nx*(ROAD_WIDTH/2+12),0,p.z+nz*(ROAD_WIDTH/2+12));g.rotation.y=t.heading;scene.add(g);registerSolidCircle(g.position.x,g.position.z,.38,'LIGHT POLE');}
 // Distant trackside structures create a fuller horizon and sense of scale.
 for(let i=0;i<14;i++){const x=-330+i*42,z=310+Math.random()*60;const low=new THREE.Mesh(new THREE.BoxGeometry(26,6+Math.random()*7,22),M(i%2?0x8b9899:0xc9b7a0,.9));low.position.set(x,3,z);low.castShadow=true;scene.add(low);registerSolidBox(x,z,13,11,0,'TRACKSIDE BUILDING');}
}
function buildCar(paintHex=0xe52d47,liteHex=0xff6b68,accentHex=0x74e6de,helmetHex=0xf6d66c){
 car=new THREE.Group();body=new THREE.Group();car.add(body);const paint=new THREE.MeshPhysicalMaterial({color:paintHex,roughness:.28,metalness:.28,clearcoat:.9,clearcoatRoughness:.18}),paintLite=new THREE.MeshPhysicalMaterial({color:liteHex,roughness:.24,metalness:.25,clearcoat:.8}),carbon=M(0x10171e,.38,.42),rubber=M(0x080a0c,.93),sidewall=M(0x161a20,.83),metal=M(0xa9b7bf,.24,.85),gold=M(0xf2c678,.28,.62),visor=new THREE.MeshPhysicalMaterial({color:0x10222d,roughness:.1,metalness:.6,clearcoat:1}),helmetMat=M(helmetHex,.25,.22),white=M(0xf2f0e7,.3,.28),teal=M(accentHex,.28,.22);
 function box(w,h,d,mat,x,y,z,parent=body){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 // Tapered monocoque assembled as a bevelled plan-view mesh, not a stack of rectangular blocks.
 const sh=new THREE.Shape();sh.moveTo(-.50,2.26);sh.lineTo(.50,2.26);sh.lineTo(.62,1.52);sh.lineTo(.93,.74);sh.lineTo(.79,-.62);sh.lineTo(.47,-1.78);sh.lineTo(.25,-2.35);sh.lineTo(0,-2.55);sh.lineTo(-.25,-2.35);sh.lineTo(-.47,-1.78);sh.lineTo(-.79,-.62);sh.lineTo(-.93,.74);sh.lineTo(-.62,1.52);sh.closePath();const hullG=new THREE.ExtrudeGeometry(sh,{depth:.27,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.055});hullG.rotateX(-Math.PI/2);hullG.translate(0,.49,0);const hull=new THREE.Mesh(hullG,paint);hull.castShadow=true;hull.receiveShadow=true;body.add(hull);
 // A nose and separable front-wing assembly, mounted as a damageable unit.
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.46,2.5,7),paint);nose.rotation.x=Math.PI/2;nose.position.set(0,.70,1.2);nose.castShadow=true;body.add(nose);
 frontWing=new THREE.Group();frontWing.position.set(0,.45,2.52);body.add(frontWing);
 box(3.28,.12,.48,carbon,0,-.06,0,frontWing);box(3.03,.10,.33,paintLite,0,.02,.06,frontWing);box(2.55,.08,.25,teal,0,.08,-.04,frontWing);
 for(const side of [-1,1]){box(.12,.48,.42,carbon,side*1.53,.12,0,frontWing);box(.72,.1,.52,paint,side*1.23,-.01,-.17,frontWing);}
 box(1.62,.22,1.44,carbon,0,.52,-.02);box(.98,.26,1.06,paint,0,.72,-.12);box(.12,.08,1.3,teal,0,.88,-.30);
 for(const s of [-1,1]){const pod=box(.67,.42,1.42,paint,s*.84,.61,-.18);pod.rotation.y=-s*.06;box(.68,.14,1.15,carbon,s*.85,.79,-.26);box(.10,.12,.75,teal,s*1.0,.69,.08);}
 // Rear diffuser and a separable multi-element rear-wing assembly.
 box(2.42,.13,.72,carbon,0,.44,-2.03);box(2.65,.12,.38,paintLite,0,.50,-2.36);
 rearWing=new THREE.Group();rearWing.position.set(0,1,-2.08);body.add(rearWing);
 box(2.45,.14,.44,carbon,0,.15,0,rearWing);box(2.55,.10,.32,paint,0,.25,0,rearWing);box(2.25,.11,.28,teal,0,.34,.05,rearWing);
 box(.14,.84,.13,carbon,0,-.16,.18,rearWing);for(const side of [-1,1])box(.16,.65,.25,carbon,side*1.20,-.13,.04,rearWing);
 // Cockpit, halo and driver helmet.
 const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.69,24,16),carbon);cockpit.scale.set(.62,.36,1.0);cockpit.position.set(0,.89,.20);cockpit.castShadow=true;body.add(cockpit);const rim=new THREE.Mesh(new THREE.TorusGeometry(.43,.055,9,24,Math.PI*1.8),metal);rim.rotation.x=Math.PI/2;rim.rotation.z=Math.PI;rim.position.set(0,1.13,.22);body.add(rim);const helmet=new THREE.Mesh(new THREE.SphereGeometry(.31,22,16),helmetMat);helmet.scale.set(.92,1,1.05);helmet.position.set(0,1.16,.13);helmet.castShadow=true;body.add(helmet);box(.48,.13,.08,visor,0,1.16,.39);box(.10,.08,.18,teal,0,1.43,.12);
 // Thin livery stripes along the nose and engine cover.
 box(.075,.028,2.25,white,0,.78,.68);box(.22,.035,.62,teal,0,.86,-.90);box(.10,.035,.50,white,0,.87,-1.28);
 // Suspension arms and alloy wheels with sculpted sidewalls, hubs and ring details.
 function wheel(x,z,isFront){const pivot=new THREE.Group();pivot.position.set(x,.49,z);car.add(pivot);const spin=new THREE.Group();pivot.add(spin);const rad=isFront?.47:.57;const tire=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,.37,32),rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;spin.add(tire);const side1=new THREE.Mesh(new THREE.CylinderGeometry(rad*.8,rad*.8,.39,24),sidewall);side1.rotation.z=Math.PI/2;spin.add(side1);const hub=new THREE.Mesh(new THREE.CylinderGeometry(rad*.54,rad*.54,.405,24),gold);hub.rotation.z=Math.PI/2;spin.add(hub);const hubCenter=new THREE.Mesh(new THREE.CylinderGeometry(rad*.25,rad*.25,.42,16),carbon);hubCenter.rotation.z=Math.PI/2;spin.add(hubCenter);for(const xSide of [-.205,.205]){const ring=new THREE.Mesh(new THREE.TorusGeometry(rad*.72,.026,6,28),isFront?paintLite:teal);ring.rotation.y=Math.PI/2;ring.position.x=xSide;spin.add(ring);}for(let n=0;n<5;n++){const spoke=new THREE.Mesh(new THREE.BoxGeometry(.026,.035,rad*.76),metal);spoke.rotation.x=n*Math.PI*2/5;spoke.position.x=.215;spoke.position.y=Math.cos(n*Math.PI*2/5)*rad*.35;spoke.position.z=Math.sin(n*Math.PI*2/5)*rad*.35;spin.add(spoke);}const disc=new THREE.Mesh(new THREE.CylinderGeometry(rad*.45,rad*.45,.09,20),M(0x6b747c,.46,.78));disc.rotation.z=Math.PI/2;disc.position.x=.17;spin.add(disc);(isFront?frontWheels:rearWheels).push({pivot,spin});}
 for(const s of [-1,1]){wheel(s*1.22,1.64,true);wheel(s*1.22,-1.72,false);for(const z of [.25,1.38]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.055,.055,1.25),carbon);arm.position.set(s*.94,.48,z);arm.rotation.y=s*.13;body.add(arm);}const mirror=box(.20,.13,.20,carbon,s*.77,1.0,.75);mirror.rotation.y=s*.25;}
 const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,.45,10),metal);exhaust.rotation.x=Math.PI/2;exhaust.position.set(0,.76,-1.68);body.add(exhaust);const rearLight=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.1),new THREE.MeshBasicMaterial({color:0xff2222,emissive:0xff1222}));rearLight.position.set(0,.86,-2.35);body.add(rearLight);
 car.userData.brakeLight=typeof rearLight!=='undefined'?rearLight:null;scene.add(car);
}
function syncWingVisuals(){if(frontWing&&!frontWingDetached){const d=1-frontWingIntegrity/100;frontWing.position.set(0,.45-d*.16,2.52-d*.3);frontWing.rotation.set(frontWingBend,frontWingBend*.12,frontWingBend*.48);}if(rearWing&&!rearWingDetached){const d=1-rearWingIntegrity/100;rearWing.position.set(0,1-d*.2,-2.08+d*.24);rearWing.rotation.set(-rearWingBend*.72,rearWingBend*.10,rearWingBend*.38);}}
function carCondition(){const f=(tyreIntegrity[0]+tyreIntegrity[1])/200,r=(tyreIntegrity[2]+tyreIntegrity[3])/200,loss=tyreIntegrity.map(v=>(100-v)/100),left=loss[0]*.65+loss[2]*.35,right=loss[1]*.65+loss[3]*.35;return{tyreGrip:.55+.45*(f*.55+r*.45),tyrePull:(left-right)*.30,rearPull:(loss[2]-loss[3])*.5,tyreDrag:(loss[0]+loss[1]+loss[2]+loss[3])/4,engine:.4+.6*engineIntegrity/100};}
function recomputeDamage(){const tyreLoss=tyreIntegrity.reduce((a,v)=>a+(100-v),0)/4;damage=clamp(chassisDamage+(100-suspensionIntegrity)*.18+(100-engineIntegrity)*.22+tyreLoss*.14+((100-frontWingIntegrity)+(100-rearWingIntegrity))*.08,0,100);wrecked=chassisDamage>=100;}
function markPunctures(){for(let i=0;i<4;i++)if(tyreIntegrity[i]<=30)tyrePunctured[i]=true;}
function syncTyreVisuals(){const map=[frontWheels[1],frontWheels[0],rearWheels[1],rearWheels[0]];for(let i=0;i<4;i++){const w=map[i];if(!w)continue;const s=.8+.2*tyreIntegrity[i]/100;w.spin.scale.set(1,s,s);}}
function updateDamageUI(){const readout=$('damageReadout'),fill=$('damageFill');if(readout)readout.textContent=`${Math.round(damage)}%`;if(fill){fill.style.width=`${damage}%`;fill.style.background=damage>65?'linear-gradient(90deg,#ffb45f,#ff4d5b)':'linear-gradient(90deg,#74e6de,#e0ff8a)';}for(const [id,integrity,detached] of [['frontWingReadout',frontWingIntegrity,frontWingDetached],['rearWingReadout',rearWingIntegrity,rearWingDetached]]){const el=$(id);if(!el)continue;el.textContent=detached?t('missing'):`${integrity<99?`${t('bent')} · `:''}${Math.round(integrity)}%`;el.classList.toggle('damaged',!detached&&integrity<99);el.classList.toggle('missing',detached);}const suspension=$('suspensionReadout');if(suspension){suspension.textContent=`${Math.round(suspensionIntegrity)}%`;suspension.classList.toggle('damaged',suspensionIntegrity<100);}const eng=$('engineReadout');if(eng){eng.textContent=`${Math.round(engineIntegrity)}%`;eng.classList.toggle('damaged',engineIntegrity<100&&engineIntegrity>25);eng.classList.toggle('missing',engineIntegrity<=25);}TYRE_KEYS.forEach((key,i)=>{const cell=$(key.replace('tyre','tyre')),strong=cell&&cell.querySelector('strong');if(!strong)return;strong.textContent=tyrePunctured[i]?`${t('punctured')}`:`${Math.round(tyreIntegrity[i])}%`;strong.classList.toggle('damaged',!tyrePunctured[i]&&tyreIntegrity[i]<99);strong.classList.toggle('missing',tyrePunctured[i]);});}
function detachWing(group,type,severity,travelX,travelZ,normalX,normalZ){if(!group||group.parent!==body)return;group.updateWorldMatrix(true,true);scene.attach(group);if(type==='front'){frontWingDetached=true;frontWingIntegrity=0;}else{rearWingDetached=true;rearWingIntegrity=0;}wingDebris.push({group,type,velocity:new THREE.Vector3(travelX*(3+severity*12)+normalX*2,3+severity*5,travelZ*(3+severity*12)+normalZ*2),spin:new THREE.Vector3((Math.random()-.5)*8,(Math.random()-.5)*8,(Math.random()-.5)*8),life:7,bounced:false});}
function repairWings(){for(const piece of wingDebris){if(piece.group.parent)piece.group.parent.remove(piece.group);}wingDebris.length=0;for(const [group,type] of [[frontWing,'front'],[rearWing,'rear']]){if(!group)continue;if(group.parent!==body)body.add(group);group.visible=true;group.position.set(0,type==='front' ? .45 : 1,type==='front' ? 2.52 : -2.08);group.rotation.set(0,0,0);}frontWingIntegrity=rearWingIntegrity=100;frontWingBend=rearWingBend=0;frontWingDetached=rearWingDetached=false;}
function applyCollisionDamage(kind,normalX,normalZ,severity,travelX,travelZ){
 const fX=Math.sin(heading),fZ=Math.cos(heading),lX=Math.cos(heading),lZ=-Math.sin(heading);
 // Contact direction in the car's frame: zc>0 = nose hit, zc<0 = tail hit, xc>0 = left side, xc<0 = right side.
 const zc=clamp(-(normalX*fX+normalZ*fZ),-1,1),xc=clamp(-(normalX*lX+normalZ*lZ),-1,1);
 const fz=Math.max(0,zc),rz=Math.max(0,-zc),lx=Math.max(0,xc),rx=Math.max(0,-xc),sideForce=-xc,msgs=[];
 // Intact wings crumple and soak up a share of the impact energy before it reaches the tub.
 const absorb=fz*(frontWingDetached?0:.18)+rz*(rearWingDetached?0:.12);
 const hit=(type,facing)=>{if(facing<.42||severity<.12)return;const group=type==='front'?frontWing:rearWing,detached=type==='front'?frontWingDetached:rearWingDetached;if(detached)return;const integrity=type==='front'?frontWingIntegrity:rearWingIntegrity;const loss=100*Math.pow(clamp((severity-.12)/.88,0,1),1.28)*Math.pow(facing,.85);if(loss<1.5)return;const next=Math.max(0,integrity-loss),bend=(type==='front'?frontWingBend:rearWingBend)+Math.sign(sideForce||1)*(.035+loss*.0021);if(type==='front'){frontWingIntegrity=next;frontWingBend=clamp(bend,-.32,.32);}else{rearWingIntegrity=next;rearWingBend=clamp(bend,-.28,.28);}if(next<=17||loss>=93){detachWing(group,type,severity,travelX,travelZ,normalX,normalZ);msgs.push(`${t(type==='front'?'frontWing':'rearWing')} ${t('detached')}`);}else msgs.push(`${t(type==='front'?'frontWing':'rearWing')} ${t('damaged')}`);};
 hit('front',fz);hit('rear',rz);
 // Chassis / survival cell
 chassisDamage=clamp(chassisDamage+(kind==='BARRIER'?1.5:2.5)+severity*(kind==='BARRIER'?40:48)*(1-absorb),0,100);
 // Individual tyres: corner hits hurt the tyre on that corner, side hits hurt both tyres on that side.
 const sevT=Math.pow(severity,1.1);let tyreMsg='';
 for(let i=0;i<4;i++){const front=i<2,left=i%2===0,along=front?fz:rz,across=left?lx:rx,w=(along+.35*(1-Math.abs(zc)))*(.25+.75*across),loss=sevT*w*130;if(loss<2)continue;const was=tyrePunctured[i];tyreIntegrity[i]=Math.max(0,tyreIntegrity[i]-loss);if(tyreIntegrity[i]<=30)tyrePunctured[i]=true;if(!was&&tyrePunctured[i])tyreMsg=`${t('tyrePuncture')} ${t(TYRE_KEYS[i])}`;else if(!tyreMsg&&loss>=6)tyreMsg=t('tyreImpact');}
 if(tyreMsg)msgs.push(tyreMsg);
 // Power unit: tail hits are worst, big nose hits damage cooling and ancillaries.
 const engLoss=100*Math.pow(clamp((severity-.22)/.78,0,1),1.4)*(rz+.35*fz+.15*(1-Math.abs(zc)));
 if(engLoss>=4){engineIntegrity=Math.max(0,engineIntegrity-engLoss);msgs.push(t('engineImpact'));}
 // Suspension: side hits are worst; a bent corner pulls the car towards the damaged side.
 const corner=Math.max(fz,rz),lateral=clamp(1-corner,0,1),suspensionLoss=100*Math.pow(clamp((severity-.10)/.90,0,1),1.15)*(lateral*.72+corner*.18);
 if(suspensionLoss>2){suspensionIntegrity=Math.max(0,suspensionIntegrity-suspensionLoss);steeringBias=clamp(steeringBias+Math.sign(xc||1)*suspensionLoss*.0028,-.5,.5);msgs.push(t('suspensionImpact'));}
 recomputeDamage();if(wrecked)msgs.push(t('wrecked'));syncWingVisuals();syncTyreVisuals();return msgs.join(' · ');
}
function scrapeContact(normalX,normalZ){if(Math.abs(speed)<3)return;const rate=clamp(Math.abs(speed)/MAX_SPEED,0,1),dt=frameDt;speed-=Math.sign(speed)*(5+rate*20)*dt;chassisDamage=clamp(chassisDamage+(.4+4*rate)*dt,0,100);const lX=Math.cos(heading),lZ=-Math.sin(heading),xc=-(normalX*lX+normalZ*lZ);for(const i of xc>0?[0,2]:[1,3])tyreIntegrity[i]=Math.max(0,tyreIntegrity[i]-(.8+5*rate)*dt);markPunctures();scrapeTimer=.3;sparkTimer-=dt;if(sparkTimer<=0){spawnImpactSparks(5);sparkTimer=.07;}recomputeDamage();if(frameCount%5===0){syncTyreVisuals();updateDamageUI();}}
function tickDamage(dt,speedNorm){let changed=false;for(let i=0;i<4;i++){if(tyrePunctured[i]&&tyreIntegrity[i]>0&&Math.abs(speed)>1){tyreIntegrity[i]=Math.max(0,tyreIntegrity[i]-dt*(.8+speedNorm*2.4));changed=true;}}if(changed){recomputeDamage();if(frameCount%6===0){syncTyreVisuals();updateDamageUI();}}sparkTimer-=dt;if(sparkTimer<=0&&Math.abs(speed)>6&&tyreIntegrity.some(v=>v<=0)){spawnImpactSparks(4);sparkTimer=.09;}smokeTimer-=dt;if(engineIntegrity<60&&Math.abs(speed)>1&&smokeTimer<=0){spawnSmoke((60-engineIntegrity)/60);smokeTimer=.05+engineIntegrity/60*.14;}}
function spawnSmoke(intensity){if(!scene||!car)return;if(!sparkGeometry)sparkGeometry=new THREE.SphereGeometry(.065,6,5);const fx=Math.sin(heading),fz=Math.cos(heading),mesh=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),new THREE.MeshBasicMaterial({color:engineIntegrity<25?0x15171b:0x6d737b,transparent:true,opacity:.4,depthWrite:false}));mesh.position.set(car.position.x-fx*1.9+(Math.random()-.5)*.4,.95,car.position.z-fz*1.9+(Math.random()-.5)*.4);scene.add(mesh);impactEffects.push({mesh,smoke:true,alpha:.25+.3*intensity,velocity:new THREE.Vector3((Math.random()-.5)*.6,1.4+Math.random()*.8,(Math.random()-.5)*.6),life:1.1+intensity*.6,maxLife:1.7});}
function spawnImpactSparks(count=13,ox,oz){ox=ox===undefined?car.position.x:ox;oz=oz===undefined?car.position.z:oz;if(!scene||!car)return;if(!sparkGeometry)sparkGeometry=new THREE.SphereGeometry(.065,6,5);if(!sparkMaterial)sparkMaterial=new THREE.MeshBasicMaterial({color:0xffc56b,transparent:true,opacity:1});for(let i=0;i<count;i++){const mesh=new THREE.Mesh(sparkGeometry,sparkMaterial.clone());mesh.position.set(ox+(Math.random()-.5)*1.8,.45+Math.random()*.7,oz+(Math.random()-.5)*1.8);scene.add(mesh);const velocity=new THREE.Vector3((Math.random()-.5)*7,1.2+Math.random()*5,(Math.random()-.5)*7);impactEffects.push({mesh,velocity,life:.32+Math.random()*.28,maxLife:.6});}}
function updateImpactEffects(dt){for(let i=impactEffects.length-1;i>=0;i--){const fx=impactEffects[i];fx.life-=dt;if(fx.life<=0){scene.remove(fx.mesh);impactEffects.splice(i,1);continue;}if(fx.smoke){fx.mesh.position.addScaledVector(fx.velocity,dt);fx.mesh.material.opacity=clamp(fx.life/fx.maxLife,0,1)*fx.alpha;fx.mesh.scale.setScalar(.5+(1-fx.life/fx.maxLife)*2.4);continue;}fx.velocity.y-=10*dt;fx.mesh.position.addScaledVector(fx.velocity,dt);fx.mesh.material.opacity=clamp(fx.life/fx.maxLife,0,1);fx.mesh.scale.setScalar(clamp(fx.life/fx.maxLife,.05,1));}for(let i=wingDebris.length-1;i>=0;i--){const piece=wingDebris[i];piece.life-=dt;if(piece.life<=0){scene.remove(piece.group);wingDebris.splice(i,1);continue;}piece.velocity.y-=14*dt;piece.group.position.addScaledVector(piece.velocity,dt);piece.group.rotation.x+=piece.spin.x*dt;piece.group.rotation.y+=piece.spin.y*dt;piece.group.rotation.z+=piece.spin.z*dt;if(piece.group.position.y<.16){piece.group.position.y=.16;if(piece.velocity.y<0){piece.velocity.y=-piece.velocity.y*(piece.bounced?.18:.32);piece.bounced=true;}piece.velocity.x*=Math.max(0,1-2.2*dt);piece.velocity.z*=Math.max(0,1-2.2*dt);piece.spin.multiplyScalar(Math.max(0,1-1.7*dt));}}}
function playImpactSound(severity){if(!audioCtx||muted)return;try{const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),env=audioCtx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(110+severity*95,now);osc.frequency.exponentialRampToValueAtTime(42,now+.13);env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(.075+severity*.055,now+.008);env.gain.exponentialRampToValueAtTime(.0001,now+.18);osc.connect(env);env.connect(audioCtx.destination);osc.start(now);osc.stop(now+.19);}catch(_){}}
function triggerImpact(kind,side=1,normalX=0,normalZ=0){if(collisionCooldown>0||Math.abs(speed)<4.5)return false;const impactSpeed=speed,travel=heading+slipAngle+(impactSpeed<0?Math.PI:0),travelX=Math.sin(travel),travelZ=Math.cos(travel),closing=clamp(-(travelX*normalX+travelZ*normalZ),0,1),normalSpeed=Math.abs(impactSpeed)*closing,tangential=Math.abs(impactSpeed)*Math.sqrt(Math.max(0,1-closing*closing)),severity=clamp(Math.pow(normalSpeed/64,1.3)+tangential/MAX_SPEED*.08,0,1),wingMessage=applyCollisionDamage(kind,normalX,normalZ,severity,travelX,travelZ),speedFactor=clamp(1-(kind==='BARRIER'?.10:.16)-severity*(kind==='BARRIER'?.46:.54),.2,.88);speed*=speedFactor;ers=Math.max(0,ers-(kind==='BARRIER'?4:7)-severity*5);steer*=.22;
 // Reflect the velocity component into the surface so a head-on hit rebounds instead of endlessly driving through it.
 const dot=travelX*normalX+travelZ*normalZ;if(dot<-.015){const rx=travelX-1.18*dot*normalX,rz=travelZ-1.18*dot*normalZ,newTravel=Math.atan2(rx,rz),delta=Math.atan2(Math.sin(newTravel-travel),Math.cos(newTravel-travel));heading+=delta*.72;slipAngle=clamp(newTravel-heading-(impactSpeed<0?Math.PI:0),-.52,.52);}else slipAngle=clamp(slipAngle+(side>=0?1:-1)*(.07+.12*severity),-.48,.48);
 collisionCooldown=kind==='BARRIER'?.85:1.0;collisionShake=Math.max(collisionShake,.48+severity*.65);collisionBanner=1.8;collisionKind=kind;impactDetail=wingMessage;updateDamageUI();$('status').textContent=wingMessage||`${t(kind==='BARRIER'?'barrierImpact':'objectImpact')} — ${Math.round(damage)}%`;$('surfaceName').textContent=t('impact');$('substatus').textContent=wingMessage?t('wingImpactCopy'):t('impactCopy');showToast(wingMessage||t('impactToast'));playImpactSound(severity);spawnImpactSparks();return true;}
function resolveWorldCollisions(prevX,prevZ,beforeTrack){
 // Oriented solid boxes: buildings, grandstands, pit wall, trackside signs.
 for(let pass=0;pass<2;pass++){
  let resolved=false;
  for(const box of solidBoxes){const dx=car.position.x-box.x,dz=car.position.z-box.z,c=Math.cos(box.yaw),sn=Math.sin(box.yaw);let lx=c*dx-sn*dz,lz=sn*dx+c*dz;const ox=box.hx+CAR_RADIUS-Math.abs(lx),oz=box.hz+CAR_RADIUS-Math.abs(lz);if(ox<=0||oz<=0)continue;let side=1,nx=0,nz=0;if(ox<oz){side=Math.sign(lx||(c*(prevX-box.x)-sn*(prevZ-box.z))||1);lx=side*(box.hx+CAR_RADIUS);nx=c*side;nz=-sn*side;}else{side=Math.sign(lz||(sn*(prevX-box.x)+c*(prevZ-box.z))||1);lz=side*(box.hz+CAR_RADIUS);nx=sn*side;nz=c*side;}car.position.x=box.x+c*lx+sn*lz;car.position.z=box.z-sn*lx+c*lz;triggerImpact(box.kind,side,nx,nz);resolved=true;break;}
  if(!resolved)break;
 }
 // Thin trunk / pole colliders use circles in the horizontal plane.
 for(const obj of solidCircles){let dx=car.position.x-obj.x,dz=car.position.z-obj.z,d=Math.hypot(dx,dz),min=CAR_RADIUS+obj.r;if(d>=min)continue;if(d<.001){dx=prevX-obj.x;dz=prevZ-obj.z;d=Math.hypot(dx,dz)||1;}const side=dx>=0?1:-1;car.position.x=obj.x+dx/d*min;car.position.z=obj.z+dz/d*min;triggerImpact(obj.kind,side,dx/d,dz/d);}
 // Continuous invisible collision surface aligned to the circuit's safety barriers.
 let track=nearestTrack(car.position.x,car.position.z);const limit=BARRIER_CENTRE-CAR_RADIUS-.625;if(track.distance>limit){const dx=car.position.x-track.point.x,dz=car.position.z-track.point.z,d=Math.max(track.distance,.001),nx=dx/d,nz=dz/d,side=(dx*track.tangent.z+dz*(-track.tangent.x))>=0?1:-1,overshoot=track.distance-limit;car.position.x=track.point.x+nx*limit;car.position.z=track.point.z+nz*limit;let hitWall=false;if(overshoot>.18&&(beforeTrack.distance<limit-.15||overshoot>.58))hitWall=triggerImpact('BARRIER',side,-nx,-nz);if(!hitWall)scrapeContact(-nx,-nz);track=nearestTrack(car.position.x,car.position.z);}
 return track;
}
function resetCar(resetRace=true){if(!car||!trackSamples.length)return;repairWings();speed=0;steer=0;steerAngle=0;slipAngle=0;offroad=false;raceFinished=false;const gridIdx=(START_INDEX-PLAYER_GRID_BACK+TRACK_SAMPLES)%TRACK_SAMPLES,p0=trackSamples[gridIdx],tan=trackTangents[gridIdx],p={x:p0.x+tan.z*-3.2,z:p0.z+-tan.x*-3.2};car.position.set(p.x,0,p.z);heading=tan.heading;car.rotation.y=heading;body.rotation.set(0,0,0);lap=1;lapTime=0;elapsed=0;pastStart=false;finishCounter=0;playerFinishRank=0;startTimer=3;lastCount=-1;carHitCooldown=0;{const g=(START_INDEX-PLAYER_GRID_BACK+TRACK_SAMPLES)%TRACK_SAMPLES;lastProgress=playerProg=((g-START_INDEX+TRACK_SAMPLES)%TRACK_SAMPLES)/TRACK_SAMPLES;}resetBots();ers=100;chassisDamage=0;engineIntegrity=100;tyreIntegrity=[100,100,100,100];tyrePunctured=[false,false,false,false];wrecked=false;scrapeTimer=0;suspensionIntegrity=100;steeringBias=0;recomputeDamage();syncTyreVisuals();collisionCooldown=0;collisionShake=0;collisionBanner=0;impactDetail='';for(const fx of impactEffects)scene.remove(fx.mesh);impactEffects.length=0;updateDamageUI();if(resetRace){$('status').textContent=t('carReset');showToast(t('sessionReset'));}if($('lap'))$('lap').innerHTML='1<span style="color:#8795a9">/3</span>';if($('speed'))$('speed').textContent='000';if($('gear'))$('gear').textContent='N';if($('clock'))$('clock').textContent='00:00';if($('energyFill'))$('energyFill').style.width='100%';positionCamera(.016,true);drawMiniMap();}
const BOT_DEFS=[
 {name:'VEGA',css:'#3d8bff',paint:0x2c7be5,lite:0x72b4ff,accent:0xffffff,helmet:0xffffff,skill:1.0,lane:-3.2},
 {name:'KAI',css:'#ffb42e',paint:0xf4a521,lite:0xffd36b,accent:0x1b1f27,helmet:0x1b1f27,skill:.97,lane:3.2},
 {name:'NOVAK',css:'#3ccf7e',paint:0x31b36b,lite:0x7be3a6,accent:0xf7f2e8,helmet:0xe8e8e8,skill:.94,lane:-3.2},
 {name:'ROSSI',css:'#f2f2f0',paint:0xf2f2f0,lite:0xffffff,accent:0xe52d47,helmet:0xe52d47,skill:.91,lane:3.2},
 {name:'TANAKA',css:'#a974ff',paint:0x8e55d6,lite:0xc29bff,accent:0x74e6de,helmet:0x74e6de,skill:.88,lane:-3.2}];
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function paceFor(def){return def.skill*({easy:.9,normal:1,hard:1.045}[difficulty]||1);}
function applyBotPace(){for(const b of bots)b.pace=paceFor(b.def);}
function buildBots(){
 const N=TRACK_SAMPLES;let len=0;for(let i=0;i<N;i++){const a=trackSamples[i],b=trackSamples[(i+1)%N];len+=Math.hypot(b.x-a.x,b.z-a.z);}trackDs=len/N;
 // Corner speed limit from local curvature, then a braking pass so bots slow down before corners.
 const TOP=MAX_SPEED*WORLD_SCALE*.99,A_LAT=21,BRAKE=11.5,span=5;cornerLimit=[];
 for(let i=0;i<N;i++){const h1=trackTangents[(i+span)%N].heading,h0=trackTangents[(i-span+N)%N].heading,k=Math.abs(wrapAngle(h1-h0))/(2*span*trackDs);cornerLimit[i]=Math.min(TOP,Math.sqrt(A_LAT/Math.max(k,.0008)));}
 for(let pass=0;pass<2;pass++)for(let i=N*2-1;i>=0;i--){const idx=i%N,nxt=(idx+1)%N;cornerLimit[idx]=Math.min(cornerLimit[idx],Math.sqrt(cornerLimit[nxt]*cornerLimit[nxt]+2*BRAKE*trackDs));}
 for(const def of BOT_DEFS){
  const saved={car,body,frontWing,rearWing,frontWheels,rearWheels};frontWheels=[];rearWheels=[];
  buildCar(def.paint,def.lite,def.accent,def.helmet);
  const bot={def,name:def.name,css:def.css,group:car,body,frontWheels,rearWheels,s:0,lat:def.lane,baseLat:def.lane,speed:0,x:0,z:0,heading:0,yaw:0,steer:0,total:0,finishRank:0,pace:paceFor(def),nx:0,nz:0,idx:0};
  car=saved.car;body=saved.body;frontWing=saved.frontWing;rearWing=saved.rearWing;frontWheels=saved.frontWheels;rearWheels=saved.rearWheels;
  bots.push(bot);
 }
}
function trackAt(s){const N=TRACK_SAMPLES,f=((s%N)+N)%N,i=Math.floor(f),fr=f-i,a=trackSamples[i],b=trackSamples[(i+1)%N],t=trackTangents[i];return{x:a.x+(b.x-a.x)*fr,z:a.z+(b.z-a.z)*fr,tx:t.x,tz:t.z,heading:t.heading,idx:i};}
function placeBot(b){const pos=trackAt(b.s);b.nx=pos.tz;b.nz=-pos.tx;b.x=pos.x+b.nx*b.lat;b.z=pos.z+b.nz*b.lat;b.idx=pos.idx;b.group.position.set(b.x,0,b.z);b.group.rotation.y=b.heading;}
function resetBots(){
 if(!bots.length)return;
 bots.forEach((b,i)=>{b.s=(START_INDEX-(i+1)*7+TRACK_SAMPLES)%TRACK_SAMPLES;b.lat=b.baseLat=b.def.lane;b.speed=0;b.yaw=0;b.steer=0;b.finishRank=0;b.pace=paceFor(b.def);b.heading=trackAt(b.s).heading;b.total=(b.s-START_INDEX)/TRACK_SAMPLES;if(b.total>0)b.total-=1;placeBot(b);for(const w of b.frontWheels.concat(b.rearWheels))w.pivot.rotation.y=0;});
}
function runCountdown(dt){
 startTimer-=dt;
 if(startTimer>0){const n=Math.ceil(startTimer);if(n!==lastCount){lastCount=n;showToast(String(n));$('status').textContent=String(n);$('substatus').textContent='';}}
 else{startTimer=0;lastCount=-1;showToast(t('gridGo'));$('status').textContent=t('lightsOut');$('substatus').textContent=t('greenCopy');}
 positionCamera(dt,false);if(++towerTick%6===0){updateTower();drawMiniMap();}
}
function updateBots(dt){
 const N=TRACK_SAMPLES,pt=nearestTrack(car.position.x,car.position.z),pnx=pt.tangent.z,pnz=-pt.tangent.x,playerLat=(car.position.x-pt.point.x)*pnx+(car.position.z-pt.point.z)*pnz;
 const player={isPlayer:true,idx:pt.index,lat:playerLat,speed:Math.abs(speed)};
 const gapTo=(from,o)=>{let d=o.idx-from;d=((d+N/2)%N+N)%N-N/2;return d*trackDs;};
 for(const b of bots){
  const bi=((b.s%N)+N)%N,idx=Math.floor(bi),others=bots.filter(o=>o!==b).concat([player]);
  let target=cornerLimit[idx]*b.pace/WORLD_SCALE;if(b.finishRank)target*=.75;
  let ahead=null,aheadGap=1e9;
  for(const o of others){const g=gapTo(bi,o);if(g>.5&&g<16&&Math.abs(o.lat-b.lat)<3.3&&g<aheadGap){ahead=o;aheadGap=g;}}
  let latTarget=b.baseLat;
  if(ahead){
   const pref=b.lat>=ahead.lat?1:-1;
   for(const dir of [pref,-pref]){const lt=clamp(ahead.lat+dir*3.7,-7.2,7.2);if(!others.some(c=>c!==ahead&&Math.abs(gapTo(bi,c))<7&&Math.abs(c.lat-lt)<3)){latTarget=lt;break;}else latTarget=b.lat;}
   if(aheadGap<10&&Math.abs(ahead.lat-b.lat)<2.6)target=Math.min(target,ahead.speed*.97+Math.max(0,aheadGap-6)*1.2);
  }
  const sp=b.speed,accel=(sp<18?14:sp<36?10.4:sp<56?6.1:sp<72?3.8:2.1)*b.pace;
  if(b.speed<target)b.speed=Math.min(target,b.speed+accel*dt);else b.speed=Math.max(target,b.speed-28*dt);
  b.lat+=clamp(latTarget-b.lat,-5*dt,5*dt);b.lat=clamp(b.lat,-7.4,7.4);
  const px=b.x,pz=b.z;b.s+=b.speed*WORLD_SCALE*dt/trackDs;
  const pos=trackAt(b.s);b.nx=pos.tz;b.nz=-pos.tx;b.x=pos.x+b.nx*b.lat;b.z=pos.z+b.nz*b.lat;b.idx=pos.idx;
  const dx=b.x-px,dz=b.z-pz;if(Math.hypot(dx,dz)>1e-4){const diff=wrapAngle(Math.atan2(dx,dz)-b.heading);b.yaw=diff/Math.max(dt,.001);b.heading+=diff*Math.min(1,dt*10);}
  b.group.position.set(b.x,0,b.z);b.group.rotation.y=b.heading;
  const v=b.speed*WORLD_SCALE,steerTarget=clamp(Math.atan(b.yaw*3.25/Math.max(v,2)),-.42,.42);b.steer+=(steerTarget-b.steer)*Math.min(1,dt*9);
  for(const w of b.frontWheels){w.spin.rotation.x+=b.speed*dt*.20;w.pivot.rotation.y=b.steer;}for(const w of b.rearWheels)w.spin.rotation.x+=b.speed*dt*.20;
  b.total=(b.s-START_INDEX)/N;if(b.total>=3&&!b.finishRank)b.finishRank=++finishCounter;
 }
}
function resolveBotContacts(){
 for(const b of bots){
  let dx=car.position.x-b.x,dz=car.position.z-b.z,d=Math.hypot(dx,dz);const minDist=3.1;if(d>=minDist)continue;
  if(d<.001){dx=Math.sin(heading+Math.PI);dz=Math.cos(heading+Math.PI);d=1;}
  const nx=dx/d,nz=dz/d;car.position.x=b.x+nx*minDist;car.position.z=b.z+nz*minDist;
  const travel=heading+slipAngle,spd=speed*WORLD_SCALE,pvx=Math.sin(travel)*spd,pvz=Math.cos(travel)*spd,bvx=Math.sin(b.heading)*b.speed*WORLD_SCALE,bvz=Math.cos(b.heading)*b.speed*WORLD_SCALE;
  const closing=-((pvx-bvx)*nx+(pvz-bvz)*nz)/WORLD_SCALE;
  if(closing>2.5&&carHitCooldown<=0){
   const severity=clamp(Math.pow(closing/64,1.3)*.85,0,1),msg=applyCollisionDamage('CAR',nx,nz,severity,Math.sin(travel),Math.cos(travel));
   speed-=Math.sign(speed||1)*Math.min(Math.abs(speed),closing*.5);b.speed=Math.max(0,b.speed-closing*.12);b.lat=clamp(b.lat-(nx*b.nx+nz*b.nz)*1.4,-7.4,7.4);
   steer*=.5;carHitCooldown=.55;collisionBanner=1.6;collisionKind='CAR';impactDetail=msg||t('carContact');collisionShake=Math.max(collisionShake,.3+severity*.5);
   updateDamageUI();showToast(msg||t('carContact'));playImpactSound(severity);spawnImpactSparks(8,(car.position.x+b.x)/2,(car.position.z+b.z)/2);
  }
 }
}
function standings(){
 const list=[{name:t('you'),css:'#ff4d5b',player:true,total:(lap-1)+playerProg-(pastStart?0:1),finishRank:playerFinishRank,speed:Math.abs(speed)}];
 for(const b of bots)list.push({name:b.name,css:b.css,total:b.total,finishRank:b.finishRank,speed:b.speed});
 list.sort((a,c)=>{const af=a.finishRank||1e9,cf=c.finishRank||1e9;return af!==cf?af-cf:c.total-a.total;});
 return list;
}
function updateTower(){
 const tower=$('tower');if(!tower||!bots.length)return;const list=standings(),lead=list[0];
 const you=list.findIndex(r=>r.player)+1;const pos=$('pos');if(pos)pos.innerHTML=`P${you}<span style="color:#8795a9">/${list.length}</span>`;
 tower.innerHTML=list.map((r,i)=>{const gap=i===0?'':r.finishRank?'FIN':`+${Math.max(0,(lead.total-r.total)*TRACK_SAMPLES*trackDs/Math.max(lead.speed*WORLD_SCALE,20)).toFixed(1)}s`;return `<div class="tower-row${r.player?' you':''}"><b>${i+1}</b><i style="background:${r.css}"></i><span>${r.name}</span><em>${i===0?(r.finishRank?'FIN':'LEAD'):gap}</em></div>`;}).join('');
}
function spawnPuff(x,z,color,alpha,life,rise){if(!scene||impactEffects.length>140)return;if(!puffGeo)puffGeo=new THREE.SphereGeometry(.28,7,5);const mesh=new THREE.Mesh(puffGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:alpha,depthWrite:false}));mesh.position.set(x,.25,z);scene.add(mesh);impactEffects.push({mesh,smoke:true,alpha,velocity:new THREE.Vector3((Math.random()-.5)*1.2,rise,(Math.random()-.5)*1.2),life,maxLife:life});}
function buildEnvironment(skyTex){
 // Image-based lighting: bake the sky (with a hot sun) into a reflection map so paint, glass, water and the road catch real reflections.
 try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,48,32),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide})));
  const sg=new THREE.Mesh(new THREE.SphereGeometry(9,16,12),new THREE.MeshBasicMaterial({color:new THREE.Color(7,5.2,3.4),toneMapped:false}));sg.position.set(380,125,-470).normalize().multiplyScalar(90);es.add(sg);
  scene.environment=pm.fromScene(es,.03).texture;pm.dispose();}catch(e){console.warn('Environment map unavailable',e);}
}
function buildClouds(){
 cloudGroup=new THREE.Group();
 for(const [y,op,rep] of [[330,.5,2.2],[430,.38,1.6]]){
  const tex=canvasTexture(1024,1024,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);for(let i=0;i<70;i++){const x=Math.random()*w,yy=Math.random()*h,r=40+Math.random()*130,g=ctx.createRadialGradient(x,yy,0,x,yy,r);g.addColorStop(0,'rgba(255,240,226,.34)');g.addColorStop(.6,'rgba(255,226,205,.12)');g.addColorStop(1,'rgba(255,226,205,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,yy,r,0,Math.PI*2);ctx.fill();}});
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(rep,rep);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(3600,3600),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:op,depthWrite:false,fog:false}));plane.rotation.x=-Math.PI/2;plane.position.set(0,y,0);cloudGroup.add(plane);
 }
 scene.add(cloudGroup);
}
function driftClouds(dt){if(cloudGroup&&cloudGroup.visible)cloudGroup.children.forEach((c,i)=>{c.material.map.offset.x+=dt*(.0016+i*.0011);});}
function updateGlare(){const el=$('sunGlare');if(!el||!camera||!sunDiskRef||!fxEnabled)return;const v=sunDiskRef.position.clone().project(camera);if(v.z>1||Math.abs(v.x)>1.6||Math.abs(v.y)>1.6){el.style.opacity=0;return;}const k=Math.max(0,1-Math.hypot(v.x,v.y)*.55);el.style.opacity=(k*k*.95).toFixed(3);el.style.transform=`translate(${(v.x*.5+.5)*innerWidth-260}px,${(-v.y*.5+.5)*innerHeight-260}px)`;}
function applyQuality(){
 if(!renderer)return;const q={low:{pr:1,shadow:1024,fx:false},high:{pr:1.65,shadow:2048,fx:true},ultra:{pr:2.2,shadow:4096,fx:true}}[quality]||{pr:1.65,shadow:2048,fx:true};
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.pr));
 if(sunLight&&sunLight.shadow.mapSize.x!==q.shadow){sunLight.shadow.mapSize.set(q.shadow,q.shadow);if(sunLight.shadow.map){sunLight.shadow.map.dispose();sunLight.shadow.map=null;}}
 fxEnabled=q.fx;if(cloudGroup)cloudGroup.visible=q.fx;for(const id of ['sunGlare','speedFx','grade']){const el=$(id);if(el)el.style.display=q.fx?'block':'none';}
}
function bindControls(){
 const reserved=new Set(['KeyH']);
 window.addEventListener('keydown',e=>{if(document.body.classList.contains('arcade-open'))return;if(controlCaptureAction){e.preventDefault();if(e.code==='Escape'){controlCaptureAction=null;renderControlRows();return;}if(reserved.has(e.code)||['Tab','MetaLeft','MetaRight','AltLeft','AltRight','ControlLeft','ControlRight'].includes(e.code)||e.metaKey||e.ctrlKey||e.altKey){showToast(t('reservedKey'));return;}if(Object.entries(controlBindings).some(([action,codes])=>action!==controlCaptureAction&&codes.includes(e.code))){showToast(t('keyConflict'));return;}controlBindings[controlCaptureAction]=[e.code];controlCaptureAction=null;saveGameSettings();applyLanguage();showToast(t('controlSaved'));return;}if($('settingsModal').classList.contains('show')){if(e.code==='Escape')closeSettings();if(e.target!==$('languageSelect'))e.preventDefault();return;}const handled=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)||Object.values(controlBindings).some(codes=>codes.includes(e.code));if(handled)e.preventDefault();if(!e.repeat){if(controlUses('reset',e.code)){resetCar(true);}if(controlUses('pause',e.code)&&started){togglePause();}if(controlUses('camera',e.code)&&started&&!paused){cycleCamera();}if(e.code==='KeyH')$('helpModal').classList.add('show');}keys[e.code]=true;});
 window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',keysClear);
 document.querySelectorAll('[data-action]').forEach(b=>{const action=b.dataset.action;const down=e=>{e.preventDefault();mobileActions.add(action);b.classList.add('pressed');try{b.setPointerCapture(e.pointerId);}catch(_){}};const up=e=>{e.preventDefault();mobileActions.delete(action);b.classList.remove('pressed');};b.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up));});
 document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const down=e=>{e.preventDefault();keys[k]=true;b.classList.add('pressed');try{b.setPointerCapture(e.pointerId);}catch(_){}};const up=e=>{e.preventDefault();keys[k]=false;b.classList.remove('pressed');};b.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up));});
 $('startBtn').onclick=()=>{if(!started){started=true;paused=false;document.body.classList.add('racing');$('start').style.display='none';initAudio();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();$('status').textContent=t('greenFlag');$('substatus').textContent=t('greenCopy');showToast(t('greenFlag'));clock.getDelta();}else{paused=false;$('pauseOverlay').classList.remove('show');}};
 $('helpBtn').onclick=()=>$('helpModal').classList.add('show');$('pauseHelpBtn').onclick=()=>$('helpModal').classList.add('show');$('closeHelp').onclick=()=>$('helpModal').classList.remove('show');$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=()=>{paused=false;$('pauseOverlay').classList.remove('show');showToast(t('resume'));};$('restartBtn').onclick=()=>{resetCar(true);paused=false;$('pauseOverlay').classList.remove('show');};$('cameraBtn').onclick=cycleCamera;
 $('settingsBtn').onclick=openSettings;$('startSettingsBtn').onclick=openSettings;$('closeSettingsBtn').onclick=closeSettings;$('settingsModal').addEventListener('click',e=>{if(e.target===$('settingsModal'))closeSettings();});$('qualitySelect').addEventListener('change',e=>{quality=e.target.value;saveGameSettings();applyQuality();});$('difficultySelect').addEventListener('change',e=>{difficulty=e.target.value;saveGameSettings();applyBotPace();});$('languageSelect').addEventListener('change',e=>{language=e.target.value==='es'?'es':'en';saveGameSettings();applyLanguage();});$('controlRows').addEventListener('click',e=>{const button=e.target.closest('[data-bind-action]');if(!button)return;controlCaptureAction=button.dataset.bindAction;renderControlRows();showToast(t('pressKey'));});$('resetControlsBtn').onclick=()=>{controlBindings=JSON.parse(JSON.stringify(CONTROL_DEFAULTS));controlCaptureAction=null;saveGameSettings();applyLanguage();showToast(t('controlsRestored'));};
 $('sound').onclick=()=>{muted=!muted;const icon=$('sound').querySelector('.ico');icon.textContent=muted?'♩':'♫';$('sound').querySelector('.label').textContent=muted?t('soundOff'):t('soundOn');if(gain&&audioCtx)gain.gain.setTargetAtTime(muted?0:.18,audioCtx.currentTime,.07);};$('boostBtn').addEventListener('pointerdown',e=>{e.preventDefault();mobileActions.add('boost');$('boostBtn').classList.add('active');});['pointerup','pointercancel','pointerleave'].forEach(ev=>$('boostBtn').addEventListener(ev,()=>{mobileActions.delete('boost');$('boostBtn').classList.remove('active');}));
 $('steerSensitivity').addEventListener('input',e=>{sensitivity=Number(e.target.value)/100;$('senseReadout').textContent=`${Math.round(sensitivity*100)}%`;});
}
function togglePause(){if(!started)return;paused=!paused;$('pauseOverlay').classList.toggle('show',paused);if(paused){keysClear();$('status').textContent=t('paused');}else{clock.getDelta();showToast(t('resume'));}}
function cycleCamera(){cameraMode=(cameraMode+1)%3;const name=[t('cameraChase'),t('cameraCockpit'),t('cameraTv')][cameraMode];$('cameraBtn').querySelector('.label').textContent=name;showToast(name);}
function initAudio(){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();osc1=audioCtx.createOscillator();osc2=audioCtx.createOscillator();filter=audioCtx.createBiquadFilter();gain=audioCtx.createGain();mix=audioCtx.createGain();compressor=audioCtx.createDynamicsCompressor();osc1.type='sawtooth';osc2.type='triangle';filter.type='lowpass';filter.frequency.value=650;osc1.frequency.value=65;osc2.frequency.value=33;mix.gain.value=.29;osc1.connect(mix);osc2.connect(mix);mix.connect(filter);filter.connect(gain);gain.connect(compressor);compressor.threshold.value=-22;compressor.ratio.value=4;compressor.connect(audioCtx.destination);gain.gain.value=muted?0:.14;osc1.start();osc2.start();}catch(e){$('status').textContent='AUDIO UNAVAILABLE — KEEP DRIVING';}}
function update(dt){if(!started||paused||!car||$('settingsModal').classList.contains('show'))return;dt=Math.min(dt,.033);frameDt=dt;if(startTimer>0){runCountdown(dt);return;}elapsed+=dt;updateBots(dt);collisionCooldown=Math.max(0,collisionCooldown-dt);collisionShake=Math.max(0,collisionShake-dt*3.0);collisionBanner=Math.max(0,collisionBanner-dt);scrapeTimer=Math.max(0,scrapeTimer-dt);carHitCooldown=Math.max(0,carHitCooldown-dt);const throttle=actionDown('accelerate'),reverse=actionDown('reverse'),brake=actionDown('brake'),left=actionDown('left'),right=actionDown('right'),boost=actionDown('boost'),steerInput=(left?1:0)-(right?1:0);
 const previousX=car.position.x,previousZ=car.position.z,cond=carCondition();const before=nearestTrack(previousX,previousZ);offroad=before.distance>ROAD_WIDTH/2-.5;const boostActive=boost&&throttle&&!reverse&&speed>=0&&ers>0&&!offroad&&!raceFinished&&!wrecked&&engineIntegrity>0;
 // Signed speed supports a low-speed reverse gear; SPACE brakes in either direction.
 if(!raceFinished){if(brake){speed=speed>0?Math.max(0,speed-30*dt):Math.min(0,speed+22*dt);}else if(throttle&&!reverse){if(speed<0)speed=Math.min(0,speed+20*dt);else{const accel=speed<18?14.0:speed<36?10.4:speed<56?6.1:speed<72?3.8:2.1;speed+=accel*cond.engine*(1-chassisDamage*.0015)*dt;if(boostActive)speed+=5.7*cond.engine*dt;}}else if(reverse&&!throttle){if(speed>0)speed=Math.max(0,speed-22*dt);else speed=Math.max(-MAX_REVERSE_SPEED,speed-7.5*(1-damage*.002)*dt);}else if(speed>0)speed=Math.max(0,speed-(.65+.010*speed+.00042*speed*speed)*dt);else if(speed<0)speed=Math.min(0,speed+(.65+.010*Math.abs(speed)+.00042*speed*speed)*dt);speed-=Math.sign(speed)*.00020*speed*speed*dt;if(offroad)speed-=Math.sign(speed)*(3.2+Math.abs(speed)*.12)*dt;if(cond.tyreDrag>0)speed-=Math.sign(speed)*cond.tyreDrag*(1.2+Math.abs(speed)*.09)*dt;if(boostActive)ers=Math.max(0,ers-20*dt);else ers=Math.min(100,ers+(throttle?2.8:6.2)*dt);}else if(speed>0)speed=Math.max(0,speed-12*dt);else speed=Math.min(0,speed+12*dt);const topSpeed=MAX_SPEED*(.55+.45*engineIntegrity/100)*(1-chassisDamage*.002)*(wrecked?.22:1)+(boostActive?5:0);if(speed>topSpeed)speed=Math.max(topSpeed,speed-25*dt);speed=Math.max(speed,-MAX_REVERSE_SPEED);
 steer=damp(steer,steerInput*sensitivity,steerInput?13.5:8.5,dt);const v=speed*WORLD_SCALE,speedNorm=clamp(Math.abs(v)/40,0,1);const maxWheelAngle=THREE.MathUtils.lerp(.48,.105,speedNorm);steerAngle=(steer+(steeringBias+cond.tyrePull)*(1-speedNorm*.55))*maxWheelAngle;tickDamage(dt,speedNorm);
 // Bicycle-model yaw constrained by a speed-dependent tire-friction circle and aerodynamic downforce.
 const wheelbase=3.25,rawYaw=(v/wheelbase)*Math.tan(steerAngle),frontWingGrip=frontWingDetached ? .72 : .78+.22*frontWingIntegrity/100,rearWingGrip=rearWingDetached ? .75 : .78+.22*rearWingIntegrity/100,suspensionGrip=.70+.30*suspensionIntegrity/100;const aeroGrip=Math.min(13,v*v*.0105)*(.75+.125*(frontWingGrip+rearWingGrip));const tireGrip=(offroad?4.6:15.0+aeroGrip)*(1-chassisDamage*.0015)*frontWingGrip*rearWingGrip*suspensionGrip*cond.tyreGrip;const yawLimit=tireGrip/Math.max(Math.abs(v),2.5);const yawRate=clamp(rawYaw,-yawLimit,yawLimit);const gripLoss=clamp((Math.abs(rawYaw)-Math.abs(yawRate))/(Math.abs(rawYaw)+.001),0,1);
 heading+=yawRate*dt;
 // A small velocity/body angle creates believable understeer and allows a controlled ERS-off slide on the runoff.
 const slipTarget=clamp(-yawRate*(offroad?.16:.025)-steer*gripLoss*.10+cond.rearPull*.12*speedNorm,-.32,.32);slipAngle=damp(slipAngle,slipTarget,offroad?2.8:5.2,dt);
 const travelHeading=heading+slipAngle,vx=Math.sin(travelHeading)*v,vz=Math.cos(travelHeading)*v;car.position.x+=vx*dt;car.position.z+=vz*dt;car.position.y=0;car.rotation.y=heading;body.rotation.z=damp(body.rotation.z,-steer*.045-slipAngle*.22,4,dt);body.rotation.x=damp(body.rotation.x,(throttle?-.018:brake?.035:reverse?.018:0),4,dt);body.position.y=.012+Math.sin(elapsed*Math.abs(speed)*.25)*Math.min(.018,Math.abs(speed)*.0003);{const bl=car.userData.brakeLight;if(bl&&bl.material)bl.material.color.setHex(brake?0xff6a6a:0x7a1313);puffTimer-=dt;if(puffTimer<=0&&fxEnabled&&Math.abs(speed)>12){const fx=Math.sin(heading),fz=Math.cos(heading),lx=Math.cos(heading),lz=-Math.sin(heading),side=(Math.random()<.5?-1:1)*1.15;if(offroad){spawnPuff(car.position.x-fx*1.6+lx*side,car.position.z-fz*1.6+lz*side,0xb9a27c,.5,1,1.1);puffTimer=.05;}else if((brake&&Math.abs(speed)>38)||Math.abs(slipAngle)>.16){spawnPuff(car.position.x-fx*1.9+lx*side,car.position.z-fz*1.9+lz*side,0xdfe3e6,.34,.8,.9);puffTimer=.06;}else puffTimer=.08;}const fxEl=$('speedFx');if(fxEl)fxEl.style.opacity=clamp((Math.abs(speed)-52)/42,0,.75).toFixed(2);towerTick++;if(towerTick%6===0){updateTower();}}
 resolveBotContacts();const after=resolveWorldCollisions(previousX,previousZ,before),dist=after.distance,edgeOff=dist>ROAD_WIDTH/2-.5;offroad=edgeOff;
 if(collisionBanner>0){
  $('status').textContent=impactDetail||`${t(collisionKind==='BARRIER'?'barrierImpact':'objectImpact')} — ${Math.round(damage)}%`;$('surfaceName').textContent=t('impact');$('substatus').textContent=impactDetail?t('wingImpactCopy'):t('impactCopy');
 }else if(scrapeTimer>0){$('status').textContent=t('scrape');$('surfaceName').textContent=t('impact');$('substatus').textContent=t('scrapeCopy');
 }else if(wrecked){$('status').textContent=t('wrecked');$('surfaceName').textContent=t('impact');$('substatus').textContent=t('wreckedCopy');
 }else if(dist>ROAD_WIDTH/2+5){$('status').textContent=t('runoff');$('surfaceName').textContent=t('runoffSurface');$('substatus').textContent=t('runoffCopy');
 }else if(edgeOff){$('status').textContent=t('offTrack');$('surfaceName').textContent=t('curbGrass');$('substatus').textContent=t('offTrackCopy');
 }else if(speed<-.3){$('status').textContent=t('reverseStatus');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('reverseCopy').replace('{key}',keysLabel('reverse')).replace('{brake}',keysLabel('brake'));
 }else if(boostActive){$('status').textContent=t('boostActive');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('boostCopy');
 }else if(gripLoss>.20){$('status').textContent=t('understeer');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('understeerCopy');
 }else if(Math.abs(slipAngle)>.13){$('status').textContent=t('slip');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('slipCopy');
 }else if(speed>63){$('status').textContent=t('pushLap');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('pushCopy');
 }else{$('status').textContent=t('cleanLine');$('surfaceName').textContent=t('tarmac');$('substatus').textContent=t('cleanCopy');}
 const prog=((after.index-START_INDEX+TRACK_SAMPLES)%TRACK_SAMPLES)/TRACK_SAMPLES;if(!raceFinished&&lastProgress>.86&&prog<.14&&speed>8){if(!pastStart){pastStart=true;lapTime=0;}else{best=Math.min(best,lapTime);try{if(localStorage.getItem('apexBest')===null||best<Number(localStorage.getItem('apexBest')))localStorage.setItem('apexBest',String(best));}catch(_){}showToast(t('lapComplete').replace('{lap}',lap).replace('{time}',fmt(lapTime)));if(lap>=3){raceFinished=true;playerFinishRank=++finishCounter;const place=standings().findIndex(r=>r.player)+1;$('status').textContent=`${t('chequered')} · P${place}/${bots.length+1}`;$('substatus').textContent=t('chequeredCopy');showToast(`${t('raceComplete')} · P${place}`);}else{lap++;lapTime=0;}}}lastProgress=prog;playerProg=prog;if(!raceFinished)lapTime+=dt;
 const kmh=Math.abs(speed)*3.6;let gear=speed<-.5?-1:0;const thresholds=[0,75,120,165,210,250,285,315,355];if(speed>.5&&kmh>4){gear=1;for(let n=1;n<thresholds.length-1;n++)if(kmh>=thresholds[n])gear=n+1;gear=clamp(gear,1,8);}const low=thresholds[Math.max(0,gear-1)],high=thresholds[Math.min(8,gear)]||355;let rpm=gear===0?900:gear<0?4200+clamp(kmh/43,0,1)*5400:5400+clamp((kmh-low)/Math.max(1,high-low),0,1)*6300;if(throttle||reverse)rpm+=320;if(brake)rpm-=300;if(boostActive)rpm=Math.min(12000,rpm+350);rpm=clamp(rpm,800,12000);
 $('speed').textContent=(speed<-.5?'-':'')+String(Math.round(kmh)).padStart(speed<-.5?2:3,'0');$('gear').textContent=gear===0?'N':gear<0?'R':String(gear);$('lap').innerHTML=`${Math.min(lap,3)}<span style="color:#8795a9">/3</span>`;$('best').textContent=best===Infinity?'--:--':fmt(best);$('clock').textContent=fmt(elapsed).slice(0,5);$('rpmReadout').textContent='RPM '+String(Math.round(rpm)).padStart(5,'0');$('rpmFill').style.width=(rpm/12000*100)+'%';$('throttleReadout').textContent=throttle&&!brake?'100%':'0%';$('brakeReadout').textContent=brake?'100%':'0%';$('energyFill').style.width=ers+'%';$('boostBtn').classList.toggle('active',boostActive);$('boostBtn').textContent=boostActive?t('deploying'):t('overtake');$('driveMode').textContent=boostActive?t('ersMode'):t('raceMode');
 if(audioCtx&&osc1){const audioSpeed=Math.abs(speed),gearRatio=gear<0?3.9:[0,3.9,3.0,2.5,2.12,1.83,1.6,1.42,1.25][Math.max(1,gear)];let base=47+audioSpeed*2.3+audioSpeed/gearRatio*1.1;if(gear!==previousGear)base*=.77;osc1.frequency.setTargetAtTime(base,audioCtx.currentTime,.055);osc2.frequency.setTargetAtTime(base*.51,audioCtx.currentTime,.07);filter.frequency.setTargetAtTime(420+audioSpeed*15+(throttle?500:0),audioCtx.currentTime,.08);gain.gain.setTargetAtTime(muted?0:(.028+Math.min(.18,audioSpeed/520)+(boostActive?.015:0)),audioCtx.currentTime,.09);}previousGear=gear;
 for(const w of frontWheels){w.spin.rotation.x+=speed*dt*.20;w.pivot.rotation.y=steerAngle;}for(const w of rearWheels)w.spin.rotation.x+=speed*dt*.20;
 positionCamera(dt,false);if(frameCount++%3===0)drawMiniMap();
}
function positionCamera(dt,immediate=false){if(!camera||!car)return;const fx=Math.sin(heading),fz=Math.cos(heading),sideX=Math.cos(heading),sideZ=-Math.sin(heading),v=Math.abs(speed*WORLD_SCALE);let desired,look;if(cameraMode===1){desired=new THREE.Vector3(car.position.x+fx*.25,2.55,car.position.z+fz*.25);look=new THREE.Vector3(car.position.x+fx*35,1.9,car.position.z+fz*35);}else if(cameraMode===2){desired=new THREE.Vector3(car.position.x-fx*(18+v*.13)+sideX*(10+slipAngle*4),9+v*.10,car.position.z-fz*(18+v*.13)+sideZ*(10+slipAngle*4));look=new THREE.Vector3(car.position.x+fx*8,1.1,car.position.z+fz*8);}else{desired=new THREE.Vector3(car.position.x-fx*(10.5+v*.17)+sideX*(slipAngle*4),3.3+v*.095,car.position.z-fz*(10.5+v*.17)+sideZ*(slipAngle*4));look=new THREE.Vector3(car.position.x+fx*(6+v*.26),1.0,car.position.z+fz*(6+v*.26));}if(immediate)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-4.6*Math.max(dt,.001)));if(!immediate&&collisionShake>0){const sh=collisionShake;camera.position.x+=Math.sin(elapsed*83)*sh*.24;camera.position.y+=Math.cos(elapsed*97)*sh*.10;camera.position.z+=Math.sin(elapsed*71)*sh*.18;}camera.lookAt(look);if(sunLight){sunLight.target.position.set(car.position.x,0,car.position.z);sunLight.position.set(car.position.x-160,190,car.position.z-40);}camera.fov=damp(camera.fov, cameraMode===1?78:61+Math.min(9,v*.20),2.1,Math.max(dt,.001));camera.updateProjectionMatrix();}
function drawMiniMap(){const canvas=$('miniMap');if(!canvas||!trackSamples.length)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b1620';ctx.fillRect(0,0,w,h);const xs=trackSamples.map(p=>p.x),zs=trackSamples.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),pad=32,sc=Math.min((w-pad*2)/(maxX-minX),(h-pad*2)/(maxZ-minZ));const x=p=>w-(pad+(p.x-minX)*sc+(w-pad*2-(maxX-minX)*sc)/2),z=p=>h-pad-(p.z-minZ)*sc-(h-pad*2-(maxZ-minZ)*sc)/2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();trackSamples.forEach((p,i)=>i?ctx.lineTo(x(p),z(p)):ctx.moveTo(x(p),z(p)));ctx.closePath();ctx.strokeStyle='#ef4c59';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#d2d9df';ctx.lineWidth=4.2;ctx.stroke();ctx.strokeStyle='#2c3c4c';ctx.lineWidth=2.2;ctx.stroke();const sp=trackSamples[START_INDEX];ctx.fillStyle='#e7f4f2';ctx.fillRect(x(sp)-2,z(sp)-4,4,8);for(const b of bots){ctx.fillStyle=b.css;ctx.strokeStyle='#05090e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x({x:b.x,z:b.z}),z({x:b.x,z:b.z}),4.6,0,Math.PI*2);ctx.fill();ctx.stroke();}
if(car){ctx.save();ctx.translate(x(car.position),z(car.position));ctx.rotate(-heading);ctx.fillStyle='#75fff1';ctx.shadowColor='#74e6de';ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.restore();}}
function showToast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100);}function fmt(t){if(!Number.isFinite(t))return'--:--';const m=Math.floor(t/60),s=(t%60).toFixed(2).padStart(5,'0');return String(m).padStart(2,'0')+':'+s;}function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);applyQuality();}function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta()||.016,.04);if(!paused)update(dt);if(scene){updateImpactEffects(dt);driftClouds(dt);updateGlare();}if(renderer&&scene&&camera)renderer.render(scene,camera);}

// ---------------- Arcade (Hold'em, Plinko, Blackjack) ----------------
const ARCADE_CSS=`#arcade-body{--bg:#071b17;--panel:#102923;--panel2:#142f28;--felt:#0d654b;--felt-dark:#084735;--gold:#f5c66b;--cream:#f8f4e9;--muted:#a7c0b5;--line:rgba(255,255,255,.1);--red:#ec6c6c;--green:#62d5a2}
*{box-sizing:border-box}#arcade-body{margin:0;background:radial-gradient(ellipse at top,#163c31 0,#071b17 55%);color:var(--cream);font-family:'DM Sans',sans-serif;min-height:100%}button{font:inherit}.app-shell{width:min(1200px,calc(100% - 32px));margin:0 auto;padding:26px 0 18px}.topbar{display:flex;align-items:center;gap:14px;margin-bottom:22px}.brand-mark{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:var(--gold);color:#153329;font-size:30px;box-shadow:0 8px 30px #0003}.eyebrow{font-size:10px;letter-spacing:.19em;font-weight:700;color:var(--muted);margin:0 0 5px}.topbar h1{font:700 clamp(24px,3vw,34px)/1 'Space Grotesk',sans-serif;margin:0;letter-spacing:-.04em}.topbar-right{margin-left:auto;display:flex;align-items:center;gap:14px}.chip-badge{font-size:12px;color:#cee3d8;display:flex;align-items:center;gap:8px}.chip-dot{height:8px;width:8px;border-radius:100%;background:var(--green);box-shadow:0 0 12px #62d5a2aa}.table-wrap{margin-bottom:20px}.table-felt{position:relative;overflow:hidden;border-radius:240px;background:linear-gradient(145deg,#8e633a,#453021 60%,#221b16);padding:16px;box-shadow:0 22px 55px #0005,inset 0 1px #d7ad7655}.table-rail{position:absolute;inset:12px;border:1px solid #e3b77750;border-radius:230px;pointer-events:none}.table-inner{position:relative;min-height:424px;border-radius:230px;background:radial-gradient(ellipse at 50% 46%,#147657 0,#0c6248 55%,#084632 100%);border:2px solid #237b5d;box-shadow:inset 0 0 0 7px #063b2c66,inset 0 0 55px #022c2055;padding:25px 34px;display:flex;flex-direction:column;justify-content:space-between}.opponents-row{display:flex;justify-content:center;gap:clamp(14px,6vw,74px)}.player-seat{position:relative;min-width:112px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px;padding:5px 10px 8px;border:1px solid transparent;border-radius:14px;transition:.2s}.player-seat.is-active{background:#032c2270;border-color:#f5c66b88;box-shadow:0 0 22px #f5c66b16}.seat-name{font-weight:700;font-size:13px}.seat-chips{font-size:12px;color:#cae0d4}.seat-bet{font-size:11px;color:#f6d997;min-height:13px}.seat-badges{display:flex;gap:4px;justify-content:center;min-height:14px}.seat-badge{font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:2px 5px;border-radius:4px;background:#f1c76b;color:#2d291b;font-weight:700}.seat-badge.muted{background:#294c40;color:#c5dacf}.hole-cards{display:flex;justify-content:center;gap:4px;min-height:68px}.playing-card{height:68px;width:47px;background:#fffdf7;border-radius:6px;color:#202b28;box-shadow:0 3px 9px #00170f66;position:relative;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-size:21px;font-weight:700;border:1px solid #e7e0d3;flex-shrink:0}.playing-card.red{color:#d84c53}.playing-card .corner{position:absolute;left:4px;top:3px;font-size:10px;line-height:1.05;display:flex;flex-direction:column;align-items:center}.playing-card .corner.bottom{left:auto;top:auto;right:4px;bottom:3px;transform:rotate(180deg)}.playing-card .pip{font-size:23px}.playing-card.card-back{background:repeating-linear-gradient(45deg,#164f66,#164f66 4px,#206b7b 4px,#206b7b 8px);border:3px solid #f8f4e9;color:white}.playing-card.card-back:after{content:'♠';font-size:24px;color:#fff7e8;border:1px solid #ffffff85;border-radius:4px;width:25px;height:39px;display:grid;place-items:center}.center-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:174px}.pot-label{font-size:10px;font-weight:700;letter-spacing:.22em;color:#b2d5c5}.pot-amount{font:700 27px 'Space Grotesk',sans-serif;color:#fff3cf;margin:0 0 10px}.community-cards{display:flex;gap:clamp(5px,1.3vw,12px);justify-content:center;min-height:78px}.community-cards .playing-card{height:75px;width:53px;font-size:24px}.community-cards .playing-card .corner{font-size:11px}.community-cards .playing-card .pip{font-size:26px}.empty-card{height:75px;width:53px;border:1px dashed #c1e5d477;border-radius:6px;background:#ffffff08}.street-label{font-size:11px;letter-spacing:.08em;color:#b6d8c9;margin-top:12px;text-transform:uppercase}.player-row{display:flex;justify-content:center}.player-row .player-seat{min-width:150px;padding:8px 16px 10px}.player-row .playing-card{height:76px;width:53px;font-size:25px}.player-row .playing-card .corner{font-size:11px}.player-row .playing-card .pip{font-size:26px}.control-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,1fr);gap:18px}.action-panel,.help-panel{background:linear-gradient(145deg,#132f28,#0d251f);border:1px solid var(--line);border-radius:20px;padding:23px 25px;box-shadow:0 14px 35px #0002}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}.panel-heading h2,.help-panel h2{font:600 21px 'Space Grotesk',sans-serif;margin:0;letter-spacing:-.03em}.turn-pill{padding:7px 10px;border-radius:8px;background:#234438;color:#c8e4d7;font-size:11px;font-weight:700;white-space:nowrap}.turn-pill.active{background:#f3c96e;color:#332914}.game-message{color:#b7cdc3;font-size:13px;line-height:1.5;min-height:20px;margin:17px 0 20px}.action-buttons{display:flex;flex-wrap:wrap;gap:9px}.btn{border:0;border-radius:10px;padding:11px 15px;cursor:pointer;font-weight:700;font-size:12px;transition:transform .15s,filter .15s,opacity .15s}.btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}.btn:disabled{opacity:.35;cursor:not-allowed}.btn-primary{background:var(--gold);color:#273329}.btn-secondary{background:#d7e5dc;color:#173228}.btn-danger{background:#673c3b;color:#ffe6e1}.btn-gold{background:#9d7e39;color:#fff4d2}.btn-quiet{border:1px solid var(--line);background:#ffffff08;color:#d9e8e1}.table-footer{display:flex;gap:22px;color:#94afa2;font-size:10px;margin-top:23px}.mini-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px}.mini-dot.green{background:var(--green)}.mini-dot.gold{background:var(--gold)}.help-panel>p:not(.eyebrow){font-size:12px;line-height:1.6;color:#a9c1b5;margin:12px 0 18px}.guide-steps{display:grid;gap:12px;margin-bottom:18px}.guide-steps>div{display:flex;gap:11px;align-items:center}.step-number{flex:0 0 27px;height:27px;border-radius:9px;background:#25483a;color:var(--gold);display:grid;place-items:center;font-weight:700;font-size:11px}.guide-steps p{font-size:11px;line-height:1.5;color:#9fb9ac;margin:0}.guide-steps b{color:#e7f0e9;font-size:12px}.hand-rankings{display:flex;flex-wrap:wrap;gap:6px}.hand-rankings span{font-size:9px;border:1px solid #ffffff14;border-radius:5px;padding:5px 7px;color:#a6beb2;background:#ffffff04}footer{font-size:10px;text-align:center;color:#668779;padding:20px 0 0}.winner-highlight{outline:2px solid var(--gold)!important;box-shadow:0 0 25px #f5c66b3a!important}.small-note{font-size:10px;color:#a1b9ad}
@media(max-width:760px){.app-shell{width:min(100% - 18px,600px);padding-top:16px}.topbar{gap:10px}.brand-mark{width:40px;height:40px;border-radius:12px}.topbar-right{gap:8px}.chip-badge{display:none}.table-felt{padding:9px;border-radius:120px}.table-rail{inset:7px;border-radius:115px}.table-inner{min-height:445px;padding:17px 8px;border-radius:115px}.opponents-row{gap:4px;align-items:flex-start}.player-seat{min-width:0;padding:5px 3px;flex:1}.seat-name{font-size:11px}.seat-chips{font-size:10px}.hole-cards{min-height:55px;gap:2px}.playing-card{height:55px;width:37px;font-size:17px}.playing-card .corner{font-size:8px;left:3px;top:3px}.playing-card .pip{font-size:19px}.community-cards{gap:4px;min-height:64px}.community-cards .playing-card{height:63px;width:43px;font-size:19px}.community-cards .playing-card .corner{font-size:9px}.community-cards .playing-card .pip{font-size:22px}.empty-card{height:63px;width:43px}.center-stage{min-height:190px}.player-row .player-seat{min-width:128px}.player-row .playing-card{height:66px;width:46px;font-size:21px}.player-row .playing-card .corner{font-size:9px}.player-row .playing-card .pip{font-size:23px}.control-layout{grid-template-columns:1fr}.action-panel,.help-panel{padding:19px}.btn{padding:12px 13px;flex:1}.btn-quiet{flex:none}.hand-rankings span{font-size:10px}}
@media(max-width:390px){.table-inner{padding-inline:3px}.playing-card{width:32px}.community-cards .playing-card,.empty-card{width:38px}.player-row .playing-card{width:42px}.seat-name{font-size:10px}.action-buttons{gap:6px}}

/* Arcade mode switch */
.game-mode[hidden]{display:none!important}.mode-switch{display:flex;gap:8px;margin:-4px 0 20px;padding:6px;width:max-content;max-width:100%;border:1px solid var(--line);border-radius:14px;background:#051611aa}.mode-tab{border:0;border-radius:10px;padding:11px 17px;background:transparent;color:#a9c4b7;font-size:12px;font-weight:700;cursor:pointer;transition:background .18s,color .18s,transform .18s}.mode-tab:hover{color:var(--cream);transform:translateY(-1px)}.mode-tab.active{background:var(--gold);color:#23342b;box-shadow:0 4px 16px #0002}

/* Plinko game */
.plinko-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,.8fr);gap:18px;align-items:stretch}.plinko-panel,.plinko-side-panel{min-width:0;background:linear-gradient(145deg,#132f28,#0b221d);border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:0 14px 35px #0002}.plinko-heading-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.plinko-heading-row h2,.plinko-side-panel h2{font:700 27px 'Space Grotesk',sans-serif;letter-spacing:-.05em;margin:0}.plinko-bankroll{display:flex;flex-direction:column;align-items:flex-end;gap:3px;padding:9px 12px;border:1px solid #f5c66b38;border-radius:12px;background:#f5c66b0b}.plinko-bankroll span{font-size:9px;letter-spacing:.13em;color:#b7c9bf;font-weight:700}.plinko-bankroll strong{font:700 20px 'Space Grotesk',sans-serif;color:var(--gold);font-variant-numeric:tabular-nums}.plinko-board-wrap{margin:12px auto 0;max-width:760px;width:100%;border-radius:17px;overflow:hidden;background:#091a2a;border:1px solid #6c90bc2b;box-shadow:inset 0 0 40px #06101c}.plinko-board-wrap canvas{display:block;width:100%;height:auto}.plinko-status{font-size:13px;line-height:1.45;min-height:40px;display:flex;align-items:center;justify-content:center;text-align:center;margin:13px 0 12px;padding:10px 12px;border:1px solid #ffffff10;border-radius:11px;background:#ffffff05;color:#d5e5db}.plinko-controls{display:flex;align-items:stretch;gap:9px;flex-wrap:wrap}.stake-control{display:flex;flex-direction:column;gap:5px;min-width:120px;flex:1}.stake-control span{font-size:9px;letter-spacing:.14em;font-weight:700;color:#9fb9ad}.stake-control select{width:100%;height:40px;padding:0 10px;border:1px solid #ffffff1a;border-radius:10px;background:#0a1d18;color:var(--cream);font:600 12px 'DM Sans',sans-serif;outline:none}.stake-control select:focus{border-color:#f5c66b99}.drop-button{min-width:130px;font-size:13px}.plinko-controls .btn{align-self:flex-end;min-height:40px}.plinko-footnote{font-size:10px;color:#8ca99a;margin-top:16px;text-align:center}.plinko-footnote span{color:var(--green);font-size:9px;margin-right:5px}.plinko-side-panel{display:flex;flex-direction:column}.plinko-side-panel>p:not(.eyebrow){font-size:12px;line-height:1.7;color:#a9c1b5;margin:13px 0 23px}.multiplier-list{display:grid;gap:0;border:1px solid #ffffff12;border-radius:13px;overflow:hidden}.multiplier-list>div{display:flex;align-items:center;gap:9px;padding:12px 13px;background:#ffffff03;border-bottom:1px solid #ffffff0c;font-size:11px;color:#bbd0c5}.multiplier-list>div:last-child{border-bottom:0}.multiplier-list b{margin-left:auto;color:var(--cream);font-size:12px;font-variant-numeric:tabular-nums}.mult-dot{width:9px;height:9px;border-radius:3px;display:block;flex:0 0 auto}.mult-dot.hot{background:#ff647e;box-shadow:0 0 10px #ff647e55}.mult-dot.warm{background:#ffb45d}.mult-dot.mid{background:#f5d56b}.mult-dot.cool{background:#66d6b2}.plinko-tip{margin-top:20px;padding:13px;border-radius:13px;background:#f5c66b0c;border:1px solid #f5c66b20}.plinko-tip strong{font-size:9px;letter-spacing:.16em;color:var(--gold)}.plinko-tip p{font-size:11px;line-height:1.6;color:#a9c1b5;margin:7px 0 0}.back-to-poker{margin-top:auto;width:100%;margin-top:20px}.mode-tab:focus-visible,.btn:focus-visible{outline:2px solid #fff1c5;outline-offset:3px}
@media(max-width:850px){.plinko-layout{grid-template-columns:1fr}.plinko-side-panel{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.plinko-side-panel>.eyebrow,.plinko-side-panel h2,.plinko-side-panel>p:not(.eyebrow),.multiplier-list,.plinko-tip,.back-to-poker{grid-column:1/-1}.plinko-side-panel>p:not(.eyebrow){margin-bottom:15px}.plinko-tip{margin-top:15px}.back-to-poker{margin-top:15px}}
@media(max-width:560px){.mode-switch{width:100%}.mode-tab{flex:1;padding:11px 8px;font-size:11px}.plinko-panel,.plinko-side-panel{padding:14px;border-radius:17px}.plinko-heading-row h2{font-size:24px}.plinko-bankroll{padding:7px 9px}.plinko-bankroll strong{font-size:17px}.plinko-controls .btn{flex:1}.stake-control{min-width:100px}.drop-button{min-width:100px}.plinko-status{font-size:12px}.plinko-side-panel{display:flex}.plinko-side-panel h2{font-size:22px}}

/* Poker upgrades */
.hand-readout{font-size:12px;color:#f6d997;min-height:16px;margin:-8px 0 14px;font-weight:600}.raise-tools{margin:0 0 16px;padding:13px 14px;border:1px solid #ffffff12;border-radius:13px;background:#ffffff05}.raise-tools[hidden]{display:none}.raise-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}.raise-row label{font-size:9px;letter-spacing:.14em;font-weight:700;color:#9fb9ad}.raise-row output{font:700 18px 'Space Grotesk',sans-serif;color:var(--gold);font-variant-numeric:tabular-nums}.raise-tools input[type=range]{width:100%;accent-color:var(--gold);margin:4px 0 10px}.raise-presets{display:flex;gap:7px}.raise-presets .btn{flex:1;padding:8px 6px;font-size:11px}.odds-toggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:#a9c4b7}.odds-toggle input{accent-color:var(--gold)}.shortcut-hint{font-size:10px;color:#7f9d8f;margin:12px 0 0}.shortcut-hint kbd{font:700 9px 'DM Sans',sans-serif;border:1px solid #ffffff22;border-bottom-width:2px;border-radius:4px;padding:1px 5px;background:#ffffff08;color:#d9e8e1}.log-wrap{margin-top:16px;padding-top:14px;border-top:1px solid #ffffff10}.hand-log{list-style:none;margin:0;padding:0;display:grid;gap:3px;font-size:11px;color:#8fada0;max-height:118px;overflow:hidden}.hand-log li{line-height:1.4}.hand-log li:first-child{color:#e3efe8}.hand-log li:nth-child(n+4){opacity:.65}.player-seat.winner-highlight{border-color:#f5c66b;background:#f5c66b12}
/* Plinko upgrades */
.plinko-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 13px}.plinko-history{display:flex;gap:6px;flex-wrap:wrap;min-height:26px;align-items:center}.history-empty{font-size:10px;color:#6f8c7e}.history-chip{font:700 11px 'Space Grotesk',sans-serif;padding:4px 8px;border-radius:7px;border:1px solid #ffffff14;background:#ffffff08;font-variant-numeric:tabular-nums}.history-chip.win{color:#7fe3b4;border-color:#62d5a255}.history-chip.even{color:#f5d56b;border-color:#f5d56b44}.history-chip.loss{color:#ff8d9c;border-color:#ec6c6c44}.plinko-stats{display:flex;gap:14px;font-size:9px;letter-spacing:.13em;font-weight:700;color:#8fa99c}.plinko-stats b{font:700 13px 'Space Grotesk',sans-serif;color:var(--cream);letter-spacing:0;margin-left:3px;font-variant-numeric:tabular-nums}

/* Blackjack */
.bj-felt{margin:12px 0 0;padding:20px 18px;border-radius:17px;background:radial-gradient(ellipse at 50% 40%,#147657 0,#0c6248 60%,#084632 100%);border:2px solid #237b5d;box-shadow:inset 0 0 0 6px #063b2c66,inset 0 0 45px #022c2055;display:grid;gap:18px;min-height:340px;align-content:space-between}.bj-row{display:grid;gap:8px;justify-items:center}.bj-label{margin:0;font-size:10px;letter-spacing:.2em;font-weight:700;color:#b2d5c5}.bj-label b{margin-left:6px;color:#fff3cf;font:700 15px 'Space Grotesk',sans-serif;letter-spacing:0}.bj-cards{display:flex;gap:8px;justify-content:center;min-height:108px;flex-wrap:wrap}.bj-cards .playing-card{height:104px;width:72px;font-size:30px;animation:bj-deal .28s ease-out}.bj-cards .playing-card .corner{font-size:13px}.bj-cards .playing-card .pip{font-size:32px}.bj-cards .playing-card.card-back:after{width:36px;height:56px;font-size:30px}@keyframes bj-deal{from{transform:translateY(-18px) scale(.9);opacity:0}to{transform:none;opacity:1}}.bj-controls .btn{align-self:flex-end;min-height:40px}.bj-stats{display:flex;gap:14px;margin-top:18px;font-size:9px;letter-spacing:.13em;font-weight:700;color:#8fa99c}.bj-stats b{font:700 13px 'Space Grotesk',sans-serif;color:var(--cream);letter-spacing:0;margin-left:3px}.plinko-footnote b{color:#d9e8e1}
@media(max-width:560px){.bj-cards .playing-card{height:84px;width:58px;font-size:24px}.bj-felt{min-height:300px;padding:16px 10px}.bj-controls .btn{flex:1 1 30%}}
`;
const ARCADE_HTML=`<main class="app-shell">
    <header class="topbar">
      <div class="brand-mark">♠</div>
      <div>
        <p class="eyebrow">PLAY-MONEY ARCADE</p>
        <h1>Table Talk Arcade</h1>
      </div>
      <div class="topbar-right">
        <span class="chip-badge"><span class="chip-dot"></span> Casual table</span>
        <button id="new-match" class="btn btn-quiet">New match</button>
        <button id="arcade-close" class="btn btn-primary" title="Esc">✕ Back to race</button>
      </div>
    </header>

    <nav class="mode-switch" aria-label="Choose a game" role="tablist">
      <button id="poker-tab" class="mode-tab active" role="tab" aria-selected="true" aria-controls="poker-mode">♠ Texas Hold’em</button>
      <button id="plinko-tab" class="mode-tab" role="tab" aria-selected="false" aria-controls="plinko-mode">🔵 Plinko</button>
      <button id="blackjack-tab" class="mode-tab" role="tab" aria-selected="false" aria-controls="blackjack-mode">🃏 Blackjack</button>
    </nav>

    <div id="poker-mode" class="game-mode">
    <section class="table-wrap" aria-label="Poker table">
      <div class="table-felt">
        <div class="table-rail"></div>
        <div class="table-inner">
          <div class="opponents-row" id="opponents-row"></div>

          <div class="center-stage">
            <div class="pot-label">POT</div>
            <div class="pot-amount" id="pot-amount">0</div>
            <div class="community-cards" id="community-cards" aria-label="Community cards"></div>
            <div class="street-label" id="street-label">Waiting for the deal</div>
          </div>

          <div class="player-row" id="player-row"></div>
        </div>
      </div>
    </section>

    <section class="control-layout">
      <div class="action-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">YOUR MOVE</p>
            <h2 id="action-title">Ready to play?</h2>
          </div>
          <span id="turn-pill" class="turn-pill">Table idle</span>
        </div>
        <p id="game-message" class="game-message">Deal in and see what you’re working with.</p>
        <p id="hand-readout" class="hand-readout" aria-live="polite"></p>
        <div id="raise-tools" class="raise-tools" hidden>
          <div class="raise-row">
            <label for="raise-slider">RAISE AMOUNT</label>
            <output id="raise-amount" for="raise-slider">0</output>
          </div>
          <input id="raise-slider" type="range" min="0" max="100" value="0" step="1" aria-label="Raise amount" />
          <div class="raise-presets">
            <button type="button" class="btn btn-quiet" data-preset="min">Min</button>
            <button type="button" class="btn btn-quiet" data-preset="0.5">½ pot</button>
            <button type="button" class="btn btn-quiet" data-preset="0.75">¾ pot</button>
            <button type="button" class="btn btn-quiet" data-preset="1">Pot</button>
          </div>
        </div>
        <div class="action-buttons">
          <button id="fold-btn" class="btn btn-danger" disabled>Fold</button>
          <button id="call-btn" class="btn btn-secondary" disabled>Check</button>
          <button id="raise-btn" class="btn btn-primary" disabled>Raise</button>
          <button id="allin-btn" class="btn btn-gold" disabled>All in</button>
          <button id="next-hand-btn" class="btn btn-primary" hidden>Deal next hand →</button>
        </div>
        <div class="table-footer">
          <span><i class="mini-dot green"></i> Blinds: 10 / 20</span>
          <span><i class="mini-dot gold"></i> No real money</span>
          <label class="odds-toggle"><input type="checkbox" id="odds-toggle" /> Show win odds</label>
        </div>
        <p class="shortcut-hint">Shortcuts: <kbd>F</kbd> fold · <kbd>C</kbd> check/call · <kbd>R</kbd> raise · <kbd>A</kbd> all in · <kbd>N</kbd> next hand</p>
        <div class="log-wrap"><p class="eyebrow">TABLE TALK</p><ol id="hand-log" class="hand-log"></ol></div>
      </div>

      <aside class="help-panel">
        <p class="eyebrow">QUICK GUIDE</p>
        <h2>How to play</h2>
        <p>Make the best five-card poker hand using your two private cards and the five shared cards.</p>
        <div class="guide-steps">
          <div><span class="step-number">1</span><p><b>Pre-flop</b><br />You get two private cards.</p></div>
          <div><span class="step-number">2</span><p><b>Flop, turn, river</b><br />Five community cards appear.</p></div>
          <div><span class="step-number">3</span><p><b>Showdown</b><br />Best hand wins the pot.</p></div>
        </div>
        <div class="hand-rankings">
          <span>Royal / straight flush</span><span>Four of a kind</span><span>Full house</span><span>Flush</span><span>Straight</span><span>Three of a kind</span><span>Two pair</span><span>One pair</span><span>High card</span>
        </div>
      </aside>
    </section>
    </div>

    <section id="plinko-mode" class="game-mode plinko-layout" hidden aria-labelledby="plinko-heading">
      <div class="plinko-panel">
        <div class="plinko-heading-row">
          <div>
            <p class="eyebrow">DROP • BOUNCE • WIN</p>
            <h2 id="plinko-heading">PLINKO</h2>
          </div>
          <div class="plinko-bankroll"><span>YOUR PLAY CHIPS</span><strong id="plinko-balance">1,000</strong></div>
        </div>
        <div class="plinko-board-wrap">
          <canvas id="plinko-canvas" width="760" height="510" aria-label="Plinko board with pegs and prize slots">Plinko board. Use the drop button to play.</canvas>
        </div>
        <div class="plinko-status" id="plinko-result" aria-live="polite">Pick your stake and drop a ball. Good luck, dawg. 🥀</div>
        <div class="plinko-meta">
          <div class="plinko-history" id="plinko-history" aria-label="Recent drops"><span class="history-empty">Recent drops show up here</span></div>
          <div class="plinko-stats"><span>DROPS <b id="stat-drops">0</b></span><span>NET <b id="stat-net">0</b></span><span>BEST <b id="stat-best">—</b></span></div>
        </div>
        <div class="plinko-controls">
          <label class="stake-control" for="risk-level"><span>RISK</span>
            <select id="risk-level">
              <option value="low">Low risk</option>
              <option value="medium" selected>Medium risk</option>
              <option value="high">High risk</option>
            </select>
          </label>
          <label class="stake-control" for="bet-size"><span>BET SIZE</span>
            <select id="bet-size">
              <option value="10">10 chips</option>
              <option value="25">25 chips</option>
              <option value="50">50 chips</option>
              <option value="100">100 chips</option>
              <option value="250">250 chips</option>
            </select>
          </label>
          <button id="drop-ball" class="btn btn-primary drop-button" title="Shortcut: Space">⬇ Drop ball</button>
          <button id="refill-plinko" class="btn btn-quiet">Reset chips</button>
        </div>
        <div class="plinko-footnote"><span>●</span> Pretend chips only · No real-money wagering</div>
      </div>

      <aside class="plinko-side-panel">
        <p class="eyebrow">HOW TO PLAY</p>
        <h2>Let it bounce.</h2>
        <p>Choose a bet, drop the ball, and watch it bounce through the pegs. The slot it lands in decides your payout.</p>
        <div class="multiplier-list" id="multiplier-list">
          <div><i class="mult-dot hot"></i><span>Edge slots</span><b>10×</b></div>
          <div><i class="mult-dot warm"></i><span>Big wins</span><b>4×–5×</b></div>
          <div><i class="mult-dot mid"></i><span>Nice hits</span><b>1.5×–3×</b></div>
          <div><i class="mult-dot cool"></i><span>Center slots</span><b>0.4×–1×</b></div>
        </div>
        <div class="plinko-tip"><strong>PRO TIP</strong><p>The center slots are easier to hit. The far edges pay more, but are much harder to land in.</p></div>
        <button id="back-to-poker" class="btn btn-secondary back-to-poker">← Back to Hold’em</button>
      </aside>
    </section>

    <section id="blackjack-mode" class="game-mode plinko-layout" hidden aria-labelledby="bj-heading">
      <div class="plinko-panel">
        <div class="plinko-heading-row">
          <div>
            <p class="eyebrow">BEAT THE DEALER</p>
            <h2 id="bj-heading">BLACKJACK</h2>
          </div>
          <div class="plinko-bankroll"><span>YOUR PLAY CHIPS</span><strong id="bj-balance">1,000</strong></div>
        </div>
        <div class="bj-felt">
          <div class="bj-row"><p class="bj-label">DEALER <b id="bj-dealer-total"></b></p><div class="bj-cards" id="bj-dealer" aria-label="Dealer cards"></div></div>
          <div class="bj-row"><p class="bj-label">YOU <b id="bj-player-total"></b></p><div class="bj-cards" id="bj-player" aria-label="Your cards"></div></div>
        </div>
        <div class="plinko-status" id="bj-message" aria-live="polite">Place your bet and deal. Blackjack pays 3:2.</div>
        <div class="plinko-controls bj-controls">
          <label class="stake-control" for="bj-bet"><span>BET SIZE</span>
            <select id="bj-bet">
              <option value="10">10 chips</option>
              <option value="25" selected>25 chips</option>
              <option value="50">50 chips</option>
              <option value="100">100 chips</option>
              <option value="250">250 chips</option>
            </select>
          </label>
          <button id="bj-deal" class="btn btn-primary drop-button">Deal</button>
          <button id="bj-hit" class="btn btn-secondary" disabled>Hit</button>
          <button id="bj-stand" class="btn btn-secondary" disabled>Stand</button>
          <button id="bj-double" class="btn btn-gold" disabled>Double</button>
          <button id="bj-reset" class="btn btn-quiet">Reset chips</button>
        </div>
        <div class="plinko-footnote"><span>●</span> Pretend chips only · No real-money wagering · Keys: <b>H</b> hit · <b>S</b> stand · <b>D</b> double · <b>N</b>/<b>Space</b> deal</div>
      </div>
      <aside class="plinko-side-panel">
        <p class="eyebrow">HOW TO PLAY</p>
        <h2>Get to 21.</h2>
        <p>Beat the dealer without going over 21. Aces count as 1 or 11, face cards as 10. The dealer must hit until 17 and stands on all 17s.</p>
        <div class="multiplier-list">
          <div><i class="mult-dot hot"></i><span>Blackjack</span><b>3:2</b></div>
          <div><i class="mult-dot mid"></i><span>Regular win</span><b>1:1</b></div>
          <div><i class="mult-dot cool"></i><span>Push (tie)</span><b>bet back</b></div>
          <div><i class="mult-dot warm"></i><span>Double down</span><b>2× bet</b></div>
        </div>
        <div class="plinko-tip"><strong>PRO TIP</strong><p>Double on 10 or 11 when the dealer shows a weak card. Stand on 12–16 if the dealer shows 2–6.</p></div>
        <div id="bj-stats" class="bj-stats"><span>HANDS <b id="bj-hands">0</b></span><span>WON <b id="bj-won">0</b></span><span>NET <b id="bj-net">0</b></span></div>
        <button class="btn btn-secondary back-to-poker" data-go="poker">← Back to Hold’em</button>
      </aside>
    </section>

    <footer>Built for friendly games. All chips are pretend; no real-money wagering.</footer>
  </main>`;
function initArcadeGames(ARC) {
  'use strict';
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = {11:'J', 12:'Q', 13:'K', 14:'A'};
  const STARTING_STACK = 1000, SMALL_BLIND = 10, BIG_BLIND = 20;
  const $ = (id) => ARC.getElementById(id);
  const ui = {
    opponents: $('opponents-row'), player: $('player-row'), board: $('community-cards'), pot: $('pot-amount'), street: $('street-label'),
    message: $('game-message'), title: $('action-title'), pill: $('turn-pill'), fold: $('fold-btn'), call: $('call-btn'), raise: $('raise-btn'),
    allin: $('allin-btn'), next: $('next-hand-btn'), newMatch: $('new-match'), readout: $('hand-readout'), log: $('hand-log'),
    raiseTools: $('raise-tools'), slider: $('raise-slider'), raiseAmount: $('raise-amount'), odds: $('odds-toggle')
  };
  let state;
  let botTimer = null;

  // ---------- Helpers ----------
  function makeDeck() {
    const deck = [];
    for (const s of SUITS) for (let r = 2; r <= 14; r++) deck.push({r, s});
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  const rankText = r => RANKS[r] || String(r);
  const cardText = c => `${rankText(c.r)}${c.s}`;
  const money = n => `${Math.max(0, Math.round(n)).toLocaleString()} chips`;
  const livePlayers = () => state.players.filter(p => p.inHand && !p.folded);
  const canAct = p => p.inHand && !p.folded && !p.allIn && p.chips > 0;
  const humanTurn = () => state.actor === 0 && !state.handOver && state.players[0].inHand && canAct(state.players[0]);
  const totalPot = () => state.players.reduce((sum, p) => sum + p.totalBet, 0);
  const nextIndex = (from, predicate) => {
    for (let step = 1; step <= state.players.length; step++) {
      const idx = (from + step) % state.players.length;
      if (predicate(state.players[idx])) return idx;
    }
    return -1;
  };
  function say(message) {
    state.message = message; ui.message.textContent = message;
    state.log.unshift(message); if (state.log.length > 40) state.log.pop();
  }
  const maxTo = p => p.bet + p.chips;
  const minRaiseTo = p => Math.min(state.currentBet + state.lastRaise, maxTo(p));
  const potAfterCall = p => state.pot + Math.max(0, state.currentBet - p.bet);
  const clampRaise = (p, v) => Math.max(minRaiseTo(p), Math.min(maxTo(p), Math.round(v)));
  const someoneCanRespond = idx => state.players.some((o, i) => i !== idx && canAct(o));
  const canRaiseNow = (p, idx) => canAct(p) && maxTo(p) > state.currentBet && someoneCanRespond(idx);

  function makePlayers() {
    const mk = (name, human, agg) => ({name, chips:STARTING_STACK, hole:[], folded:false, allIn:false, inHand:true, bet:0, totalBet:0, acted:false, human, agg});
    return [mk('You', true, 1), mk('Riley', false, 1.2), mk('Jordan', false, .85), mk('Casey', false, 1)];
  }
  function newMatch() {
    if (botTimer) clearTimeout(botTimer);
    state = {players:makePlayers(), deck:[], board:[], pot:0, currentBet:0, lastRaise:BIG_BLIND, raiseTarget:null, actor:-1, dealer:0, smallBlind:-1, bigBlind:-1, street:'idle', handOver:true, message:'Welcome to the table. Deal your first hand.', lastResult:'', handNumber:0, reveal:false, winners:[], log:[], oddsKey:'', oddsValue:null};
    render();
    beginHand();
  }

  // ---------- Hand flow ----------
  function beginHand() {
    if (botTimer) clearTimeout(botTimer);
    if (state.players[0].chips <= 0 || state.players.filter(p => p.chips > 0).length < 2) {
      state.handOver = true;
      say(state.players[0].chips > 0 ? 'You win the match! Start a new match to play again.' : 'Your stack is empty. Start a new match and try again.');
      render(); return;
    }
    state.handNumber++;
    state.deck = makeDeck(); state.board = []; state.pot = 0; state.currentBet = 0; state.lastRaise = BIG_BLIND; state.raiseTarget = null;
    state.lastResult = ''; state.reveal = false; state.winners = [];
    state.players.forEach(p => {
      p.hole = []; p.folded = false; p.allIn = false; p.inHand = p.chips > 0; p.bet = 0; p.totalBet = 0; p.acted = false;
    });
    if (state.handNumber > 1 || state.players[state.dealer].chips <= 0) {
      const nextDealer = nextIndex(state.dealer, p => p.chips > 0);
      if (nextDealer >= 0) state.dealer = nextDealer;
    }
    state.smallBlind = nextIndex(state.dealer, p => p.inHand);
    state.bigBlind = nextIndex(state.smallBlind, p => p.inHand);
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < state.players.length; i++) {
        const p = state.players[(state.dealer + i) % state.players.length];
        if (p.inHand) p.hole.push(state.deck.pop());
      }
    }
    postBlind(state.smallBlind, SMALL_BLIND);
    postBlind(state.bigBlind, BIG_BLIND);
    state.currentBet = Math.max(...state.players.map(p => p.bet));
    state.street = 'pre-flop'; state.handOver = false;
    const me = state.players[0];
    say(me.inHand ? `Hand #${state.handNumber}. You have ${cardText(me.hole[0])} ${cardText(me.hole[1])}.` : `Hand #${state.handNumber}.`);
    if (nobodyToAct()) { runoutAndShowdown(); return; }
    state.actor = nextIndex(state.bigBlind, canAct);
    render(); scheduleBot();
  }
  function postBlind(index, amount) {
    if (index < 0) return;
    const p = state.players[index];
    const paid = Math.min(amount, p.chips);
    p.chips -= paid; p.bet += paid; p.totalBet += paid; state.pot += paid;
    if (p.chips === 0) p.allIn = true;
  }
  function commit(p, amount) {
    const paid = Math.max(0, Math.min(Math.floor(amount), p.chips));
    p.chips -= paid; p.bet += paid; p.totalBet += paid; state.pot += paid;
    if (p.chips === 0) p.allIn = true;
    return paid;
  }
  // Raise (or bet) to a total street amount; tracks the minimum re-raise and reopens the action.
  function raiseTo(p, target) {
    target = Math.min(Math.floor(target), maxTo(p));
    const old = state.currentBet;
    commit(p, target - p.bet);
    if (p.bet > old) {
      const increase = p.bet - old;
      if (increase >= state.lastRaise) state.lastRaise = increase;
      state.currentBet = p.bet;
      state.players.forEach(o => { if (o !== p && canAct(o)) o.acted = false; });
    }
    p.acted = true;
  }
  function raiseMessage(p, wasBet) {
    const you = p.human, tail = p.chips === 0 ? ' — all in!' : '.';
    return wasBet ? `${you ? 'You bet' : p.name + ' bets'} ${p.bet}${tail}` : `${you ? 'You raise' : p.name + ' raises'} to ${p.bet}${tail}`;
  }
  function nobodyToAct() {
    const a = state.players.filter(canAct);
    return a.length === 0 || (a.length === 1 && a[0].bet >= state.currentBet);
  }
  function setStreet(street) {
    state.street = street; state.currentBet = 0; state.lastRaise = BIG_BLIND; state.raiseTarget = null;
    state.players.forEach(p => {p.bet = 0; p.acted = false;});
    if (street === 'flop') state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
    else state.board.push(state.deck.pop());
    say(street === 'flop' ? 'The flop is out. What are you thinking?' : street === 'turn' ? 'The turn card is out.' : 'River card. Last chance to make your hand.');
    if (nobodyToAct()) { runoutAndShowdown(); return; }
    state.actor = nextIndex(state.dealer, canAct);
    render(); scheduleBot();
  }
  function allActed() {
    return state.players.filter(canAct).every(p => p.acted && p.bet === state.currentBet);
  }
  function continueAfterAction(previousActor) {
    state.raiseTarget = null;
    if (livePlayers().length === 1) { awardUncontested(livePlayers()[0]); return; }
    if (nobodyToAct()) { runoutAndShowdown(); return; }
    if (allActed()) {
      if (state.street === 'river') { showdown(); return; }
      setStreet(state.street === 'pre-flop' ? 'flop' : state.street === 'flop' ? 'turn' : 'river');
      return;
    }
    state.actor = nextIndex(previousActor, canAct);
    if (state.actor < 0) { runoutAndShowdown(); return; }
    render(); scheduleBot();
  }

  // ---------- Human actions ----------
  function doFold() {
    if (!humanTurn()) return;
    const p = state.players[0]; p.folded = true; p.acted = true;
    say('You fold. Let’s see how this hand plays out.');
    continueAfterAction(0); render();
  }
  function doCallCheck() {
    if (!humanTurn()) return;
    const p = state.players[0], need = Math.max(0, state.currentBet - p.bet);
    const paid = commit(p, need); p.acted = true;
    say(need === 0 ? 'You check.' : paid < need ? `You call all-in for ${paid} chips.` : `You call ${paid} chips.`);
    continueAfterAction(0); render();
  }
  function doRaise() {
    if (!humanTurn()) return;
    const p = state.players[0];
    if (!canRaiseNow(p, 0)) { doCallCheck(); return; }
    const wasBet = state.currentBet === 0;
    raiseTo(p, clampRaise(p, state.raiseTarget ?? minRaiseTo(p)));
    say(raiseMessage(p, wasBet));
    continueAfterAction(0); render();
  }
  function doAllIn() {
    if (!humanTurn()) return;
    const p = state.players[0];
    if (p.chips <= 0) return;
    if (maxTo(p) > state.currentBet && someoneCanRespond(0)) {
      const wasBet = state.currentBet === 0;
      raiseTo(p, maxTo(p)); say(raiseMessage(p, wasBet));
    } else {
      const paid = commit(p, p.chips); p.acted = true; say(`You call all-in for ${paid} chips.`);
    }
    continueAfterAction(0); render();
  }

  // ---------- Bots ----------
  // Monte Carlo equity: deal random opponent hands and board runouts, count wins and split ties.
  function estimateEquity(p, sims = 80) {
    const opps = livePlayers().filter(o => o !== p).length;
    if (!opps) return 1;
    const known = new Set([...p.hole, ...state.board].map(cardText));
    const pool = [];
    for (const s of SUITS) for (let r = 2; r <= 14; r++) { const c = {r, s}; if (!known.has(cardText(c))) pool.push(c); }
    const boardNeeded = 5 - state.board.length, need = opps * 2 + boardNeeded;
    let score = 0;
    for (let i = 0; i < sims; i++) {
      for (let k = 0; k < need; k++) { const j = k + Math.floor(Math.random() * (pool.length - k)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
      const board = state.board.concat(pool.slice(0, boardNeeded));
      const mine = evaluateBest([...p.hole, ...board]).score;
      let beaten = false, ties = 0;
      for (let o = 0; o < opps; o++) {
        const hand = [pool[boardNeeded + o * 2], pool[boardNeeded + o * 2 + 1]];
        const cmp = compareScores(evaluateBest([...hand, ...board]).score, mine);
        if (cmp > 0) { beaten = true; break; }
        if (cmp === 0) ties++;
      }
      if (!beaten) score += 1 / (ties + 1);
    }
    return score / sims;
  }
  function botAct() {
    if (state.handOver || state.actor < 0 || state.players[state.actor].human) return;
    const idx = state.actor, p = state.players[idx];
    if (!canAct(p)) { continueAfterAction(idx); return; }
    const need = Math.max(0, state.currentBet - p.bet), eq = estimateEquity(p);
    const odds = need / Math.max(1, state.pot + need), fair = 1 / livePlayers().length;
    const strong = fair + (1 - fair) * .42, roll = Math.random();
    const canRaise = canRaiseNow(p, idx) && p.chips > need;
    const size = () => {
      const frac = .45 + eq * .5;
      return clampRaise(p, Math.round((state.currentBet + frac * potAfterCall(p)) / 5) * 5);
    };
    const wasBet = state.currentBet === 0;
    if (need > 0 && eq < odds + .03 + (Math.random() - .5) * .08 && roll > .05) {
      p.folded = true; p.acted = true; say(`${p.name} folds.`);
    } else if (canRaise && ((eq > strong && roll < .4 * p.agg) || (need === 0 && eq > strong && roll < .55 * p.agg) || (eq < .3 && roll < .04 * p.agg))) {
      raiseTo(p, size()); say(raiseMessage(p, wasBet));
    } else {
      const paid = commit(p, need); p.acted = true;
      say(need > 0 ? `${p.name} calls ${paid}${p.chips === 0 ? ' — all in!' : '.'}` : `${p.name} checks.`);
    }
    continueAfterAction(idx); render();
  }
  function scheduleBot() {
    if (botTimer) clearTimeout(botTimer);
    if (!state || state.handOver || state.actor < 0) return;
    if (state.players[state.actor].human) { render(); return; }
    botTimer = setTimeout(botAct, 650 + Math.random() * 650);
  }

  // ---------- Hand evaluation ----------
  function combinations(arr, n) {
    const out = [];
    function walk(start, chosen) {
      if (chosen.length === n) { out.push(chosen.slice()); return; }
      for (let i = start; i <= arr.length - (n - chosen.length); i++) { chosen.push(arr[i]); walk(i + 1, chosen); chosen.pop(); }
    }
    walk(0, []); return out;
  }
  function straightHigh(ranks) {
    const uniq = [...new Set(ranks)].sort((a,b)=>b-a);
    if (uniq.includes(14)) uniq.push(1);
    for (let i = 0; i <= uniq.length - 5; i++) {
      let ok = true;
      for (let j = 1; j < 5; j++) if (uniq[i+j] !== uniq[i]-j) { ok = false; break; }
      if (ok) return uniq[i] === 1 ? 5 : uniq[i];
    }
    return 0;
  }
  function evaluateFive(cards) {
    const ranks = cards.map(c=>c.r).sort((a,b)=>b-a);
    const counts = {};
    ranks.forEach(r=>counts[r]=(counts[r]||0)+1);
    const groups = Object.entries(counts).map(([r,n])=>({r:Number(r),n})).sort((a,b)=>b.n-a.n||b.r-a.r);
    const flush = cards.every(c=>c.s===cards[0].s), straight = straightHigh(ranks);
    if (flush && straight) return {score:[8,straight],name:straight===14?'Royal flush':'Straight flush'};
    if (groups[0].n===4) return {score:[7,groups[0].r,groups[1].r],name:'Four of a kind'};
    if (groups[0].n===3 && groups[1].n===2) return {score:[6,groups[0].r,groups[1].r],name:'Full house'};
    if (flush) return {score:[5,...ranks],name:'Flush'};
    if (straight) return {score:[4,straight],name:'Straight'};
    if (groups[0].n===3) return {score:[3,groups[0].r,...groups.slice(1).map(g=>g.r).sort((a,b)=>b-a)],name:'Three of a kind'};
    const pairs=groups.filter(g=>g.n===2).map(g=>g.r).sort((a,b)=>b-a);
    if (pairs.length>=2) return {score:[2,pairs[0],pairs[1],groups.filter(g=>g.n===1).map(g=>g.r).sort((a,b)=>b-a)[0]||0],name:'Two pair'};
    if (pairs.length===1) return {score:[1,pairs[0],...groups.filter(g=>g.n===1).map(g=>g.r).sort((a,b)=>b-a)],name:'One pair'};
    return {score:[0,...ranks],name:'High card'};
  }
  function compareScores(a,b) {
    const len=Math.max(a.length,b.length);
    for(let i=0;i<len;i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x>y?1:-1;}
    return 0;
  }
  function evaluateBest(cards) {
    let best=null;
    for(const five of combinations(cards,5)){
      const result=evaluateFive(five);
      if(!best||compareScores(result.score,best.score)>0)best={...result,cards:five};
    }
    return best;
  }

  // ---------- Showdown ----------
  function runoutAndShowdown() {
    state.actor = -1; state.raiseTarget = null;
    if (botTimer) clearTimeout(botTimer);
    render();
    const step = () => {
      if (state.board.length >= 5) { showdown(); return; }
      if (state.board.length === 0) { state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop()); state.street = 'flop'; }
      else { state.board.push(state.deck.pop()); state.street = state.board.length === 4 ? 'turn' : 'river'; }
      say('Everyone is all in — dealing out the board…'); render();
      botTimer = setTimeout(step, 900);
    };
    botTimer = setTimeout(step, 800);
  }
  function awardUncontested(winner) {
    const won = totalPot(); winner.chips += won; state.pot = won; state.handOver = true; state.actor = -1;
    state.winners = [state.players.indexOf(winner)];
    state.lastResult = `${winner.name} ${winner.human ? 'win' : 'wins'} ${money(won)} — everyone else folded.`;
    say(state.lastResult); render();
  }
  function distributePots(results) {
    const contributions = [...new Set(state.players.map(p=>p.totalBet).filter(n=>n>0))].sort((a,b)=>a-b);
    let previous=0; const lines=[], winnerSet=new Set();
    for (const level of contributions) {
      const contributors=state.players.filter(p=>p.totalBet>=level);
      const potAmount=(level-previous)*contributors.length; previous=level;
      const eligible=contributors.filter(p=>p.inHand&&!p.folded);
      if (!potAmount||!eligible.length) continue;
      let best=eligible[0], winners=[best];
      for (const p of eligible.slice(1)) {
        const cmp=compareScores(results.get(p).score,results.get(best).score);
        if(cmp>0){best=p;winners=[p];} else if(cmp===0) winners.push(p);
      }
      const share=Math.floor(potAmount/winners.length), remainder=potAmount-share*winners.length;
      winners.forEach((p,i)=>{p.chips+=share+(i<remainder?1:0); winnerSet.add(state.players.indexOf(p));});
      const handName=results.get(best).name;
      const verb=winners.length===1&&winners[0].human?'win':'wins';
      lines.push(`${winners.map(p=>p.name).join(' & ')} ${winners.length>1?'win':verb} ${money(potAmount)} with ${handName}${winners.length>1?' (split pot)':''}.`);
    }
    state.winners=[...winnerSet];
    return lines;
  }
  function showdown() {
    if (state.handOver) return;
    state.handOver=true; state.actor=-1; state.reveal=true; state.street='showdown';
    const results=new Map();
    livePlayers().forEach(p=>results.set(p,evaluateBest([...p.hole,...state.board])));
    const lines=distributePots(results);
    state.lastResult=lines.join(' ');
    say(state.lastResult || 'Showdown complete.');
    render();
  }

  // ---------- Rendering ----------
  function makeCard(card, hidden=false, empty=false) {
    if (empty) { const e=document.createElement('div'); e.className='empty-card'; return e; }
    const el=document.createElement('div');
    if (hidden) { el.className='playing-card card-back'; el.setAttribute('aria-label','Face-down card'); return el; }
    el.className=`playing-card ${card.s==='♥'||card.s==='♦'?'red':''}`;
    const rank=rankText(card.r);
    const top=document.createElement('span'); top.className='corner'; top.innerHTML=`${rank}<span>${card.s}</span>`;
    const mid=document.createElement('span'); mid.className='pip'; mid.textContent=card.s;
    const bottom=document.createElement('span'); bottom.className='corner bottom'; bottom.innerHTML=`${rank}<span>${card.s}</span>`;
    el.append(top,mid,bottom); el.setAttribute('aria-label',`${rank} of ${({ '♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'})[card.s]}`); return el;
  }
  function badge(text, muted=false) { const b=document.createElement('span'); b.className=`seat-badge${muted?' muted':''}`; b.textContent=text; return b; }
  function seatElement(p, idx) {
    const seat=document.createElement('div'); seat.className='player-seat';
    if (!state.handOver && idx===state.actor) seat.classList.add('is-active');
    if (state.handOver && state.winners.includes(idx)) seat.classList.add('winner-highlight');
    const badges=document.createElement('div'); badges.className='seat-badges';
    if (idx===state.dealer) badges.append(badge('DEALER'));
    if (idx===state.smallBlind) badges.append(badge('SB',true));
    if (idx===state.bigBlind) badges.append(badge('BB',true));
    const name=document.createElement('div'); name.className='seat-name'; name.textContent=p.name;
    const chips=document.createElement('div'); chips.className='seat-chips'; chips.textContent=money(p.chips);
    const bet=document.createElement('div'); bet.className='seat-bet'; bet.textContent=p.bet>0?`Bet ${p.bet}`:' ';
    const cards=document.createElement('div'); cards.className='hole-cards';
    const faceUp = idx===0 || (state.reveal && !p.folded);
    if (p.inHand && p.hole.length) p.hole.forEach(c=>cards.append(makeCard(c, !faceUp)));
    else if (p.hole.length===0) { cards.append(makeCard(null,false,true),makeCard(null,false,true)); }
    if (p.folded) { badges.append(badge('FOLDED',true)); seat.style.opacity='.55'; }
    if (p.allIn && !state.handOver) badges.append(badge('ALL IN'));
    if (!p.inHand && p.chips===0) { seat.style.opacity='.42'; badges.append(badge('OUT',true)); }
    seat.append(badges,name,chips,cards,bet);
    if (state.handOver && state.reveal && p.inHand && !p.folded && state.board.length===5) {
      const res=evaluateBest([...p.hole,...state.board]); const label=document.createElement('div'); label.className='small-note'; label.textContent=res.name; seat.append(label);
    }
    return seat;
  }
  function renderReadout() {
    const p = state.players[0];
    if (state.handOver || !p.inHand || p.folded || !p.hole.length) { ui.readout.textContent = ''; return; }
    const parts = [];
    if (state.board.length >= 3) parts.push(`Your hand: ${evaluateBest([...p.hole, ...state.board]).name}`);
    if (ui.odds.checked && humanTurn()) {
      const key = `${state.handNumber}-${state.board.length}-${livePlayers().length}`;
      if (state.oddsKey !== key) { state.oddsKey = key; state.oddsValue = estimateEquity(p, 120); }
      parts.push(`Win chance ≈ ${Math.round(state.oddsValue * 100)}%`);
    }
    ui.readout.textContent = parts.join('  ·  ');
  }
  function render() {
    if (!state) return;
    ui.opponents.replaceChildren(); ui.player.replaceChildren();
    state.players.forEach((p,idx)=>{ if(idx!==0) ui.opponents.append(seatElement(p,idx)); });
    ui.player.append(seatElement(state.players[0],0));
    ui.board.replaceChildren();
    for (let i=0;i<5;i++) ui.board.append(i<state.board.length?makeCard(state.board[i]):makeCard(null,false,true));
    ui.pot.textContent=state.pot.toLocaleString();
    ui.street.textContent=state.handOver ? (state.street==='idle'?'Ready to play':state.street==='showdown'?'SHOWDOWN':'Hand complete') : state.street.toUpperCase();
    ui.title.textContent=state.handOver?'Hand complete':'Make your move';
    ui.pill.textContent=state.handOver?'Hand complete':(state.actor===0?'Your turn':`${state.players[state.actor]?.name || 'Table'} ${state.actor>=0?'thinking':'dealing'}`);
    ui.pill.classList.toggle('active',humanTurn());
    ui.message.textContent=state.message;
    ui.log.replaceChildren(...state.log.slice(0,6).map(line=>{const li=document.createElement('li'); li.textContent=line; return li;}));
    const yourTurn=humanTurn(), p=state.players[0], need=Math.max(0,state.currentBet-p.bet);
    ui.fold.disabled=!yourTurn; ui.call.disabled=!yourTurn; ui.allin.disabled=!yourTurn||p.chips<=0;
    ui.call.textContent=need===0?'Check':`Call ${Math.min(need,p.chips)}`;
    const canRaise = yourTurn && canRaiseNow(p, 0);
    ui.raise.disabled=!canRaise; ui.raiseTools.hidden=!canRaise;
    if (canRaise) {
      const lo=minRaiseTo(p), hi=maxTo(p);
      state.raiseTarget=clampRaise(p, state.raiseTarget ?? lo);
      ui.slider.min=lo; ui.slider.max=hi; ui.slider.value=state.raiseTarget; ui.slider.disabled=lo>=hi;
      ui.raiseAmount.textContent=state.raiseTarget.toLocaleString();
      ui.raise.textContent=state.raiseTarget>=hi?'Raise all-in':`${state.currentBet===0?'Bet':'Raise to'} ${state.raiseTarget}`;
    } else ui.raise.textContent='Raise';
    ui.allin.textContent=`All in (${p.chips})`;
    ui.next.hidden=!state.handOver || p.chips<=0 || (state.players.filter(q=>q.chips>0).length<2);
    renderReadout();
  }

  // ---------- Poker controls ----------
  ui.slider.addEventListener('input', () => { state.raiseTarget = Number(ui.slider.value); render(); });
  ui.raiseTools.addEventListener('click', e => {
    const btn = e.target.closest('[data-preset]'); if (!btn || !humanTurn()) return;
    const p = state.players[0], v = btn.dataset.preset;
    state.raiseTarget = v === 'min' ? minRaiseTo(p) : clampRaise(p, state.currentBet + Number(v) * potAfterCall(p));
    render();
  });
  ui.odds.addEventListener('change', () => { state.oddsKey = ''; render(); });
  document.addEventListener('keydown', e => {
    if (!ARC.host.classList.contains('open')) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const src = (e.composedPath && e.composedPath()[0]) || e.target;
    const tag = (src.tagName || '').toLowerCase();
    if (tag === 'input' && src.type !== 'range' && src.type !== 'checkbox') return;
    if (tag === 'select' || tag === 'textarea') return;
    if (!$('blackjack-mode').hidden) {
      const k = e.key.toLowerCase();
      if (k === 'h') bjHit(); else if (k === 's') bjStand(); else if (k === 'd') bjDouble();
      else if ((k === 'n' || e.code === 'Space') && tag !== 'button') { e.preventDefault(); bjDeal(); }
      return;
    }
    if (!$('plinko-mode').hidden) {
      if (e.code === 'Space' && tag !== 'button') { e.preventDefault(); dropPlinkoBall(); }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'f') doFold(); else if (k === 'c') doCallCheck(); else if (k === 'r') doRaise(); else if (k === 'a') doAllIn();
    else if (k === 'n' && !ui.next.hidden) beginHand();
  });
  ui.fold.addEventListener('click',doFold);
  ui.call.addEventListener('click',doCallCheck);
  ui.raise.addEventListener('click',doRaise);
  ui.allin.addEventListener('click',doAllIn);
  ui.next.addEventListener('click',beginHand);
  ui.newMatch.addEventListener('click',newMatch);

  // ---------- Plinko (separate play-chip balance from poker) ----------
  const plinkoCanvas = $('plinko-canvas');
  const plinkoCtx = plinkoCanvas.getContext('2d');
  const plinkoBalanceEl = $('plinko-balance'), plinkoResultEl = $('plinko-result'), plinkoBetEl = $('bet-size');
  const dropBallBtn = $('drop-ball'), refillPlinkoBtn = $('refill-plinko');
  const pokerModeEl = $('poker-mode'), plinkoModeEl = $('plinko-mode'), pokerTab = $('poker-tab'), plinkoTab = $('plinko-tab');
  const historyEl = $('plinko-history'), statDrops = $('stat-drops'), statNet = $('stat-net'), statBest = $('stat-best');
  const PLINKO_STARTING_BALANCE = 1000, PLINKO_ROWS = 12, PLINKO_SPACING = 45, PLINKO_TOP = 52, PLINKO_ROW_GAP = 29, PLINKO_SLOT_Y = 425;
  const PEG_LIFT = 10;
  const RISK_TABLES = {
    low: [5, 2.5, 1.5, 1.2, 1, 0.9, 0.5, 0.9, 1, 1.2, 1.5, 2.5, 5],
    medium: [10, 4, 2, 1.5, 1, 0.7, 0.4, 0.7, 1, 1.5, 2, 4, 10],
    high: [60, 18, 6, 2, 0.7, 0.4, 0.2, 0.4, 0.7, 2, 6, 18, 60]
  };
  let PLINKO_MULTIPLIERS = RISK_TABLES.medium;
  const riskEl = $('risk-level');
  const STORE_KEY = 'tta-plinko-balance';
  let plinkoBalance = PLINKO_STARTING_BALANCE, plinkoBusy = false, plinkoAnimationId = 0;
  let history = [], drops = 0, sessionNet = 0, bestMult = 0;

  function loadBalance() {
    try { const saved = Number(localStorage.getItem(STORE_KEY)); if (Number.isFinite(saved) && saved > 0 && localStorage.getItem(STORE_KEY) !== null) plinkoBalance = Math.floor(saved); } catch (_) {}
  }
  function saveBalance() { try { localStorage.setItem(STORE_KEY, String(plinkoBalance)); } catch (_) {} }
  const fmtNet = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString()}`;
  const multiplierText = v => `${Number.isInteger(v) ? v : v.toFixed(1)}×`;
  function renderPlinkoMeta() {
    statDrops.textContent = drops; statNet.textContent = fmtNet(sessionNet); statBest.textContent = bestMult ? multiplierText(bestMult) : '—';
    if (!history.length) { historyEl.innerHTML = '<span class="history-empty">Recent drops show up here</span>'; return; }
    historyEl.replaceChildren(...history.map(h => {
      const chip = document.createElement('span');
      chip.className = `history-chip ${h.net > 0 ? 'win' : h.net === 0 ? 'even' : 'loss'}`;
      chip.textContent = multiplierText(h.mult); chip.title = `Net ${fmtNet(h.net)} chips`;
      return chip;
    }));
  }
  function renderMultiplierList() {
    const m = PLINKO_MULTIPLIERS, range = (a, b) => a === b ? multiplierText(a) : `${multiplierText(Math.min(a, b))}–${multiplierText(Math.max(a, b))}`;
    $('multiplier-list').innerHTML = [
      ['hot', 'Edge slots', multiplierText(m[0])], ['warm', 'Big wins', range(m[1], m[2])],
      ['mid', 'Nice hits', range(m[3], m[4])], ['cool', 'Center slots', range(m[5], m[6])]
    ].map(([cls, label, val]) => `<div><i class="mult-dot ${cls}"></i><span>${label}</span><b>${val}</b></div>`).join('');
  }
  function updatePlinkoUI() {
    plinkoBalanceEl.textContent = plinkoBalance.toLocaleString();
    const stake = Number(plinkoBetEl.value);
    dropBallBtn.disabled = plinkoBusy || plinkoBalance < stake;
    dropBallBtn.textContent = plinkoBusy ? 'Ball bouncing…' : '⬇ Drop ball';
    plinkoBetEl.disabled = plinkoBusy; riskEl.disabled = plinkoBusy; refillPlinkoBtn.disabled = plinkoBusy;
  }
  const bjModeEl = $('blackjack-mode'), bjTab = $('blackjack-tab');
  function setGameMode(mode) {
    const tabs = {poker: [pokerModeEl, pokerTab], plinko: [plinkoModeEl, plinkoTab], blackjack: [bjModeEl, bjTab]};
    for (const [key, [panel, tab]] of Object.entries(tabs)) {
      panel.hidden = key !== mode; tab.classList.toggle('active', key === mode); tab.setAttribute('aria-selected', String(key === mode));
    }
    ui.newMatch.hidden = mode !== 'poker';
    if (mode === 'plinko') drawPlinkoBoard();
  }
  const pegX = (row, col, center) => center - (row * PLINKO_SPACING) / 2 + col * PLINKO_SPACING;
  function drawPlinkoBoard(ball = null, highlightSlot = -1, hits = []) {
    const ctx = plinkoCtx, W = plinkoCanvas.width, H = plinkoCanvas.height, center = W / 2, now = performance.now();
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#102b42'); bg.addColorStop(1, '#081624');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let y = 18; y < H; y += 28) for (let x = 18; x < W; x += 28) {
      ctx.fillStyle = 'rgba(167,210,234,0.045)'; ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(127,180,212,.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(center, 10); ctx.lineTo(center, 30); ctx.stroke();
    ctx.fillStyle = '#bde4f2'; ctx.font = '700 10px DM Sans, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('DROP ZONE', center, 14);
    for (let row = 0; row < PLINKO_ROWS; row++) {
      const y = PLINKO_TOP + row * PLINKO_ROW_GAP;
      for (let col = 0; col <= row; col++) {
        const x = pegX(row, col, center);
        const hit = hits.find(h => h.row === row && h.col === col);
        const heat = hit ? Math.max(0, 1 - (now - hit.t) / 380) : 0;
        ctx.fillStyle = heat ? `rgba(255,214,120,${.18 + .35 * heat})` : 'rgba(68,183,220,.13)';
        ctx.beginPath(); ctx.arc(x, y, 7.3 + 5 * heat, 0, Math.PI * 2); ctx.fill();
        const peg = ctx.createRadialGradient(x - 1.4, y - 1.8, 0.4, x, y, 4.5);
        peg.addColorStop(0, '#f0fbff'); peg.addColorStop(.35, heat ? '#ffe39a' : '#86d9ef'); peg.addColorStop(1, heat ? '#e0963c' : '#2d7fa5');
        ctx.fillStyle = peg; ctx.beginPath(); ctx.arc(x, y, 4.3, 0, Math.PI * 2); ctx.fill();
      }
    }
    const slotColors = ['#ff6585','#ff8d6b','#ffad61','#f3c96e','#b9d98a','#79d8b2','#51c8bd','#79d8b2','#b9d98a','#f3c96e','#ffad61','#ff8d6b','#ff6585'];
    const slotW = PLINKO_SPACING, slotTop = PLINKO_SLOT_Y;
    for (let i = 0; i < PLINKO_MULTIPLIERS.length; i++) {
      const x = center + (i - 6) * slotW - slotW / 2 + 1;
      ctx.fillStyle = slotColors[i]; ctx.globalAlpha = i === highlightSlot ? 0.3 : 0.13; ctx.fillRect(x, slotTop, slotW - 2, 43); ctx.globalAlpha = 1;
      if (i === highlightSlot) {
        ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, slotTop + 1, slotW - 4, 41);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + 1, slotTop + 1, slotW - 4, 3);
      } else { ctx.strokeStyle = 'rgba(225,240,250,.16)'; ctx.lineWidth = 1; ctx.strokeRect(x, slotTop, slotW - 2, 43); }
      ctx.fillStyle = slotColors[i]; ctx.font = '700 10px DM Sans, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(multiplierText(PLINKO_MULTIPLIERS[i]), center + (i - 6) * slotW, slotTop + 25);
    }
    ctx.fillStyle = 'rgba(216,234,243,.75)'; ctx.font = '9px DM Sans, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PRIZE SLOTS', center, 494);
    if (ball && ball.trail && ball.trail.length > 1) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < ball.trail.length; i++) {
        ctx.beginPath(); ctx.moveTo(ball.trail[i - 1].x, ball.trail[i - 1].y); ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        ctx.strokeStyle = `rgba(125,233,255,${.45 * i / ball.trail.length})`; ctx.lineWidth = 1 + 4 * i / ball.trail.length; ctx.stroke();
      }
    }
    if (ball) {
      const glow = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, 19);
      glow.addColorStop(0, 'rgba(255,244,171,.95)'); glow.addColorStop(.35, 'rgba(255,190,83,.55)'); glow.addColorStop(1, 'rgba(255,155,75,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ball.x, ball.y, 19, 0, Math.PI * 2); ctx.fill();
      const orb = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, 8);
      orb.addColorStop(0, '#fffde5'); orb.addColorStop(.45, '#ffd86b'); orb.addColorStop(1, '#f58b42');
      ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff5c5'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  function dropPlinkoBall() {
    if (plinkoBusy) return;
    const stake = Number(plinkoBetEl.value);
    if (!Number.isFinite(stake) || stake <= 0 || plinkoBalance < stake) {
      plinkoResultEl.textContent = 'Not enough play chips for that bet. Pick a smaller stake or reset your chips.';
      updatePlinkoUI(); return;
    }
    plinkoBalance -= stake; saveBalance(); plinkoBusy = true; updatePlinkoUI();
    plinkoResultEl.textContent = 'Ball is bouncing… please hold your breath, dawg 😭';

    // Pre-roll the path: each peg sends the ball left or right with equal odds.
    const center = plinkoCanvas.width / 2;
    let col = 0, rights = 0;
    const path = [{ x: center, y: 26 }], pegHits = [];
    for (let row = 0; row < PLINKO_ROWS; row++) {
      const x = pegX(row, col, center), y = PLINKO_TOP + row * PLINKO_ROW_GAP;
      path.push({ x: x + (row ? (Math.random() - .5) * 3 : 0), y: y - PEG_LIFT, row, col });
      if (Math.random() >= 0.5) { col++; rights++; }
    }
    const slot = Math.max(0, Math.min(PLINKO_MULTIPLIERS.length - 1, rights));
    path.push({ x: center + (slot - 6) * PLINKO_SPACING, y: PLINKO_SLOT_Y + 14 });
    const hopMs = 105, totalMs = (path.length - 1) * hopMs, started = performance.now(), trail = [];
    let lastHop = 0;
    function animate(now) {
      const elapsed = Math.min(now - started, totalMs);
      const hop = Math.min(path.length - 2, Math.floor(elapsed / hopMs));
      const p = (elapsed - hop * hopMs) / hopMs;
      // Peg-to-peg motion: sideways drift, accelerating fall, and a little bounce off each peg.
      const a = path[hop], b = path[hop + 1];
      const ball = {
        x: a.x + (b.x - a.x) * (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
        y: a.y + (b.y - a.y) * p * p - (hop > 0 ? Math.sin(Math.PI * p) * 7 : 0)
      };
      while (lastHop < hop) { lastHop++; const pt = path[lastHop]; if (pt.row !== undefined) pegHits.push({ row: pt.row, col: pt.col, t: performance.now() }); }
      trail.push({ x: ball.x, y: ball.y }); if (trail.length > 16) trail.shift();
      ball.trail = trail;
      drawPlinkoBoard(ball, -1, pegHits);
      if (now - started < totalMs) { plinkoAnimationId = requestAnimationFrame(animate); return; }
      const multiplier = PLINKO_MULTIPLIERS[slot], payout = Math.round(stake * multiplier), net = payout - stake;
      plinkoBalance += payout; saveBalance(); plinkoBusy = false;
      drops++; sessionNet += net; bestMult = Math.max(bestMult, multiplier);
      history.unshift({ mult: multiplier, net }); history = history.slice(0, 8);
      drawPlinkoBoard({ x: path[path.length - 1].x, y: PLINKO_SLOT_Y + 14 }, slot, pegHits);
      plinkoResultEl.textContent = `Landed in ${multiplierText(multiplier)}! Payout: ${payout.toLocaleString()} chips · net ${fmtNet(net)} chips ${net > 0 ? '🔥' : net === 0 ? '🤝' : '🥀'}`
        + (plinkoBalance < 10 ? ' — you’re almost out, hit Reset chips to refill.' : '');
      renderPlinkoMeta(); updatePlinkoUI();
    }
    plinkoAnimationId = requestAnimationFrame(animate);
  }
  function resetPlinkoBalance() {
    if (plinkoBusy) return;
    plinkoBalance = PLINKO_STARTING_BALANCE; saveBalance();
    history = []; drops = 0; sessionNet = 0; bestMult = 0;
    drawPlinkoBoard(); renderPlinkoMeta();
    plinkoResultEl.textContent = 'Balance reset to 1,000 pretend chips. Run it back 😭✌️';
    updatePlinkoUI();
  }


  // ---------- Blackjack (its own play-chip balance) ----------
  const BJ_KEY = 'tta-bj-balance';
  const bj = {balance: 1000, bet: 0, deck: [], player: [], dealer: [], phase: 'idle', hands: 0, won: 0, net: 0, timer: null};
  const bjEl = {
    balance: $('bj-balance'), dealer: $('bj-dealer'), player: $('bj-player'), dTotal: $('bj-dealer-total'), pTotal: $('bj-player-total'),
    msg: $('bj-message'), betSel: $('bj-bet'), deal: $('bj-deal'), hit: $('bj-hit'), stand: $('bj-stand'), dbl: $('bj-double'), reset: $('bj-reset'),
    hands: $('bj-hands'), won: $('bj-won'), net: $('bj-net')
  };
  function handValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) { if (c.r === 14) { aces++; total += 11; } else total += Math.min(c.r, 10); }
    while (total > 21 && aces) { total -= 10; aces--; }
    return {total, soft: aces > 0};
  }
  const isBlackjack = cards => cards.length === 2 && handValue(cards).total === 21;
  function bjSave() { try { localStorage.setItem(BJ_KEY, String(bj.balance)); } catch (_) {} }
  function bjRender() {
    const reveal = bj.phase !== 'player' && bj.phase !== 'dealing';
    bjEl.balance.textContent = bj.balance.toLocaleString();
    bjEl.dealer.replaceChildren(...bj.dealer.map((c, i) => makeCard(c, i === 1 && !reveal)));
    bjEl.player.replaceChildren(...bj.player.map(c => makeCard(c)));
    bjEl.pTotal.textContent = bj.player.length ? handValue(bj.player).total + (handValue(bj.player).soft && handValue(bj.player).total < 21 ? ' (soft)' : '') : '';
    bjEl.dTotal.textContent = bj.dealer.length ? (reveal ? handValue(bj.dealer).total : handValue([bj.dealer[0]]).total) : '';
    const playing = bj.phase === 'player', stake = Number(bjEl.betSel.value);
    bjEl.hit.disabled = !playing; bjEl.stand.disabled = !playing;
    bjEl.dbl.disabled = !(playing && bj.player.length === 2 && bj.balance >= bj.bet);
    bjEl.deal.disabled = playing || bj.phase === 'dealing' || bj.balance < stake;
    bjEl.betSel.disabled = playing || bj.phase === 'dealing'; bjEl.reset.disabled = playing || bj.phase === 'dealing';
    bjEl.hands.textContent = bj.hands; bjEl.won.textContent = bj.won; bjEl.net.textContent = `${bj.net > 0 ? '+' : bj.net < 0 ? '−' : ''}${Math.abs(bj.net).toLocaleString()}`;
  }
  function bjDraw() { if (bj.deck.length < 10) bj.deck = makeDeck(); return bj.deck.pop(); }
  function bjDeal() {
    if (bj.phase === 'player' || bj.phase === 'dealing') return;
    const stake = Number(bjEl.betSel.value);
    if (bj.balance < stake) { bjEl.msg.textContent = 'Not enough chips for that bet. Lower it or reset your chips.'; bjRender(); return; }
    bj.deck = makeDeck(); bj.bet = stake; bj.balance -= stake; bjSave();
    bj.player = [bjDraw(), bjDraw()]; bj.dealer = [bjDraw(), bjDraw()]; bj.phase = 'player';
    bjEl.msg.textContent = 'Your move: hit, stand or double.';
    if (isBlackjack(bj.player) || isBlackjack(bj.dealer)) { bjFinish(); return; }
    bjRender();
  }
  function bjHit() {
    if (bj.phase !== 'player') return;
    bj.player.push(bjDraw());
    const v = handValue(bj.player).total;
    if (v > 21) { bjFinish(); return; }
    if (v === 21) { bjStand(); return; }
    bjEl.msg.textContent = 'Card dealt. Hit again or stand?'; bjRender();
  }
  function bjDouble() {
    if (bj.phase !== 'player' || bj.player.length !== 2 || bj.balance < bj.bet) return;
    bj.balance -= bj.bet; bj.bet *= 2; bjSave();
    bj.player.push(bjDraw());
    if (handValue(bj.player).total > 21) { bjFinish(); return; }
    bjStand();
  }
  function bjStand() {
    if (bj.phase !== 'player') return;
    bj.phase = 'dealing'; bjEl.msg.textContent = 'Dealer reveals…'; bjRender();
    const step = () => {
      if (handValue(bj.dealer).total < 17) { bj.dealer.push(bjDraw()); bjRender(); bj.timer = setTimeout(step, 650); }
      else bjFinish();
    };
    bj.timer = setTimeout(step, 650);
  }
  function bjFinish() {
    const p = handValue(bj.player).total, d = handValue(bj.dealer).total, pBJ = isBlackjack(bj.player), dBJ = isBlackjack(bj.dealer);
    let payout = 0, text;
    if (p > 21) text = `Bust with ${p}. Dealer wins.`;
    else if (pBJ && dBJ) { payout = bj.bet; text = 'Both have blackjack — push.'; }
    else if (pBJ) { payout = Math.round(bj.bet * 2.5); text = `Blackjack! You win ${(payout - bj.bet).toLocaleString()} chips (3:2). 🔥`; }
    else if (dBJ) text = 'Dealer has blackjack. You lose.';
    else if (d > 21) { payout = bj.bet * 2; text = `Dealer busts with ${d}! You win ${bj.bet.toLocaleString()} chips. 🔥`; }
    else if (p > d) { payout = bj.bet * 2; text = `You win ${p} to ${d}! +${bj.bet.toLocaleString()} chips.`; }
    else if (p === d) { payout = bj.bet; text = `Push at ${p}. Your bet is returned.`; }
    else text = `Dealer wins ${d} to ${p}.`;
    const net = payout - bj.bet;
    bj.balance += payout; bj.hands++; bj.net += net; if (net > 0) bj.won++; bjSave();
    bj.phase = 'done';
    bjEl.msg.textContent = text + (bj.balance < 10 ? ' You’re nearly out — hit Reset chips.' : '');
    bjRender();
  }
  function initBlackjack() {
    try { const saved = Number(localStorage.getItem(BJ_KEY)); if (localStorage.getItem(BJ_KEY) !== null && Number.isFinite(saved) && saved > 0) bj.balance = Math.floor(saved); } catch (_) {}
    bjEl.deal.addEventListener('click', bjDeal); bjEl.hit.addEventListener('click', bjHit);
    bjEl.stand.addEventListener('click', bjStand); bjEl.dbl.addEventListener('click', bjDouble);
    bjEl.betSel.addEventListener('change', bjRender);
    bjEl.reset.addEventListener('click', () => {
      if (bj.phase === 'player' || bj.phase === 'dealing') return;
      clearTimeout(bj.timer); bj.balance = 1000; bj.hands = 0; bj.won = 0; bj.net = 0; bj.player = []; bj.dealer = []; bj.phase = 'idle'; bjSave();
      bjEl.msg.textContent = 'Chips reset to 1,000. Place your bet and deal.'; bjRender();
    });
    bjRender();
  }

  riskEl.addEventListener('change', () => {
    if (plinkoBusy) return;
    PLINKO_MULTIPLIERS = RISK_TABLES[riskEl.value] || RISK_TABLES.medium;
    drawPlinkoBoard(); renderMultiplierList();
    plinkoResultEl.textContent = `${riskEl.options[riskEl.selectedIndex].text}: ${riskEl.value === 'high' ? 'huge edge payouts, but the middle barely pays.' : riskEl.value === 'low' ? 'steadier payouts, smaller jackpots.' : 'the classic balance of risk and reward.'}`;
  });
  pokerTab.addEventListener('click', () => setGameMode('poker'));
  plinkoTab.addEventListener('click', () => setGameMode('plinko'));
  bjTab.addEventListener('click', () => setGameMode('blackjack'));
  ARC.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => setGameMode(b.dataset.go)));
  $('back-to-poker').addEventListener('click', () => setGameMode('poker'));
  dropBallBtn.addEventListener('click', dropPlinkoBall);
  refillPlinkoBtn.addEventListener('click', resetPlinkoBalance);
  plinkoBetEl.addEventListener('change', updatePlinkoUI);
  loadBalance();
  newMatch();
  drawPlinkoBoard();
  renderPlinkoMeta();
  renderMultiplierList();
  updatePlinkoUI();
  initBlackjack();
}

let arcadeReady=false;
function openArcade(){
  const host=document.getElementById('arcadeHost');if(!host)return;
  if(!arcadeReady){
    const root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>${ARCADE_CSS}</style><div id="arcade-body">${ARCADE_HTML}</div>`;
    try{initArcadeGames(root);}catch(err){console.error('Arcade failed to start',err);}
    root.getElementById('arcade-close').addEventListener('click',closeArcade);
    arcadeReady=true;
  }
  if(started&&!paused)togglePause();
  keysClear();host.classList.add('open');document.body.classList.add('arcade-open');host.scrollTop=0;
}
function closeArcade(){const host=document.getElementById('arcadeHost');if(host)host.classList.remove('open');document.body.classList.remove('arcade-open');keysClear();}

$('arcadeBtn').onclick=openArcade;$('arcadeTopBtn').onclick=openArcade;window.addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.classList.contains('arcade-open')){e.preventDefault();closeArcade();}},true);
loadGameSettings();applyLanguage();try{if(!window.THREE){$('start').innerHTML='<div class="hero-copy"><h1 class="hero-title">3D ENGINE<br><span>NOT LOADED.</span></h1><p>Three.js could not load. Check your internet connection and refresh the page.</p></div>';}else init();}catch(err){console.error(err);$('start').innerHTML='<div class="hero-copy"><h1 class="hero-title">GAME<br><span>ERROR.</span></h1><p>'+String(err.message||err)+'</p><p>Refresh the page after checking your connection.</p></div>';}
})();
