class AIResponseFormatter {
    static format(result) {
        console.log('[AIResponseFormatter] Formatting analysis result:', result);
        
        if (!result) {
            return '<div class="error-message">No analysis data available</div>';
        }

        // Handle simple string results
        if (typeof result === 'string') {
            return `<pre>${result}</pre>`;
        }

        // If it's a typed analysis, use specific formatters
        if (result.type && result.analysis) {
            switch (result.type) {
                case 'source-code-analysis':
                    return this.formatSourceCodeAnalysis(result.analysis);
                case 'diff-analysis':
                    return this.formatDiffAnalysis(result.analysis);
                case 'feature-review':
                    return this.formatFeatureReview(result.analysis);
                case 'guidelines':
                    return this.formatGuidelines(result.analysis);
                default:
                    return this.formatGenericResult(result);
            }
        }

        // Handle structured results with summary/details format
        return this.formatGenericResult(result);
    }

    static formatSourceCodeAnalysis(analysis) {
        return `
            <div class="analysis-result source-code-analysis">
                <div class="quality-score">
                    <h4>Code Quality Score: ${analysis.codeQuality?.score || 'N/A'}</h4>
                </div>
                
                <div class="findings">
                    <h4>Findings</h4>
                    <ul>
                        ${analysis.codeQuality?.findings?.map(f => `<li>${f}</li>`).join('') || '<li>No findings available</li>'}
                    </ul>
                </div>

                <div class="scope-analysis">
                    <h4>Scope Analysis</h4>
                    <div class="scope-section">
                        <h5>In Scope</h5>
                        <ul>
                            ${analysis.scope?.inScope?.map(item => `<li>${item}</li>`).join('') || '<li>None specified</li>'}
                        </ul>
                    </div>
                    <div class="scope-section">
                        <h5>Out of Scope</h5>
                        <ul>
                            ${analysis.scope?.outOfScope?.map(item => `<li>${item}</li>`).join('') || '<li>None specified</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    static formatDiffAnalysis(analysis) {
        return `
            <div class="analysis-result diff-analysis">
                <div class="impact-assessment">
                    <h4>Change Assessment</h4>
                    <div class="metrics">
                        <div class="metric">
                            <span class="label">Impact:</span>
                            <span class="value ${analysis.changes?.impact || 'unknown'}">${analysis.changes?.impact || 'Unknown'}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Risk Level:</span>
                            <span class="value ${analysis.changes?.riskLevel || 'unknown'}">${analysis.changes?.riskLevel || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                <div class="key-changes">
                    <h4>Key Changes</h4>
                    <ul>
                        ${analysis.changes?.keyChanges?.map(change => `<li>${change}</li>`).join('') || '<li>No changes specified</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    static formatFeatureReview(analysis) {
        return `
            <div class="analysis-result feature-review">
                <div class="implementation-status">
                    <h4>Implementation Status</h4>
                    <div class="completeness-meter">
                        <div class="meter-label">Completeness:</div>
                        <div class="meter">
                            <div class="meter-fill" style="width: ${analysis.implementation?.completeness || 0}%"></div>
                        </div>
                        <div class="meter-value">${analysis.implementation?.completeness || 0}%</div>
                    </div>
                </div>

                <div class="suggestions">
                    <h4>Implementation Suggestions</h4>
                    <ul>
                        ${analysis.implementation?.suggestions?.map(suggestion => `<li>${suggestion}</li>`).join('') || '<li>No suggestions available</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    static formatGuidelines(analysis) {
        return `
            <div class="analysis-result guidelines">
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${analysis.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No recommendations available</li>'}
                    </ul>
                </div>

                <div class="next-steps">
                    <h4>Next Steps</h4>
                    <ul>
                        ${analysis.nextSteps?.map(step => `<li>${step}</li>`).join('') || '<li>No next steps defined</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    static formatGenericResult(result) {
        let html = '<div class="analysis-result generic">';
        
        if (result.summary) {
            html += `<div class="summary"><h4>Summary</h4><p>${result.summary}</p></div>`;
        }
        
        if (result.details) {
            html += '<div class="details"><h4>Details</h4>';
            if (Array.isArray(result.details)) {
                html += '<ul>';
                result.details.forEach(detail => {
                    html += `<li>${detail}</li>`;
                });
                html += '</ul>';
            } else {
                html += `<p>${result.details}</p>`;
            }
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }
}
