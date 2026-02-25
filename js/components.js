/**
 * ═══════════════════════════════════════════════════
 *  REDGLYPH — UI Components (Renderer Functions)
 * ═══════════════════════════════════════════════════
 */

/**
 * Render the score section with animated ring and counter.
 */
export function renderScore(score, container) {
    const scoreValue = container.querySelector('#scoreValue');
    const scoreFill = container.querySelector('#scoreFill');
    const scoreBar = container.querySelector('#scoreBar');
    const scoreLabel = container.querySelector('#scoreLabel');

    // Add gradient def to SVG if not present
    const svg = container.querySelector('.score-svg');
    if (!svg.querySelector('#scoreGradient')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#f97316"/>
            </linearGradient>
        `;
        svg.prepend(defs);
    }

    // Determine color and label based on score
    let label = 'Quality Score';
    if (score >= 8) label = '✨ Excellent Code';
    else if (score >= 6) label = '👍 Good Quality';
    else if (score >= 4) label = '⚠️ Needs Improvement';
    else label = '🚨 Critical Issues';

    scoreLabel.textContent = label;

    // Animate score ring (circumference = 2πr = 2π*50 ≈ 314)
    const circumference = 314;
    const offset = circumference - (score / 10) * circumference;

    // Use requestAnimationFrame for 60fps
    requestAnimationFrame(() => {
        scoreFill.style.strokeDashoffset = offset;
        scoreBar.style.width = `${score * 10}%`;
    });

    // Animate counter
    animateCounter(scoreValue, 0, score, 1200);
}

/**
 * Animate a number counter.
 */
function animateCounter(element, from, to, duration) {
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;

        element.textContent = current.toFixed(1);

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

/**
 * Render issue cards with staggered animation.
 */
export function renderIssues(issues, container) {
    container.innerHTML = '';

    issues.forEach((issue, index) => {
        const severity = issue.severity.toLowerCase();
        const card = document.createElement('div');
        card.className = `issue-card ${severity}`;
        card.innerHTML = `
            <div class="issue-severity">${getSeverityIcon(severity)} ${issue.severity}</div>
            <p class="issue-description">${escapeHtml(issue.description)}</p>
            <div class="issue-suggestion">${escapeHtml(issue.suggestion)}</div>
        `;

        container.appendChild(card);

        // Staggered entrance — GPU composed
        setTimeout(() => {
            card.classList.add('visible');
        }, 100 + index * 120);
    });
}

/**
 * Get severity icon.
 */
function getSeverityIcon(severity) {
    switch (severity) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
    }
}

/**
 * Render review history list.
 */
export function renderHistory(history, container) {
    if (!history.length) {
        container.innerHTML = '<div class="history-empty"><p>No reviews yet. Submit your first code review!</p></div>';
        return;
    }

    container.innerHTML = history
        .slice()
        .reverse()
        .map((item, i) => `
            <div class="history-item" data-index="${history.length - 1 - i}">
                <div class="history-meta">
                    <span class="h-title">${item.language.charAt(0).toUpperCase() + item.language.slice(1)} Review</span>
                    <span class="h-time">${formatTime(item.timestamp)}</span>
                </div>
                <span class="history-score" style="color: ${getScoreColor(item.report.quality_score)}">${item.report.quality_score}/10</span>
            </div>
        `)
        .join('');
}

/**
 * Show toast notification.
 */
export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/**
 * Update line numbers in code editor.
 */
export function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length;
    lineNumbersEl.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

/* ─── Utilities ─── */

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
}

function getScoreColor(score) {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f97316';
    if (score >= 4) return '#f59e0b';
    return '#f43f5e';
}
