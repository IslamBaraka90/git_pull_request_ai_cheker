class BranchComparison {
    constructor() {
        this.compareBranchesButton = document.getElementById('compareBranches');
        this.comparisonResult = document.getElementById('comparisonResult');
        this.featureScopeInput = document.getElementById('featureScope');
        this.analysisTabsContainer = document.getElementById('analysisTabs');
        this.analysisContentContainer = document.getElementById('analysisContent');
        
        this.bindEvents();
    }

    bindEvents() {
        this.compareBranchesButton.addEventListener('click', () => this.compareBranches());
        this.analysisTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
    }

    async compareBranches() {
        const repoPath = document.getElementById('repoPath').value;
        const targetBranch = document.getElementById('targetBranch').value;
        const featureScope = this.featureScopeInput.value;

        if (!repoPath || !targetBranch) {
            alert('Please enter repository path and select target branch');
            return;
        }

        try {
            const response = await fetch('/compare-branches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ repoPath, targetBranch, featureScope }),
            });

            const result = await response.json();
            this.displayAnalysis(result);
        } catch (error) {
            console.error('Error:', error);
            this.comparisonResult.textContent = 'Error comparing branches: ' + error.message;
        }
    }

    displayAnalysis(analysis) {
        // Clear previous results
        this.analysisTabsContainer.innerHTML = '';
        this.analysisContentContainer.innerHTML = '';

        // Create tabs and content for each analysis type
        const analysisTypes = {
            diffAnalysis: 'Diff Analysis',
            featureReview: 'Feature Review',
            implementationAnalysis: 'Implementation Analysis',
            developerGuidelines: 'Developer Guidelines'
        };

        Object.entries(analysisTypes).forEach(([key, label], index) => {
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button ${index === 0 ? 'active' : ''}`;
            tabButton.textContent = label;
            tabButton.dataset.tab = key;
            this.analysisTabsContainer.appendChild(tabButton);

            // Create content section
            const contentSection = document.createElement('div');
            contentSection.className = `analysis-tab-content ${index === 0 ? 'active' : ''}`;
            contentSection.id = key;
            contentSection.innerHTML = this.formatAnalysisContent(analysis[key], key);
            this.analysisContentContainer.appendChild(contentSection);
        });
    }

    formatAnalysisContent(content, type) {
        if (!content) return 'No analysis available';

        switch (type) {
            case 'diffAnalysis':
                return this.formatDiffAnalysis(content);
            case 'featureReview':
                return this.formatFeatureReview(content);
            case 'implementationAnalysis':
                return this.formatImplementationAnalysis(content);
            case 'developerGuidelines':
                return this.formatDeveloperGuidelines(content);
            default:
                return JSON.stringify(content, null, 2);
        }
    }

    formatDiffAnalysis(analysis) {
        return `
            <div class="ai-analysis-section">
                <h3 class="analysis-header">Changes Overview</h3>
                ${analysis.changes.map(change => `
                    <div class="change-item">
                        <strong>${change.file}</strong>
                        <p>${change.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatFeatureReview(review) {
        return `
            <div class="ai-analysis-section">
                <h3 class="analysis-header">Feature Implementation Review</h3>
                <div class="feature-status status-${review.completionStatus.toLowerCase()}">
                    Status: ${review.completionStatus}
                </div>
                <h4>Requirements Analysis:</h4>
                <ul class="requirement-list">
                    ${review.requirements.map(req => `
                        <li>${req}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    formatImplementationAnalysis(analysis) {
        return `
            <div class="ai-analysis-section">
                <h3 class="analysis-header">Implementation Quality</h3>
                <div class="timeline-section">
                    ${analysis.findings.map(finding => `
                        <div class="timeline-item">
                            <h4>${finding.category}</h4>
                            <p>${finding.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatDeveloperGuidelines(guidelines) {
        return `
            <div class="ai-analysis-section">
                <h3 class="analysis-header">Developer Guidelines</h3>
                <h4>Suggestions:</h4>
                <ul class="suggestions-list">
                    ${guidelines.suggestions.map(suggestion => `
                        <li>${suggestion}</li>
                    `).join('')}
                </ul>
                <h4>Security Considerations:</h4>
                <ul class="security-list">
                    ${guidelines.security.map(item => `
                        <li>${item}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    switchTab(tabId) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.analysis-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.branchComparison = new BranchComparison();
});
