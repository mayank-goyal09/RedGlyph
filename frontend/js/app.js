/**
 * ═══════════════════════════════════════════════════════
 *  REDGLYPH — Main Application Entry Point
 *  Wires store, API, and components together.
 * ═══════════════════════════════════════════════════════
 */

import { store } from './store.js';
import { reviewCode, checkHealth } from './api.js';
import { renderScore, renderIssues, renderHistory, showToast, updateLineNumbers } from './components.js';

/* ─── DOM References ─── */
const $ = (sel) => document.querySelector(sel);
const codeEditor = $('#codeEditor');
const lineNumbers = $('#lineNumbers');
const lineCount = $('#lineCount');
const charCount = $('#charCount');
const langSelect = $('#langSelect');
const reviewBtn = $('#reviewBtn');
const clearBtn = $('#clearBtn');
const pasteBtn = $('#pasteBtn');
const copyReportBtn = $('#copyReportBtn');

// Panels
const resultsEmpty = $('#resultsEmpty');
const resultsSkeleton = $('#resultsSkeleton');
const resultsContent = $('#resultsContent');
const scoreSection = $('#scoreSection');
const issuesList = $('#issuesList');
const issuesCount = $('#issuesCount');

// Modals
const settingsModal = $('#settingsModal');
const settingsBtn = $('#settingsBtn');
const closeSettings = $('#closeSettings');
const cancelSettings = $('#cancelSettings');
const saveSettings = $('#saveSettings');
const toggleDefault = $('#toggleDefault');
const toggleCustom = $('#toggleCustom');
const customApiGroup = $('#customApiGroup');
const customApiKey = $('#customApiKey');
const serverUrl = $('#serverUrl');
const toggleApiVis = $('#toggleApiVisibility');
const apiStatus = $('#apiStatus');

const historyModal = $('#historyModal');
const historyBtn = $('#historyBtn');
const closeHistory = $('#closeHistory');
const historyList = $('#historyList');

/* ═══════════════════════════════════════════════════════
   EDITOR EVENTS
   ═══════════════════════════════════════════════════════ */

// Sync line numbers + stats on input
codeEditor.addEventListener('input', () => {
    updateLineNumbers(codeEditor, lineNumbers);
    const lines = codeEditor.value.split('\n').length;
    lineCount.textContent = `Lines: ${lines}`;
    charCount.textContent = `Chars: ${codeEditor.value.length}`;
    store.set('code', codeEditor.value);
});

// Sync scroll between textarea and line numbers
codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
});

// Tab key support in editor
codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
        codeEditor.dispatchEvent(new Event('input'));
    }
});

// Language selector
langSelect.addEventListener('change', () => {
    store.set('language', langSelect.value);
});

// Clear button
clearBtn.addEventListener('click', () => {
    codeEditor.value = '';
    codeEditor.dispatchEvent(new Event('input'));
    showToast('Editor cleared', 'info', 2000);
});

// Paste button
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        codeEditor.value = text;
        codeEditor.dispatchEvent(new Event('input'));
        showToast('Pasted from clipboard', 'success', 2000);
    } catch {
        showToast('Clipboard access denied', 'error', 3000);
    }
});

/* ═══════════════════════════════════════════════════════
   REVIEW FLOW (with Optimistic UI)
   ═══════════════════════════════════════════════════════ */

reviewBtn.addEventListener('click', async () => {
    const code = codeEditor.value.trim();

    if (!code) {
        showToast('Please enter some code to review.', 'error', 3000);
        return;
    }

    // Optimistic UI: Immediately show loading state
    store.update({ isLoading: true, error: null, report: null });

    try {
        const report = await reviewCode(code);

        // Save to history
        const historyEntry = {
            id: Date.now(),
            code: code.substring(0, 200), // truncate for storage
            report,
            language: store.state.language,
            timestamp: new Date().toISOString(),
        };

        const history = [...store.state.history, historyEntry].slice(-50); // Keep last 50

        store.update({
            isLoading: false,
            report,
            history,
        });

        showToast(`Review complete — Score: ${report.quality_score}/10`, 'success');

    } catch (err) {
        store.update({ isLoading: false, error: err.message });
        showToast(err.message, 'error', 6000);
    }
});

// Keyboard shortcut: Ctrl+Enter to review
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        reviewBtn.click();
    }
});

/* ═══════════════════════════════════════════════════════
   STATE → UI BINDINGS (Reactive Updates)
   ═══════════════════════════════════════════════════════ */

// Loading state
store.subscribe('isLoading', (isLoading) => {
    reviewBtn.classList.toggle('loading', isLoading);
    reviewBtn.disabled = isLoading;

    if (isLoading) {
        resultsEmpty.classList.add('hidden');
        resultsContent.classList.add('hidden');
        resultsSkeleton.classList.remove('hidden');
    } else {
        resultsSkeleton.classList.add('hidden');
    }
});

// Report received
store.subscribe('report', (report) => {
    if (!report) return;

    resultsEmpty.classList.add('hidden');
    resultsSkeleton.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    // Render score
    renderScore(report.quality_score, scoreSection);

    // Render issues
    issuesCount.textContent = report.issues.length;
    renderIssues(report.issues, issuesList);
});

// API mode change
store.subscribe('apiMode', (mode) => {
    if (mode === 'custom') {
        apiStatus.classList.add('custom');
        apiStatus.querySelector('.status-text').textContent = 'Custom API';
    } else {
        apiStatus.classList.remove('custom');
        apiStatus.querySelector('.status-text').textContent = 'Default API';
    }
});

/* ═══════════════════════════════════════════════════════
   SETTINGS MODAL
   ═══════════════════════════════════════════════════════ */

settingsBtn.addEventListener('click', () => {
    // Load current state into modal
    const state = store.state;
    serverUrl.value = state.serverUrl;
    customApiKey.value = state.customApiKey;

    if (state.apiMode === 'custom') {
        toggleCustom.classList.add('active');
        toggleDefault.classList.remove('active');
        customApiGroup.classList.remove('hidden');
    } else {
        toggleDefault.classList.add('active');
        toggleCustom.classList.remove('active');
        customApiGroup.classList.add('hidden');
    }

    settingsModal.classList.remove('hidden');
});

// Toggle API mode buttons
toggleDefault.addEventListener('click', () => {
    toggleDefault.classList.add('active');
    toggleCustom.classList.remove('active');
    customApiGroup.classList.add('hidden');
});

toggleCustom.addEventListener('click', () => {
    toggleCustom.classList.add('active');
    toggleDefault.classList.remove('active');
    customApiGroup.classList.remove('hidden');
});

// Toggle API key visibility
toggleApiVis.addEventListener('click', () => {
    customApiKey.type = customApiKey.type === 'password' ? 'text' : 'password';
});

// Save settings
saveSettings.addEventListener('click', () => {
    const mode = toggleCustom.classList.contains('active') ? 'custom' : 'default';

    store.update({
        apiMode: mode,
        customApiKey: customApiKey.value.trim(),
        serverUrl: serverUrl.value.trim() || 'http://localhost:8000',
    });

    settingsModal.classList.add('hidden');
    showToast('Settings saved', 'success', 2000);
});

// Close settings
const closeSettingsModal = () => settingsModal.classList.add('hidden');
closeSettings.addEventListener('click', closeSettingsModal);
cancelSettings.addEventListener('click', closeSettingsModal);
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
});

/* ═══════════════════════════════════════════════════════
   HISTORY MODAL
   ═══════════════════════════════════════════════════════ */

historyBtn.addEventListener('click', () => {
    renderHistory(store.state.history, historyList);
    historyModal.classList.remove('hidden');
});

closeHistory.addEventListener('click', () => historyModal.classList.add('hidden'));
historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) historyModal.classList.add('hidden');
});

// Click on history item → load into editor
historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    const entry = store.state.history[index];
    if (!entry) return;

    // Load report
    store.set('report', entry.report);
    historyModal.classList.add('hidden');
    showToast('Loaded review from history', 'info', 2000);
});

// Copy report
copyReportBtn.addEventListener('click', () => {
    const report = store.state.report;
    if (!report) return;

    const text = `Quality Score: ${report.quality_score}/10\n\n` +
        report.issues.map((i, idx) =>
            `${idx + 1}. [${i.severity}] ${i.description}\n   💡 ${i.suggestion}`
        ).join('\n\n');

    navigator.clipboard.writeText(text);
    showToast('Report copied to clipboard', 'success', 2000);
});

/* ═══════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════ */

// Restore persisted API mode
const savedMode = store.state.apiMode;
if (savedMode === 'custom') {
    apiStatus.classList.add('custom');
    apiStatus.querySelector('.status-text').textContent = 'Custom API';
}

// Restore language
langSelect.value = store.state.language || 'python';

// Health check
checkHealth().then((alive) => {
    if (!alive) {
        showToast('Backend server is not running. Start it with: python core/main.py', 'error', 8000);
    }
});

console.log('%c⚡ RedGlyph AI Code Reviewer loaded', 'color: #22c55e; font-weight: bold; font-size: 14px;');
