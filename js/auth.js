// Sistema de autenticación del lado del cliente
const AUTH_API = "https://sivia-backend.onrender.com";

class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.username = localStorage.getItem('username');
    }

    async register(username, email, password) {
        // opcional: verificación rápida de dominio en frontend
        if (!email.endsWith("@colegioaprenderes.edu.ar")) {
            return { success: false, error: 'Solo direcciones @colegioaprenderes.edu.ar' };
        }
        try {
            const response = await fetch(`${AUTH_API}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.username = data.username;
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('username', data.username);
                return { success: true, data };
            } else {
                return { success: false, error: data.error || data.message };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${AUTH_API}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.username = data.username;
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('username', data.username);
                return { success: true, data };
            } else {
                return { success: false, error: data.error || data.message };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    logout() {
        this.token = null;
        this.username = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
    }

    isLoggedIn() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    async getProfile() {
        if (!this.token) return null;
        
        try {
            const response = await fetch(`${AUTH_API}/api/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async voteExperiment(experimentName, vote, comment = '') {
        if (!this.token) return { success: false, error: 'Debes iniciar sesión' };
        
        try {
            const response = await fetch(`${AUTH_API}/api/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ experiment: experimentName, vote })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error || data.message };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getExperimentStats(experimentName) {
        try {
            const response = await fetch(`${AUTH_API}/api/votes/${encodeURIComponent(experimentName)}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async submitForm(formType, formData) {
        if (!this.token) return { success: false, error: 'Debes iniciar sesión' };
        
        try {
            const response = await fetch(`${AUTH_API}/api/forms/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ form_type: formType, data: formData })
            });
            
            if (response.ok) {
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}

// Instancia global
const auth = new AuthSystem();
