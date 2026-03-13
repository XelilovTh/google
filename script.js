'use strict';
// ══════════════════════════════════════════════════════
//  FIREBASE CONFIG  — fill in your credentials
// ══════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyBQI38u4i4s0EB9h8NfEcdHj7J7l79m3M4",
    authDomain: "bizim-dunyamiz-f4021.firebaseapp.com",
    databaseURL: "https://bizim-dunyamiz-f4021-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bizim-dunyamiz-f4021",
    storageBucket: "bizim-dunyamiz-f4021.firebasestorage.app",
    messagingSenderId: "502219744541",
    appId: "1:502219744541:web:7aec0494f04c53f2c42df4",
    measurementId: "G-24KFBMQ09M"
};


// ══════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════
const SECRET_PASSWORD = 'miray';
const START_DATE      = new Date('February 1, 2023 00:00:00').getTime();
// SONGS — Firebase-dən dinamik yüklənir, ilkin boş
let SONGS = [];
const HEART_EMOJIS = ['❤️','💛','💕','💖','💗','💓','🧡','💝','✨','🌸'];

// ══════════════════════════════════════════════════════
//  GLOBALS
// ══════════════════════════════════════════════════════
let db = null;
let currentSongIndex = 0, isPlaying = false;
let audioEl = null;

// Star canvas
let gCvs, gCtx, gStars = [], gDrift = [];
const STAR_COUNT  = 220;
const DRIFT_COUNT = 28;

// Mouse sparkle canvas
let mCvs, mCtx, mouseParticles = [];

// ══════════════════════════════════════════════════════
//  PASSWORD  +  GRAND OPENING
// ══════════════════════════════════════════════════════
function initPasswordModal() {
    const modal    = document.getElementById('passwordModal');
    const input    = document.getElementById('passwordInput');
    const enterBtn = document.getElementById('enterBtn');
    const errorMsg = document.getElementById('errorMsg');

    const tryUnlock = () => {
        if (input.value.toLowerCase().trim() === SECRET_PASSWORD) {
            // 1. Hide password modal
            modal.style.transition = 'opacity 0.5s';
            modal.style.opacity    = '0';
            setTimeout(() => { modal.style.display = 'none'; }, 500);

            // 2. Run Grand Opening, then reveal site
            runGrandOpening(() => {
                const main = document.getElementById('mainContent');
                main.classList.remove('hidden');
                main.classList.add('show');
                onUnlocked();
            });
        } else {
            errorMsg.textContent  = '✖ Şifrə yanlışdır, yenidən cəhd edin...';
            input.value           = '';
            input.focus();
            input.style.animation = 'shake 0.5s';
            setTimeout(() => { input.style.animation = ''; }, 500);
        }
    };

    enterBtn.addEventListener('click', tryUnlock);
    input.addEventListener('keypress', e => { if (e.key === 'Enter') tryUnlock(); });
}

/**
 * Grand Opening:
 *   Phase 1 — black overlay appears, title scales + glows in (2.2 s)
 *   Phase 2 — title floats up & fades (1 s)
 *   Phase 3 — overlay fades out (0.8 s)
 *   Then callback fires
 */
function runGrandOpening(onDone) {
    const go       = document.getElementById('grandOpening');
    const goTitle  = document.getElementById('goTitle');
    const goSub    = document.getElementById('goSubtitle');

    // Show overlay
    go.classList.add('go-show');

    // Spawn small particle bursts in GO screen
    spawnGoParticles();

    // Phase 2 — exit animations after ~3 s
    const exitDelay = 3200;
    setTimeout(() => {
        goTitle.classList.add('go-exit');
        if (goSub) goSub.classList.add('go-exit');

        // Phase 3 — fade the whole overlay
        setTimeout(() => {
            go.style.transition = 'opacity 0.9s ease';
            go.style.opacity    = '0';
            setTimeout(() => {
                go.style.display = 'none';
                go.classList.remove('go-show');
                onDone();
            }, 900);
        }, 900);
    }, exitDelay);
}

function spawnGoParticles() {
    const container = document.getElementById('goParticles');
    if (!container) return;
    const emojis = ['✨','💛','❤️','🌟','💫'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('span');
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        const size  = 12 + Math.random() * 22;
        const delay = Math.random() * 2.5;
        const x     = Math.random() * 100;
        const dur   = 3 + Math.random() * 3;
        p.style.cssText = `
            position:absolute;
            left:${x}%;
            bottom:-30px;
            font-size:${size}px;
            opacity:0;
            animation:goParticleRise ${dur}s ease-out ${delay}s forwards;
            pointer-events:none;
        `;
        container.appendChild(p);
    }
    // keyframes injection (once)
    if (!document.getElementById('goParticleKF')) {
        const s = document.createElement('style');
        s.id = 'goParticleKF';
        s.textContent = `
        @keyframes goParticleRise {
            0%   { transform:translateY(0) scale(.5); opacity:0; }
            15%  { opacity:.9; }
            100% { transform:translateY(-110vh) scale(1.1); opacity:0; }
        }`;
        document.head.appendChild(s);
    }
}

// ══════════════════════════════════════════════════════
//  SITE INIT AFTER UNLOCK
// ══════════════════════════════════════════════════════
function onUnlocked() {
    try { initGlobalStarCanvas(); } catch(e) { console.error('initGlobalStarCanvas:', e); }
    try { initShootingStars();    } catch(e) { console.error('initShootingStars:', e); }
    try { initMouseSparkle();     } catch(e) { console.error('initMouseSparkle:', e); }
    try { initFallingHearts();    } catch(e) { console.error('initFallingHearts:', e); }
    try { initCinematicScroll();  } catch(e) { console.error('initCinematicScroll:', e); }
    try { initAnomalyObserver();  } catch(e) { console.error('initAnomalyObserver:', e); }
    try { initLoveCounter();      } catch(e) { console.error('initLoveCounter:', e); }
    try { initMusicPlayer();      } catch(e) { console.error('initMusicPlayer:', e); }
    try { initSmoothScroll();     } catch(e) { console.error('initSmoothScroll:', e); }
    try { initAdminPanel();       } catch(e) { console.error('initAdminPanel:', e); }
    try { initMemoryModal();      } catch(e) { console.error('initMemoryModal:', e); }

    if (typeof AOS !== 'undefined') {
        try { AOS.init({ duration:800, easing:'ease-out-cubic', once:true, offset:60 }); } catch(e) {}
    }

    const fbOk = initFirebase();
    if (fbOk) {
        try { listenMemories();   } catch(e) { console.error('listenMemories:', e); }
        try { listenLetters();    } catch(e) { console.error('listenLetters:', e); }
        try { listenBucketList(); } catch(e) { console.error('listenBucketList:', e); }
        try { listenSongs();      } catch(e) { console.error('listenSongs:', e); }
    } else {
        showEmpty('memories');
        showEmpty('letters');
        loadDefaultBucketItems();
        loadDefaultSongs();
    }
}

// ══════════════════════════════════════════════════════
//  FIREBASE
// ══════════════════════════════════════════════════════
function initFirebase() {
    try {
        if (!firebaseConfig.databaseURL) {
            console.warn('⚠️  Firebase databaseURL yoxdur — demo rejim');
            return false;
        }
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log('✅ Firebase bağlandı');
        return true;
    } catch (e) {
        console.error('❌ Firebase xəta:', e);
        return false;
    }
}

// ══════════════════════════════════════════════════════
//  GLOBAL STAR CANVAS  (fixed, entire page)
// ══════════════════════════════════════════════════════
function initGlobalStarCanvas() {
    gCvs = document.getElementById('globalStarCanvas');
    if (!gCvs) return;
    gCtx = gCvs.getContext('2d');

    const resize = () => {
        gCvs.width  = window.innerWidth;
        gCvs.height = window.innerHeight;
        buildStars();
        buildDrift();
    };
    resize();
    window.addEventListener('resize', resize);
    animateStars();
}

function buildStars() {
    gStars = Array.from({ length: STAR_COUNT }, () => ({
        x:    Math.random() * gCvs.width,
        y:    Math.random() * gCvs.height,
        r:    Math.random() * 1.6 + 0.35,
        op:   Math.random() * 0.8 + 0.2,
        spd:  Math.random() * 0.018 + 0.004,
        dir:  Math.random() > .5 ? 1 : -1,
        gold: Math.random() > 0.78,
    }));
}
function buildDrift() {
    gDrift = Array.from({ length: DRIFT_COUNT }, () => ({
        x:  Math.random() * gCvs.width,
        y:  Math.random() * gCvs.height,
        r:  Math.random() * 2.5 + 1,
        op: Math.random() * 0.45 + 0.15,
        vy: Math.random() * 0.3 + 0.08,
    }));
}

function animateStars() {
    gCtx.clearRect(0, 0, gCvs.width, gCvs.height);

    // Deep-space radial gradient background
    const bg = gCtx.createRadialGradient(
        gCvs.width*.5, gCvs.height*.38, 0,
        gCvs.width*.5, gCvs.height*.5,  gCvs.width
    );
    bg.addColorStop(0,   '#08081c');
    bg.addColorStop(0.5, '#040410');
    bg.addColorStop(1,   '#000004');
    gCtx.fillStyle = bg;
    gCtx.fillRect(0, 0, gCvs.width, gCvs.height);

    // Twinkle stars
    gStars.forEach(s => {
        s.op += s.spd * s.dir;
        if (s.op >= 1 || s.op <= 0.12) s.dir *= -1;

        gCtx.beginPath();
        gCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        gCtx.fillStyle = s.gold
            ? `rgba(212,175,55,${s.op * 0.72})`
            : `rgba(255,255,255,${s.op})`;
        gCtx.fill();

        if (s.r > 1.1) {
            gCtx.beginPath();
            gCtx.arc(s.x, s.y, s.r * 2.8, 0, Math.PI*2);
            gCtx.fillStyle = s.gold
                ? `rgba(212,175,55,${s.op * 0.14})`
                : `rgba(200,220,255,${s.op * 0.11})`;
            gCtx.fill();
        }
    });

    // Drifting sparkles
    gDrift.forEach(sp => {
        sp.y -= sp.vy;
        sp.op -= 0.0038;
        if (sp.y < -10 || sp.op <= 0) {
            sp.y  = gCvs.height + 10;
            sp.x  = Math.random() * gCvs.width;
            sp.op = Math.random() * 0.45 + 0.15;
        }
        draw4Star(gCtx, sp.x, sp.y, sp.r, sp.op);
    });

    requestAnimationFrame(animateStars);
}

function draw4Star(ctx, x, y, r, op) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.38;
        const ang = (i * Math.PI) / 4;
        i === 0
            ? ctx.moveTo(Math.cos(ang)*rad, Math.sin(ang)*rad)
            : ctx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,200,${op})`;
    ctx.fill();
    ctx.restore();
}

// ══════════════════════════════════════════════════════
//  SHOOTING STARS
// ══════════════════════════════════════════════════════
function initShootingStars() {
    const cvs = document.getElementById('shootingStarCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const pool = [];

    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const spawn = () => {
        if (Math.random() > 0.45) return;
        pool.push({
            x:     Math.random() * cvs.width  * 0.7,
            y:     Math.random() * cvs.height * 0.45,
            vx:    4  + Math.random() * 7,
            vy:    1.5 + Math.random() * 4,
            len:   70 + Math.random() * 140,
            alpha: 0.88 + Math.random() * 0.12,
            fade:  0.014 + Math.random() * 0.012,
            gold:  Math.random() > 0.5,
        });
    };

    const draw = () => {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        for (let i = pool.length - 1; i >= 0; i--) {
            const s = pool[i];
            s.x += s.vx; s.y += s.vy; s.alpha -= s.fade;
            if (s.alpha <= 0) { pool.splice(i, 1); continue; }
            const ratio = s.len / Math.hypot(s.vx, s.vy);
            const x0 = s.x - s.vx * ratio, y0 = s.y - s.vy * ratio;
            const g = ctx.createLinearGradient(x0, y0, s.x, s.y);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(1, s.gold
                ? `rgba(212,175,55,${s.alpha})`
                : `rgba(255,255,255,${s.alpha})`);
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(s.x,s.y);
            ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.stroke();
        }
        requestAnimationFrame(draw);
    };

    setInterval(spawn, 2200);
    draw();
}

// ══════════════════════════════════════════════════════
//  MOUSE SPARKLE TRAIL
// ══════════════════════════════════════════════════════
function initMouseSparkle() {
    mCvs = document.getElementById('mouseSparkleCanvas');
    if (!mCvs) return;
    mCtx = mCvs.getContext('2d');

    const resize = () => { mCvs.width = window.innerWidth; mCvs.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
        // Spawn 2-3 particles on each move
        const n = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            mouseParticles.push({
                x:    e.clientX + (Math.random() - .5) * 10,
                y:    e.clientY + (Math.random() - .5) * 10,
                r:    1 + Math.random() * 2.5,
                op:   0.7 + Math.random() * 0.3,
                vx:   (Math.random() - .5) * 1.2,
                vy:   -1.2 - Math.random() * 1.5,
                gold: Math.random() > .4,
                life: 0,
                maxLife: 18 + Math.floor(Math.random() * 14),
            });
        }
    });

    animateMouseSparkles();
}

function animateMouseSparkles() {
    mCtx.clearRect(0, 0, mCvs.width, mCvs.height);

    for (let i = mouseParticles.length - 1; i >= 0; i--) {
        const p = mouseParticles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.06;          // gentle gravity
        p.life++;
        p.op = (1 - p.life / p.maxLife) * 0.9;

        if (p.life >= p.maxLife) { mouseParticles.splice(i, 1); continue; }

        mCtx.save();
        mCtx.globalAlpha = Math.max(0, p.op);
        mCtx.beginPath();
        mCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        mCtx.fillStyle = p.gold ? '#d4af37' : '#ffffff';
        mCtx.shadowBlur = 6;
        mCtx.shadowColor = p.gold ? 'rgba(212,175,55,.8)' : 'rgba(255,255,255,.6)';
        mCtx.fill();
        mCtx.restore();
    }

    requestAnimationFrame(animateMouseSparkles);
}

// ══════════════════════════════════════════════════════
//  FALLING HEARTS  (snow-like, each with swing)
// ══════════════════════════════════════════════════════
function initFallingHearts() {
    const container = document.getElementById('heartContainer');
    if (!container) return;

    const spawn = () => {
        const el   = document.createElement('div');
        el.className = 'falling-heart';
        const size   = 10 + Math.random() * 22;
        const dur    = 12 + Math.random() * 16;    // 12–28 s
        const del    = Math.random() * 5;
        const drift  = (Math.random() - .5) * 180;
        const rot    = (Math.random() - .5) * 300;
        const swing  = 8  + Math.random() * 18;
        const maxOp  = 0.4 + Math.random() * 0.35;
        el.style.cssText = `
            left: ${Math.random() * 98}%;
            font-size: ${size}px;
            --dur: ${dur}s;
            --del: ${del}s;
            --drift: ${drift}px;
            --rot: ${rot}deg;
            --swing: ${swing}px;
            --max-op: ${maxOp};
        `;
        el.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
        container.appendChild(el);
        // Remove after it's done cycling once (save memory)
        setTimeout(() => el.remove(), (dur + del + 2) * 1000);
    };

    // Initial spread
    for (let i = 0; i < 22; i++) spawn();
    setInterval(spawn, 1500);
}

// ══════════════════════════════════════════════════════
//  CINEMATIC SCROLL-FOCUS
//  Sections that are above or below centre viewport dim out
// ══════════════════════════════════════════════════════
function initCinematicScroll() {
    const sections = Array.from(document.querySelectorAll('.cinematic-section'));
    if (!sections.length) return;

    let ticking = false;

    const update = () => {
        const vh = window.innerHeight;
        const vpCentre = vh / 2;

        sections.forEach(sec => {
            const rect   = sec.getBoundingClientRect();
            const centre = rect.top + rect.height / 2;
            const dist   = Math.abs(centre - vpCentre);

            // Fade starts at 45% vh, fully faded at 90% vh
            const startFade = vh * 0.45;
            const endFade   = vh * 0.90;
            let opacity = 1 - Math.max(0, Math.min(1, (dist - startFade) / (endFade - startFade)));
            opacity = Math.max(0.12, opacity);   // never fully invisible
            sec.style.opacity = opacity.toFixed(3);
        });

        // Hero parallax
        const scrollY = window.pageYOffset;
        const heroContent = document.getElementById('heroContent');
        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
}

// ══════════════════════════════════════════════════════
//  ANOMALY OBSERVER
//  Timeline cards (odd=left, even=right) + Letter cards (rotateX)
//  All start hidden; animate in when scrolled into view
// ══════════════════════════════════════════════════════
function initAnomalyObserver() {
    // IntersectionObserver — runs once per element
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    // Register existing timeline items (also called after Firebase loads)
    observeTimelineItems(obs);

    // Register letter cards
    document.querySelectorAll('.letter-card').forEach(card => obs.observe(card));

    // Store for later (when Firebase adds dynamic items)
    window._anomalyObs = obs;
}

function observeTimelineItems(obs) {
    document.querySelectorAll('.timeline-item:not(.from-left):not(.from-right)').forEach((item, i) => {
        const isLeft = (i % 2 === 0);
        item.classList.add(isLeft ? 'from-left' : 'from-right');
        obs.observe(item);
    });
}

// ══════════════════════════════════════════════════════
//  LOVE COUNTER
// ══════════════════════════════════════════════════════
function initLoveCounter() {
    const tick = () => {
        const d = Date.now() - START_DATE;
        const days    = Math.floor(d / 86400000);
        const hours   = Math.floor((d % 86400000) / 3600000);
        const minutes = Math.floor((d % 3600000) / 60000);
        const seconds = Math.floor((d % 60000) / 1000);
        const $ = id => document.getElementById(id);
        if ($('days'))    $('days').textContent    = days.toLocaleString();
        if ($('hours'))   $('hours').textContent   = String(hours).padStart(2,'0');
        if ($('minutes')) $('minutes').textContent = String(minutes).padStart(2,'0');
        if ($('seconds')) $('seconds').textContent = String(seconds).padStart(2,'0');
    };
    tick();
    setInterval(tick, 1000);
}

// ══════════════════════════════════════════════════════
//  FIREBASE: MEMORIES
// ══════════════════════════════════════════════════════
function listenMemories() {
    showLoading('memoriesTimeline');
    db.ref('memories').on('value', snap => {
        const el    = document.getElementById('memoriesTimeline');
        const empty = document.getElementById('memoriesEmpty');
        const data  = snap.val();
        el.innerHTML = '';
        if (!data) { showEmpty('memories'); return; }
        empty.style.display = 'none';

        const items = Object.entries(data).map(([k,v]) => ({id:k,...v}));
        items.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
        items.forEach((m, i) => {
            const div  = document.createElement('div');
            div.className = `timeline-item`;
            // Store data for modal
            div.dataset.title = m.title || '';
            div.dataset.date  = m.date  || '';
            div.dataset.desc  = m.desc  || '';
            div.dataset.img   = m.img   || '';
            div.dataset.emoji = m.emoji || '✨';
            div.innerHTML = `
                <div class="timeline-content">
                    ${m.img ? `<div class="timeline-image">
                        <img src="${esc(m.img)}" alt="${esc(m.title)}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        <div class="timeline-badge"><i class="fas fa-heart"></i></div>
                    </div>` : ''}
                    <div class="timeline-text">
                        <h3>${esc(m.title)} ${m.emoji||'✨'}</h3>
                        <span class="timeline-date">${esc(m.date||'')}</span>
                    </div>
                </div>`;
            el.appendChild(div);
        });

        // Re-register anomaly observer for newly added items
        if (window._anomalyObs) observeTimelineItems(window._anomalyObs);
        // Attach modal click listeners
        attachMemoryModalListeners();
        if (typeof AOS !== 'undefined') AOS.refresh();
    });

    // Admin list
    db.ref('memories').on('value', snap =>
        renderAdminList('adminMemoriesList', snap.val(), 'memories', m => m.title)
    );
}

// ══════════════════════════════════════════════════════
//  FIREBASE: LETTERS
// ══════════════════════════════════════════════════════
function listenLetters() {
    showLoading('lettersGrid');
    db.ref('letters').on('value', snap => {
        const grid  = document.getElementById('lettersGrid');
        const empty = document.getElementById('lettersEmpty');
        const data  = snap.val();
        grid.innerHTML = '';
        if (!data) { showEmpty('letters'); return; }
        empty.style.display = 'none';

        const items = Object.entries(data).map(([k,v]) => ({id:k,...v}));
        items.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
        items.forEach(letter => {
            const dateStr = letter.createdAt
                ? new Date(letter.createdAt).toLocaleDateString('az-AZ',{year:'numeric',month:'long',day:'numeric'})
                : '';
            const div = document.createElement('div');
            div.className = 'letter-card';
            div.innerHTML = `
                <div class="letter-card-inner">
                    <div class="letter-front">
                        <div class="letter-seal"><i class="fas fa-envelope-open-text"></i></div>
                        <div class="letter-front-info">
                            <h3>${esc(letter.title||'Məktub')}</h3>
                            <span class="letter-date">${esc(letter.to||'')} • ${dateStr}</span>
                        </div>
                    </div>
                    <div class="letter-back">
                        <h4>Əziz ${esc(letter.to||'')}...</h4>
                        <p>${esc(letter.content||'')}</p>
                        <span class="letter-signature">${esc(letter.signature||'')}</span>
                    </div>
                </div>`;
            grid.appendChild(div);

            // Register anomaly observer for new card
            if (window._anomalyObs) window._anomalyObs.observe(div);
        });
    });

    db.ref('letters').on('value', snap =>
        renderAdminList('adminLettersList', snap.val(), 'letters', l => l.title)
    );
}

// ══════════════════════════════════════════════════════
//  FIREBASE: BUCKET LIST
// ══════════════════════════════════════════════════════
function listenBucketList() {
    showLoading('bucketList');
    db.ref('bucketList').on('value', snap => {
        const el    = document.getElementById('bucketList');
        const empty = document.getElementById('bucketEmpty');
        const data  = snap.val();
        el.innerHTML = '';
        if (!data) { loadDefaultBucketItems(); return; }
        empty.style.display = 'none';

        const items = Object.entries(data).map(([k,v]) => ({id:k,...v}));
        items.sort((a,b) => (a.order||0) - (b.order||0));
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = `bucket-item${item.completed?' completed':''}`;
            div.innerHTML = `
                <div class="bucket-checkbox"><i class="fas fa-check"></i></div>
                <span class="bucket-text">${esc(item.text||'')}</span>
                <span class="bucket-icon">${item.emoji||'⭐'}</span>`;
            div.addEventListener('click', () => toggleBucket(item.id, !item.completed));
            el.appendChild(div);
        });
    });

    db.ref('bucketList').on('value', snap => renderAdminBucketList(snap.val()));
}

function toggleBucket(id, state) {
    if (!db) return;
    db.ref(`bucketList/${id}/completed`).set(state)
        .then(() => toast(state ? '✅ Arzu yerinə yetirildi!' : '🔄 Geri alındı'));
}

function loadDefaultBucketItems() {
    const defaults = [
        {text:'Evlənmək',                              emoji:'💍', completed:false, order:1},
        {text:'Mirayımızın olması',                    emoji:'👶', completed:false, order:2},
        {text:'Birlikdə dünyaya səyahət etmək',        emoji:'🌍', completed:false, order:3},
        {text:'Öz evimizi dizayn etmək',               emoji:'🏡', completed:false, order:4},
        {text:'Birlikdə yeni yemək bişirməyi öyrənmək',emoji:'👩‍🍳',completed:false, order:5},
        {text:'Bir ev heyvanı sahiblənmək',            emoji:'🐶', completed:false, order:6},
        {text:'Hər il birlikdə ad günü keçirmək',      emoji:'🎉', completed:false, order:7},
    ];

    const el    = document.getElementById('bucketList');
    const empty = document.getElementById('bucketEmpty');
    if (!el) return;
    el.innerHTML = '';
    if (empty) empty.style.display = 'none';

    if (db) {
        defaults.forEach(item => db.ref('bucketList').push({...item, createdAt:Date.now()}));
        return; // listener will re-render
    }

    // Offline demo
    defaults.forEach(item => {
        const div = document.createElement('div');
        div.className = `bucket-item${item.completed?' completed':''}`;
        div.innerHTML = `
            <div class="bucket-checkbox"><i class="fas fa-check"></i></div>
            <span class="bucket-text">${esc(item.text)}</span>
            <span class="bucket-icon">${item.emoji}</span>`;
        el.appendChild(div);
    });
}

// ══════════════════════════════════════════════════════
//  ADMIN PANEL
// ══════════════════════════════════════════════════════
function initAdminPanel() {
    const panel   = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    const close   = document.getElementById('adminClose');
    const navBtn  = document.getElementById('adminNavBtn');

    const open = () => {
        panel.style.display    = '';
        panel.style.pointerEvents = 'all';
        setTimeout(() => panel.classList.add('open'), 20);
    };
    const shut = () => {
        panel.classList.remove('open');
        panel.style.pointerEvents = 'none';
        setTimeout(() => { panel.style.display = 'none'; }, 460);
    };

    navBtn.addEventListener('click', open);
    close.addEventListener('click', shut);
    overlay.addEventListener('click', shut);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) shut();
    });

    // Tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Add Memory
    document.getElementById('addMemoryBtn').addEventListener('click', () => {
        const title = val('memTitle'), date = val('memDate'), desc = val('memDesc'),
              img   = val('memImg'),   emoji = val('memEmoji') || '✨';
        if (!title || !desc) { toast('⚠️ Başlıq və açıqlama lazımdır'); return; }
        if (!db) { toast('⚠️ Firebase bağlı deyil'); return; }
        db.ref('memories').push({title,date,desc,img,emoji,createdAt:Date.now()})
            .then(() => {
                clearInputs(['memTitle','memDate','memDesc','memImg','memEmoji']);
                toast(img ? '🖼 Şəkilli xatirə əlavə edildi!' : '✨ Xatirə əlavə edildi!');
            })
            .catch(e => toast('❌ '+e.message));
    });

    // Add Letter
    document.getElementById('addLetterBtn').addEventListener('click', () => {
        const to = val('letterTo'), title = val('letterTitle'),
              content = val('letterContent'), signature = val('letterSign');
        if (!title || !content) { toast('⚠️ Başlıq və mətn lazımdır'); return; }
        if (!db) { toast('⚠️ Firebase bağlı deyil'); return; }
        db.ref('letters').push({to,title,content,signature,createdAt:Date.now()})
            .then(() => { clearInputs(['letterTitle','letterContent','letterSign']); toast('💌 Məktub göndərildi!'); })
            .catch(e => toast('❌ '+e.message));
    });

    // Add Bucket
    document.getElementById('addBucketBtn').addEventListener('click', () => {
        const text  = val('bucketText');
        const emoji = val('bucketEmoji') || '⭐';
        if (!text) { toast('⚠️ Arzu mətni daxil edin'); return; }
        if (!db)   { toast('⚠️ Firebase bağlı deyil'); return; }
        db.ref('bucketList').push({text,emoji,completed:false,createdAt:Date.now(),order:Date.now()})
            .then(() => { clearInputs(['bucketText','bucketEmoji']); toast('⭐ Arzu əlavə edildi!'); })
            .catch(e => toast('❌ '+e.message));
    });

    // Add Song
    const addSongBtn = document.getElementById('addSongBtn');
    if (addSongBtn) {
        addSongBtn.addEventListener('click', () => {
            const title  = val('songTitle');
            const artist = val('songArtist') || '—';
            const url    = val('songUrl');
            if (!title || !url) { toast('⚠️ Mahnı adı və URL lazımdır'); return; }
            if (!db) { toast('⚠️ Firebase bağlı deyil'); return; }
            db.ref('songs').push({ title, artist, url, duration: '—', createdAt: Date.now() })
                .then(() => { clearInputs(['songTitle','songArtist','songUrl']); toast('🎵 Mahnı əlavə edildi!'); })
                .catch(e => toast('❌ ' + e.message));
        });
    }
}

function renderAdminList(containerId, data, refPath, labelFn) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = '';
    if (!data) { c.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:10px">Hələ heç nə yoxdur.</p>'; return; }
    Object.entries(data).forEach(([id, item]) => {
        const el = document.createElement('div');
        el.className = 'admin-item';
        el.innerHTML = `
            <span class="admin-item-text">${esc(labelFn(item))}</span>
            <div class="admin-item-actions">
                <button class="admin-item-btn btn-delete" title="Sil"><i class="fas fa-trash"></i></button>
            </div>`;
        el.querySelector('.btn-delete').addEventListener('click', () => {
            if (!db) return;
            if (confirm('Silinsin?')) db.ref(`${refPath}/${id}`).remove().then(() => toast('🗑 Silindi'));
        });
        c.appendChild(el);
    });
}

function renderAdminBucketList(data) {
    const c = document.getElementById('adminBucketList');
    if (!c) return;
    c.innerHTML = '';
    if (!data) { c.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:10px">Hələ heç nə yoxdur.</p>'; return; }
    Object.entries(data).forEach(([id, item]) => {
        const el = document.createElement('div');
        el.className = `admin-item${item.completed?' done':''}`;
        el.innerHTML = `
            <span class="admin-item-text">${item.emoji||''} ${esc(item.text)}</span>
            <div class="admin-item-actions">
                <button class="admin-item-btn btn-toggle" title="${item.completed?'Geri al':'Tamamlandı'}">
                    <i class="fas fa-${item.completed?'times':'check'}"></i>
                </button>
                <button class="admin-item-btn btn-delete" title="Sil"><i class="fas fa-trash"></i></button>
            </div>`;
        el.querySelector('.btn-toggle').addEventListener('click', () => {
            if (db) db.ref(`bucketList/${id}/completed`).set(!item.completed);
        });
        el.querySelector('.btn-delete').addEventListener('click', () => {
            if (!db) return;
            if (confirm('Silinsin?')) db.ref(`bucketList/${id}`).remove().then(() => toast('🗑 Silindi'));
        });
        c.appendChild(el);
    });
}

// ══════════════════════════════════════════════════════
//  FIREBASE: SONGS  (dynamic playlist)
// ══════════════════════════════════════════════════════
function listenSongs() {
    db.ref('songs').on('value', snap => {
        const data     = snap.val();
        const firstLoad = SONGS.length === 0;
        SONGS = [];
        if (data) {
            const items = Object.entries(data).map(([k, v]) => ({ id: k, ...v }));
            items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            SONGS = items;
        }
        renderSongList();
        if (firstLoad && SONGS.length) loadSong(0, false);
        renderAdminSongsList(data);
    });
}

function renderAdminSongsList(data) {
    const c = document.getElementById('adminSongsList');
    if (!c) return;
    c.innerHTML = '';
    if (!data) {
        c.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:10px">Hələ mahnı yoxdur.</p>';
        return;
    }
    Object.entries(data).forEach(([id, item]) => {
        const el = document.createElement('div');
        el.className = 'admin-item';
        el.innerHTML = `
            <i class="fas fa-music" style="color:var(--gold);font-size:.85rem;flex-shrink:0"></i>
            <span class="admin-item-text">${esc(item.title)} — ${esc(item.artist)}</span>
            <div class="admin-item-actions">
                <button class="admin-item-btn btn-delete" title="Sil"><i class="fas fa-trash"></i></button>
            </div>`;
        el.querySelector('.btn-delete').addEventListener('click', () => {
            if (!db) return;
            if (confirm('Silinsin?')) db.ref(`songs/${id}`).remove().then(() => toast('🗑 Mahnı silindi'));
        });
        c.appendChild(el);
    });
}

function loadDefaultSongs() {
    SONGS = [
        { title: 'Perfect',          artist: 'Ed Sheeran',    duration: '4:23', url: '' },
        { title: 'All of Me',        artist: 'John Legend',   duration: '4:29', url: '' },
        { title: 'A Thousand Years', artist: 'Christina Perri', duration: '4:45', url: '' },
    ];
    renderSongList();
    if (SONGS.length) loadSong(0, false);
}

// ══════════════════════════════════════════════════════
//  MUSIC PLAYER
// ══════════════════════════════════════════════════════
function initMusicPlayer() {
    audioEl = new Audio();
    audioEl.crossOrigin = 'anonymous';

    audioEl.addEventListener('timeupdate', () => {
        if (!audioEl.duration) return;
        setProgress(audioEl.currentTime / audioEl.duration);
        document.getElementById('timeCurrent').textContent = fmtTime(audioEl.currentTime);
    });
    audioEl.addEventListener('loadedmetadata', () => {
        document.getElementById('timeTotal').textContent = fmtTime(audioEl.duration);
    });
    audioEl.addEventListener('ended', () => {
        if (!SONGS.length) return;
        currentSongIndex = (currentSongIndex + 1) % SONGS.length;
        loadSong(currentSongIndex, true);
    });
    audioEl.addEventListener('error', () => {
        toast('⚠️ Audio yüklənmədi — URL-i yoxlayın');
        isPlaying = false; updatePlayBtn();
        const disc = document.getElementById('playerDisc');
        if (disc) disc.classList.remove('spinning');
    });

    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (!SONGS.length) return;
        currentSongIndex = (currentSongIndex - 1 + SONGS.length) % SONGS.length;
        loadSong(currentSongIndex, isPlaying);
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (!SONGS.length) return;
        currentSongIndex = (currentSongIndex + 1) % SONGS.length;
        loadSong(currentSongIndex, isPlaying);
    });
    document.getElementById('progressContainer').addEventListener('click', e => {
        if (!audioEl.duration) return;
        const r   = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        audioEl.currentTime = pct * audioEl.duration;
    });
}

function renderSongList() {
    const list = document.getElementById('playlistSongs');
    if (!list) return;
    list.innerHTML = '';
    if (!SONGS.length) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:16px;text-align:center">Admin paneldən mahnı əlavə edin.</p>';
        return;
    }
    SONGS.forEach((song, i) => {
        const el = document.createElement('div');
        el.className = `song-item${i === currentSongIndex ? ' active' : ''}`;
        el.innerHTML = `
            <span class="song-number">${i + 1}</span>
            <div class="song-info"><h5>${esc(song.title)}</h5><p>${esc(song.artist)}</p></div>
            <span class="song-duration">${song.duration || '—'}</span>`;
        el.addEventListener('click', () => { currentSongIndex = i; loadSong(i, true); });
        list.appendChild(el);
    });
}

function loadSong(idx, autoPlay) {
    if (!SONGS.length) return;
    const song = SONGS[idx];
    const titleEl  = document.getElementById('currentSongTitle');
    const artistEl = document.getElementById('currentSongArtist');
    const totalEl  = document.getElementById('timeTotal');
    const currEl   = document.getElementById('timeCurrent');
    if (titleEl)  titleEl.textContent  = song.title;
    if (artistEl) artistEl.textContent = song.artist;
    if (totalEl)  totalEl.textContent  = song.duration || '—';
    if (currEl)   currEl.textContent   = '0:00';
    setProgress(0);
    document.querySelectorAll('.song-item').forEach((el, i) => el.classList.toggle('active', i === idx));

    audioEl.pause();
    if (song.url) {
        audioEl.src = song.url;
        audioEl.load();
        if (autoPlay) {
            audioEl.play()
                .then(() => {
                    isPlaying = true; updatePlayBtn();
                    const disc = document.getElementById('playerDisc');
                    if (disc) disc.classList.add('spinning');
                })
                .catch(() => {
                    isPlaying = false; updatePlayBtn();
                    const disc = document.getElementById('playerDisc');
                    if (disc) disc.classList.remove('spinning');
                });
        } else {
            isPlaying = false; updatePlayBtn();
            const disc = document.getElementById('playerDisc');
            if (disc) disc.classList.remove('spinning');
        }
    } else {
        if (autoPlay) toast('⚠️ Bu mahnının URL-i yoxdur. Admin paneldən əlavə edin.');
        isPlaying = false; updatePlayBtn();
        const disc = document.getElementById('playerDisc');
        if (disc) disc.classList.remove('spinning');
    }
}

function togglePlay() {
    if (!SONGS.length) { toast('⚠️ Əvvəlcə mahnı əlavə edin'); return; }
    const disc = document.getElementById('playerDisc');
    if (isPlaying) {
        audioEl.pause();
        isPlaying = false;
        if (disc) disc.classList.remove('spinning');
        updatePlayBtn();
    } else {
        if (!audioEl.src || audioEl.src === window.location.href) {
            loadSong(currentSongIndex, true);
            return;
        }
        audioEl.play()
            .then(() => {
                isPlaying = true;
                if (disc) disc.classList.add('spinning');
                updatePlayBtn();
            })
            .catch(() => {
                toast('⚠️ Brauzer sesə icazə vermir — bir dəfə klikləyin');
            });
    }
}

function setProgress(pct) {
    const p = Math.max(0, Math.min(1, pct)) * 100;
    document.getElementById('progressFill').style.width = p + '%';
    document.getElementById('progressHandle').style.left = p + '%';
}
function updatePlayBtn() {
    document.getElementById('playIcon').className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}
function fmtTime(s) {
    if (!s||isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

// ══════════════════════════════════════════════════════
//  SMOOTH SCROLL + NAV ACTIVE STATE
// ══════════════════════════════════════════════════════
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            // Scroll so section top lands ~15% from viewport top (visually centred feel)
            const offset = window.innerHeight * 0.15;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
    document.getElementById('scrollIndicator')?.addEventListener('click', () => {
        const target = document.getElementById('counter');
        if (!target) return;
        const offset = window.innerHeight * 0.15;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    });

    const sectionIds = ['hero','counter','memories','letters','bucket','playlist'];
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            document.querySelectorAll('.nav-dot[href]').forEach(dot => {
                dot.classList.toggle('active', dot.getAttribute('href') === '#'+entry.target.id);
            });
        });
    }, { threshold:0.4 });
    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
}

// ══════════════════════════════════════════════════════
//  MEMORY MODAL
// ══════════════════════════════════════════════════════
function initMemoryModal() {
    const overlay = document.getElementById('memoryModal');
    const closeBtn = document.getElementById('memoryModalClose');
    if (!overlay || !closeBtn) return;

    const close = () => {
        overlay.style.animation = 'modalFadeIn .25s ease reverse';
        setTimeout(() => { overlay.style.display = 'none'; overlay.style.animation = ''; }, 240);
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.style.display !== 'none') close();
    });
}

function openMemoryModal(title, date, desc, img, emoji) {
    const overlay  = document.getElementById('memoryModal');
    const imgWrap  = document.getElementById('memoryModalImgWrap');
    const imgEl    = document.getElementById('memoryModalImg');
    const titleEl  = document.getElementById('memoryModalTitle');
    const dateEl   = document.getElementById('memoryModalDate');
    const descEl   = document.getElementById('memoryModalDesc');
    if (!overlay) return;

    titleEl.textContent = `${title} ${emoji}`;
    dateEl.textContent  = date;
    descEl.textContent  = desc;

    if (img) {
        imgEl.src = img;
        imgWrap.style.display = '';
        imgWrap.classList.remove('no-img');
    } else {
        imgWrap.style.display = 'none';
        imgWrap.classList.add('no-img');
    }

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function attachMemoryModalListeners() {
    document.querySelectorAll('.timeline-item').forEach(card => {
        // Remove old listener to prevent duplicates
        card.replaceWith(card.cloneNode(true));
    });
    document.querySelectorAll('.timeline-item').forEach(card => {
        card.addEventListener('click', () => {
            openMemoryModal(
                card.dataset.title,
                card.dataset.date,
                card.dataset.desc,
                card.dataset.img,
                card.dataset.emoji
            );
        });
    });
}

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function showEmpty(type) {
    const map = {
        memories: ['memoriesTimeline','memoriesEmpty'],
        letters:  ['lettersGrid',      'lettersEmpty'],
        bucket:   ['bucketList',        'bucketEmpty'],
    };
    const [cId, eId] = map[type] || [];
    const c = document.getElementById(cId);
    const e = document.getElementById(eId);
    if (c) c.innerHTML = '';
    if (e) e.style.display = 'block';
}

function showLoading(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
}

function toast(msg) {
    const el = document.getElementById('toastNotification');
    if (!el) return;
    el.innerHTML = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function clearInputs(ids) {
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ══════════════════════════════════════════════════════
//  ENTRY POINT
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initPasswordModal();
    console.log('%c💕 Təhmaz 💛 Fidan 💕', 'font-size:22px;color:#d4af37;font-family:serif;');
    console.log('%cBizim dünyamıza xoş gəlmisiniz ✨', 'font-size:13px;color:#f4e4bc;');
});
