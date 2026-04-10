const AUTH_URL      = "http://localhost:8080";
const JOUEUR_URL    = "http://localhost:8081";
const MONSTRE_URL = "http://localhost:8082";
const INVOCATION_URL = "http://localhost:8083";

const sessions = JSON.parse(localStorage.getItem('sessions')) ?? [];
let activeIndex = null;

if( sessions.length ) {
    activeIndex = 0;
    loadProfile();
}

function activeSession() {
    return activeIndex !== null ? sessions[activeIndex] : null;
}

async function apiFetch(baseUrl, path, method = "GET", body = null, headers = {}) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json", ...headers }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(baseUrl + path, opts);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Erreur ${res.status}`);
    }
    return res.json().catch(() => null);
}

function authBearerHeaders(token) {
    return { Authorization: "Bearer " + token };
}

async function login() {
    clearError("auth-error");
    const identifiant = document.getElementById("login-id").value.trim();
    const password    = document.getElementById("login-pw").value;

    if (!identifiant || !password) {
        showError("auth-error", "Identifiant et mot de passe requis.");
        return;
    }

    try {
        const data = await apiFetch(AUTH_URL, "/authenticate", "POST", { identifiant, password });
        addSession(identifiant, data.token);
        document.getElementById("login-id").value = "";
        document.getElementById("login-pw").value = "";
    } catch (e) {
        showError("auth-error", e.message);
    }
}

async function register() {
    clearError("auth-error");
    const identifiant = document.getElementById("reg-id").value.trim();
    const password    = document.getElementById("reg-pw").value;

    if (!identifiant || !password) {
        showError("auth-error", "Identifiant et mot de passe requis.");
        return;
    }

    try {
        await apiFetch(AUTH_URL, "/register", "POST", { identifiant, password });
        const data = await apiFetch(AUTH_URL, "/authenticate", "POST", { identifiant, password });
        addSession(identifiant, data.token);
        document.getElementById("reg-id").value = "";
        document.getElementById("reg-pw").value = "";
    } catch (e) {
        showError("auth-error", e.message);
    }
}

function addSession(identifiant, token) {
    const existing = sessions.findIndex(s => s.identifiant === identifiant);
    if (existing !== -1) {
        sessions[existing].token = token;
        setActive(existing);
    } else {
        sessions.push({ identifiant, token, profile: null });
        setActive(sessions.length - 1);
    }
}

function removeSession(index) {
    sessions.splice(index, 1);
    if (activeIndex >= sessions.length) {
        activeIndex = sessions.length > 0 ? sessions.length - 1 : null;
    }
    renderSessionList();
    renderMain();
}

function setActive(index) {
    activeIndex = index;
    renderSessionList();
    loadProfile();
}

async function loadProfile() {
    const session = activeSession();
    if (!session) { renderMain(); return; }

    console.log(sessions);

    try {
        const profile = await apiFetch(JOUEUR_URL, "/profile", "GET", null, authBearerHeaders(session.token));
        session.profile = profile;
    } catch (e) {
        session.profile = null;
    }
    localStorage.setItem('sessions', JSON.stringify(sessions));
    renderSessionList();
    renderMain();
}

async function getMonstre(monstreId){
    const session = activeSession();
    if (!session) return;
    console.log("/monstre-detail?id=" + encodeURIComponent(monstreId));
    return await apiFetch(JOUEUR_URL, "/monstre-detail?id=" + encodeURIComponent(monstreId), "GET", null, authBearerHeaders(session.token));
}

async function invoke() {
    const session = activeSession();
    if (!session) return;

    clearError("invoke-error");
    const btn = document.getElementById("invoke-btn");
    const label = document.getElementById("invoke-label");
    btn.disabled = true;
    label.innerHTML = '<span class="pulse">Invocation...</span>';

    try {
        const monstreRes = await apiFetch(INVOCATION_URL, "/invoke", "POST", null, authBearerHeaders(session.token));
        const monstreId = monstreRes.monstreId;
        console.log(monstreRes);
        console.log(monstreId)
        const monster = await getMonstre(monstreId);
        await loadProfile();
        renderMonster(monster);
    } catch (e) {
        showError("invoke-error", e.message);
        console.log(e)
    } finally {
        btn.disabled = false;
        label.textContent = "Invoquer";
    }
}

function renderSessionList() {
    const container = document.getElementById("player-list");

    if (sessions.length === 0) {
        container.innerHTML = '<p class="notice">Aucun joueur connecté.</p>';
        return;
    }

    container.innerHTML = sessions.map((s, i) => {
        const levelText = s.profile ? `Niv. ${s.profile.level}` : "•••";
        const active = i === activeIndex ? "active" : "";
        return `
            <div class="player-chip ${active}" onclick="setActive(${i})">
                <div>
                    <div class="player-chip-name">${s.identifiant}</div>
                    <div class="player-chip-level">${levelText}</div>
                </div>
                <button class="player-chip-remove" onclick="event.stopPropagation(); removeSession(${i})">×</button>
            </div>
        `;
    }).join("");
}

function renderMain() {
    const session = activeSession();
    const isEmpty = document.getElementById("empty-state");
    const profilePanel = document.getElementById("profile-panel");
    const invokePanel  = document.getElementById("invoke-panel");
    const monsterResult = document.getElementById("monster-result");

    if (!session) {
        isEmpty.style.display = "block";
        profilePanel.style.display = "none";
        invokePanel.style.display  = "none";
        return;
    }

    isEmpty.style.display  = "none";
    profilePanel.style.display = "block";
    invokePanel.style.display  = "block";
    monsterResult.innerHTML = "";
    clearError("invoke-error");

    const p = session.profile;
    if (!p) {
        document.getElementById("profile-name").textContent = session.identifiant;
        document.getElementById("profile-meta").textContent = "Impossible de charger le profil.";
        return;
    }

    const threshold = Math.round(50 * Math.pow(1.1, p.level - 1));
    const xpPct = Math.min(100, Math.round((p.experience / threshold) * 100));

    document.getElementById("profile-name").textContent = p.identifiant;
    document.getElementById("profile-meta").textContent = `${p.monstres?.length ?? 0} / ${10 + p.level} monstres`;
    document.getElementById("xp-bar").style.width = xpPct + "%";
    document.getElementById("stat-level").textContent     = p.level;
    document.getElementById("stat-xp").textContent        = p.experience;
    document.getElementById("stat-threshold").textContent = threshold;
    document.getElementById("stat-monsters").textContent  = `${p.monstres?.length ?? 0}/${10 + p.level}`;
}

function renderMonster(m) {
    if (!m) return;
    const container = document.getElementById("monster-result");

    const typeClass = { fire: "type-feu", water: "type-eau", wind: "type-vent" }[m.element?.toLowerCase()] ?? "";
    const skills = (m.skills ?? []).map(s => `
        <div class="skill-card">
            <div class="skill-name">${s.num ?? "-"}</div>
            <div class="skill-row">Dégâts <span>${s.dmg ?? "—"}</span></div>
            <div class="skill-row">Ratio (stat) <span>${s.ratio_stat ?? "—"}</span></div>
            <div class="skill-row">Ratio (%) <span>${s.ratio_percent ?? "—"}</span></div>
            <div class="skill-row">Cooldown <span>${s.cooldown ?? "—"}</span></div>
            <div class="skill-row">Niveau <span>${s.level ?? 0} / ${s.lvlMax ?? "—"}</span></div>
        </div>
    `).join("");

    container.innerHTML = `
        <div class="monster-result">
            <div class="monster-name">${m.name ?? m.nom ?? "Inconnu"}</div>
            <div class="type-badge ${typeClass}">${m.element ?? "—"}</div>
            <div class="monster-stats">
                <div class="stat-box"><div class="val">${m.hp}</div><div class="lbl">HP</div></div>
                <div class="stat-box"><div class="val">${m.atk}</div><div class="lbl">ATK</div></div>
                <div class="stat-box"><div class="val">${m.def}</div><div class="lbl">DEF</div></div>
                <div class="stat-box"><div class="val">${m.vit}</div><div class="lbl">VIT</div></div>
            </div>
            <div class="skills-grid">${skills}</div>
        </div>
    `;
}

function switchTab(tab) {
    document.getElementById("tab-login").style.display    = tab === "login"    ? "block" : "none";
    document.getElementById("tab-register").style.display = tab === "register" ? "block" : "none";
    document.querySelectorAll(".tab").forEach((el, i) => {
        el.classList.toggle("active", (tab === "login" && i === 0) || (tab === "register" && i === 1));
    });
    clearError("auth-error");
}

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = "block";
}

function clearError(id) {
    const el = document.getElementById(id);
    el.textContent = "";
    el.style.display = "none";
}

document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const tab = document.getElementById("tab-login").style.display !== "none" ? "login" : "register";
    if (tab === "login")    login();
    else                    register();
});
