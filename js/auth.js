// Sistema de autenticación 100% client-side (localStorage)
// Reemplaza la versión anterior que dependía del backend.
// Las contraseñas se hashean con SHA-256 (Web Crypto API) para que no estén
// en texto plano en localStorage, pero OJO: esto NO es seguro de verdad,
// es solo para separar usuarios en una misma máquina. No guarda datos sensibles.

const USERS_KEY = 'manos_unidas_users';
const CURRENT_USER_KEY = 'manos_unidas_current_user';

class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.username = localStorage.getItem('username');
    }

    // --- HASH DE PASSWORD (SHA-256 vía Web Crypto API) ---
    async _hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + '_manos_unidas_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    _getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
        } catch {
            return {};
        }
    }

    _saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // --- REGISTRO ---
    async register(username, email, password) {
        if (!email.endsWith("@colegioaprenderes.edu.ar")) {
            return { success: false, error: 'Solo direcciones @colegioaprenderes.edu.ar' };
        }
        if (username.length < 3) {
            return { success: false, error: 'El nombre debe tener al menos 3 caracteres' };
        }
        if (password.length < 6) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        }

        const users = this._getUsers();
        if (users[email]) {
            return { success: false, error: 'Ya existe una cuenta con ese correo' };
        }

        const passwordHash = await this._hashPassword(password);
        users[email] = {
            username: username,
            email: email,
            passwordHash: passwordHash,
            createdAt: Date.now()
        };
        this._saveUsers(users);

        // Login automático
        const token = this._generateToken(email);
        this.token = token;
        this.username = username;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', username);
        localStorage.setItem(CURRENT_USER_KEY, email);

        return {
            success: true,
            data: { username, email, token }
        };
    }

    // --- LOGIN ---
    async login(email, password) {
        const users = this._getUsers();
        const user = users[email];
        if (!user) {
            return { success: false, error: 'No existe una cuenta con ese correo' };
        }

        const passwordHash = await this._hashPassword(password);
        if (passwordHash !== user.passwordHash) {
            return { success: false, error: 'Contraseña incorrecta' };
        }

        const token = this._generateToken(email);
        this.token = token;
        this.username = user.username;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', user.username);
        localStorage.setItem(CURRENT_USER_KEY, email);

        return {
            success: true,
            data: { username: user.username, email: user.email, token }
        };
    }

    // --- LOGOUT ---
    logout() {
        this.token = null;
        this.username = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        localStorage.removeItem(CURRENT_USER_KEY);
    }

    // --- ESTADO ---
    isLoggedIn() {
        return !!this.token && !!this.getCurrentUserEmail();
    }

    getToken() {
        return this.token;
    }

    getUsername() {
        return this.username || localStorage.getItem('username');
    }

    getCurrentUserEmail() {
        return localStorage.getItem(CURRENT_USER_KEY);
    }

    // --- TOKEN (fake, solo para compatibilidad con código viejo) ---
    _generateToken(email) {
        return btoa(`${email}:${Date.now()}:${Math.random()}`);
    }

    // --- MIGRACIÓN DE USUARIOS EXISTENTES ---
    // Si antes tenías usuarios en el backend, esta función no los recupera
    // (no tenemos acceso a esa base). Tendrán que registrarse de nuevo.
    // Pero si ya había un token viejo guardado, lo respetamos hasta que expire.

    // --- COMPATIBILIDAD CON API VIEJA ---
    // Estas funciones existían en la versión anterior (backend). Las dejamos
    // como stubs que devuelven null/false para no romper páginas que las usen.

    async getProfile() {
        if (!this.isLoggedIn()) return null;
        return {
            username: this.getUsername(),
            email: this.getCurrentUserEmail()
        };
    }

    async voteExperiment(experimentName, vote, comment = '') {
        // Votos ahora se guardan localmente (sin backend)
        if (!this.isLoggedIn()) return { success: false, error: 'Debes iniciar sesión' };
        const votes = JSON.parse(localStorage.getItem('manos_unidas_votes') || '{}');
        const user = this.getCurrentUserEmail();
        if (!votes[experimentName]) votes[experimentName] = {};
        votes[experimentName][user] = { vote, comment, timestamp: Date.now() };
        localStorage.setItem('manos_unidas_votes', JSON.stringify(votes));
        return { success: true };
    }

    async getExperimentStats(experimentName) {
        const votes = JSON.parse(localStorage.getItem('manos_unidas_votes') || '{}');
        const expVotes = votes[experimentName] || {};
        let up = 0, down = 0;
        Object.values(expVotes).forEach(v => {
            if (v.vote === 'up') up++;
            else if (v.vote === 'down') down++;
        });
        return { up, down, total: up + down };
    }

    async submitForm(formType, formData) {
        if (!this.isLoggedIn()) return { success: false, error: 'Debes iniciar sesión' };
        const forms = JSON.parse(localStorage.getItem('manos_unidas_forms') || '[]');
        forms.push({
            formType,
            data: formData,
            user: this.getCurrentUserEmail(),
            timestamp: Date.now()
        });
        localStorage.setItem('manos_unidas_forms', JSON.stringify(forms));
        return { success: true };
    }
}

// Instancia global
const auth = new AuthSystem();

// --- PROTECCIÓN DE PÁGINAS ---
// Llamás auth.requireAuth() al cargar una página que necesita login.
// Si no hay sesión, redirige a auth.html.
if (!window.authGuardLoaded) {
    window.authGuardLoaded = true;
    window.requireAuth = function() {
        if (!auth.isLoggedIn()) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    };
}
