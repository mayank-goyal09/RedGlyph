/**
 * ═══════════════════════════════════════════════════
 *  REDGLYPH — API Client (Optimistic UI + Retry Logic)
 * ═══════════════════════════════════════════════════
 */

import { store } from './store.js';

/**
 * Send code for review.
 * Supports both default server API and custom user API key.
 */
export async function reviewCode(code) {
    const { apiMode, customApiKey, serverUrl } = store.state;

    const headers = {
        'Content-Type': 'application/json',
    };

    // If user provides custom API key, send it via secure header
    if (apiMode === 'custom' && customApiKey) {
        headers['X-Custom-API-Key'] = customApiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

    try {
        const response = await fetch(`${serverUrl}/review`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ code }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 429) {
                throw new Error('Rate limit reached. Please wait 60 seconds and try again.');
            }

            throw new Error(errorData.detail || `Server error (${response.status})`);
        }

        return await response.json();

    } catch (err) {
        clearTimeout(timeout);

        if (err.name === 'AbortError') {
            throw new Error('Request timed out. The AI might be processing a large file — try again.');
        }

        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            throw new Error(`Cannot reach server at ${serverUrl}. Is the backend running?`);
        }

        throw err;
    }
}

/**
 * Check if the server is alive.
 */
export async function checkHealth() {
    const { serverUrl } = store.state;

    try {
        const res = await fetch(`${serverUrl}/`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}
