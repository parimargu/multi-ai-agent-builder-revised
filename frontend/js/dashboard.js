/**
 * AgentForge Dashboard
 * Renders stats, agent list, and handles CRUD operations.
 */

async function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '<div class="text-center mt-4"><div class="loading-spinner" style="margin:auto;"></div></div>';

    try {
        const agents = await API.listAgents();
        
        const totalAgents = agents.length;
        const activeAgents = agents.filter(a => a.status === 'active').length;
        const totalNodes = agents.reduce((sum, a) => sum + (a.node_count || 0), 0);

        content.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p class="text-muted mt-2">Manage your AI agent workflows</p>
                </div>
                <button class="btn btn-primary" onclick="openModal('new-agent-modal')">
                    ➕ New Agent
                </button>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon agents">🤖</div>
                    <div>
                        <div class="stat-value">${totalAgents}</div>
                        <div class="stat-label">Total Agents</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon active">✅</div>
                    <div>
                        <div class="stat-value">${activeAgents}</div>
                        <div class="stat-label">Active</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon executions">📊</div>
                    <div>
                        <div class="stat-value">${totalNodes}</div>
                        <div class="stat-label">Total Nodes</div>
                    </div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-5);">
                <h2 style="font-size:var(--font-size-xl);font-weight:600;">Your Agents</h2>
                <input class="form-input" type="text" placeholder="Search agents..." style="width:260px;"
                    oninput="filterAgentCards(this.value)">
            </div>

            <div class="agents-grid" id="agents-grid">
                ${agents.length === 0 ? `
                    <div class="empty-state" style="grid-column:1/-1;">
                        <div class="empty-icon">🤖</div>
                        <h3>No agents yet</h3>
                        <p>Create your first AI agent to get started!</p>
                        <button class="btn btn-primary" onclick="openModal('new-agent-modal')">
                            ➕ Create Agent
                        </button>
                    </div>
                ` : agents.map(agent => renderAgentCard(agent)).join('')}
            </div>
        `;

        // Update recent agents in sidebar
        renderRecentAgentsNav(agents.slice(0, 5));
    } catch (err) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Error loading dashboard</h3>
                <p>${err.message}</p>
                <button class="btn btn-secondary" onclick="renderDashboard()">Retry</button>
            </div>
        `;
    }
}

function renderAgentCard(agent) {
    const createdDate = new Date(agent.created_at).toLocaleDateString();
    const updatedDate = new Date(agent.updated_at).toLocaleDateString();

    return `
        <div class="agent-card" onclick="openAgent('${agent.id}')" data-name="${agent.name.toLowerCase()}">
            <div class="agent-card-header">
                <span class="agent-card-title">${escapeHtml(agent.name)}</span>
                <span class="badge badge-${agent.status}">${agent.status}</span>
            </div>
            <div class="agent-card-description">
                ${escapeHtml(agent.description || 'No description')}
            </div>
            <div class="agent-card-footer">
                <span>📦 ${agent.node_count || 0} nodes • 🔗 ${agent.edge_count || 0} edges</span>
                <span>Updated ${updatedDate}</span>
            </div>
            <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2);">
                ${(agent.tags || []).map(t => `<span class="badge badge-draft">${escapeHtml(t)}</span>`).join('')}
            </div>
        </div>
    `;
}

function renderRecentAgentsNav(agents) {
    const nav = document.getElementById('recent-agents-nav');
    if (!nav) return;
    nav.innerHTML = agents.map(a => `
        <a class="nav-item" onclick="openAgent('${a.id}')">
            <span class="nav-icon">🤖</span>
            <span class="nav-label">${escapeHtml(a.name)}</span>
        </a>
    `).join('');
}

function filterAgentCards(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.agent-card').forEach(card => {
        const name = card.dataset.name || '';
        card.style.display = name.includes(q) ? '' : 'none';
    });
}

async function createNewAgent() {
    const name = document.getElementById('new-agent-name').value.trim();
    const desc = document.getElementById('new-agent-desc').value.trim();

    if (!name) {
        showToast('Please enter an agent name', 'warning');
        return;
    }

    try {
        const agent = await API.createAgent({ name, description: desc });
        closeModal('new-agent-modal');
        document.getElementById('new-agent-name').value = '';
        document.getElementById('new-agent-desc').value = '';
        showToast(`Agent "${name}" created!`, 'success');
        openAgent(agent.id);
    } catch (err) {
        showToast('Failed to create agent: ' + err.message, 'error');
    }
}

function openAgent(agentId) {
    navigateTo('canvas');
    Canvas.loadAgent(agentId);
}

async function updateAgentName(name) {
    if (!Canvas.agentId || !name.trim()) return;
    try {
        await API.updateAgent(Canvas.agentId, { name: name.trim() });
    } catch (err) {
        showToast('Failed to update name: ' + err.message, 'error');
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
