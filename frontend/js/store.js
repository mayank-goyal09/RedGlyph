/**
 * ═══════════════════════════════════════════════════
 *  REDGLYPH — Reactive State Store (Pub/Sub Pattern)
 * ═══════════════════════════════════════════════════
 */

const initialState = {
    // API Config
    apiMode: 'default',       // 'default' | 'custom'
    customApiKey: '',
    serverUrl: 'http://localhost:8000',

    // Editor
    code: '',
    language: 'python',

    // Review State
    isLoading: false,
    report: null,             // { issues: [], quality_score: number }
    error: null,

    // History
    history: [],              // [{ id, code, report, language, timestamp }]
};

class Store {
    constructor(state) {
        this._state = { ...state };
        this._listeners = new Map();
        this._loadPersisted();
    }

    get state() {
        return { ...this._state };
    }

    set(key, value) {
        if (this._state[key] === value) return;
        this._state[key] = value;
        this._notify(key, value);
        this._persist(key, value);
    }

    /** Batch update multiple keys at once */
    update(partial) {
        const changed = [];
        for (const [key, value] of Object.entries(partial)) {
            if (this._state[key] !== value) {
                this._state[key] = value;
                changed.push(key);
            }
        }
        changed.forEach(key => {
            this._notify(key, this._state[key]);
            this._persist(key, this._state[key]);
        });
    }

    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }
        this._listeners.get(key).add(callback);
        // Return unsubscribe function
        return () => this._listeners.get(key)?.delete(callback);
    }

    _notify(key, value) {
        this._listeners.get(key)?.forEach(cb => {
            try { cb(value, this._state); } catch (e) { console.error(`Store listener error [${key}]:`, e); }
        });
    }

    // Persist specific keys to localStorage
    _persistKeys = new Set(['apiMode', 'customApiKey', 'serverUrl', 'history']);

    _persist(key, value) {
        if (!this._persistKeys.has(key)) return;
        try {
            localStorage.setItem(`redglyph_${key}`, JSON.stringify(value));
        } catch (e) { /* quota exceeded, ignore */ }
    }

    _loadPersisted() {
        for (const key of this._persistKeys) {
            try {
                const raw = localStorage.getItem(`redglyph_${key}`);
                if (raw !== null) {
                    this._state[key] = JSON.parse(raw);
                }
            } catch (e) { /* corrupted data, ignore */ }
        }
    }
}

export const store = new Store(initialState);
