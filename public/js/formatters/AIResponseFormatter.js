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
                <div class="scope-alignment">
                    <h3>Scope Alignment</h3>
                    
                    <div class="aligned-changes">
                        <h4>Aligned Changes</h4>
                        ${this.formatChanges(analysis.scopeAlignment?.alignedChanges)}
                    </div>

                    <div class="out-of-scope-changes">
                        <h4>Out of Scope Changes</h4>
                        ${this.formatOutOfScopeChanges(analysis.scopeAlignment?.outOfScopeChanges)}
                    </div>
                </div>

                <div class="impact-assessment">
                    <h3>Impact Assessment</h3>
                    <div class="metrics">
                        <div class="metric">
                            <span class="label">Impact Level:</span>
                            <span class="value ${analysis.impact?.level || 'unknown'}">${analysis.impact?.level || 'Unknown'}</span>
                        </div>
                    </div>

                    <div class="key-changes">
                        <h4>Key Changes</h4>
                        ${this.formatKeyChanges(analysis.impact?.keyChanges)}
                    </div>

                    <div class="risk-assessment">
                        <h4>Risk Assessment</h4>
                        <div class="metric">
                            <span class="label">Risk Level:</span>
                            <span class="value ${analysis.impact?.riskAssessment?.level || 'unknown'}">
                                ${analysis.impact?.riskAssessment?.level || 'Unknown'}
                            </span>
                        </div>
                        <div class="risk-details">
                            <h5>Risk Factors</h5>
                            <ul>
                                ${analysis.impact?.riskAssessment?.factors?.map(factor => `<li>${factor}</li>`).join('') || '<li>No risk factors specified</li>'}
                            </ul>
                            <h5>Mitigations</h5>
                            <ul>
                                ${analysis.impact?.riskAssessment?.mitigations?.map(mitigation => `<li>${mitigation}</li>`).join('') || '<li>No mitigations specified</li>'}
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="recommendations">
                    <h3>Recommendations</h3>
                    <div class="required-changes">
                        <h4>Required Changes</h4>
                        <ul>
                            ${analysis.recommendations?.requiredChanges?.map(change => `<li>${change}</li>`).join('') || '<li>No required changes specified</li>'}
                        </ul>
                    </div>
                    <div class="code-quality">
                        <h4>Code Quality Suggestions</h4>
                        <ul>
                            ${analysis.recommendations?.codeQuality?.map(suggestion => `<li>${suggestion}</li>`).join('') || '<li>No code quality suggestions specified</li>'}
                        </ul>
                    </div>
                    <div class="testing">
                        <h4>Testing Focus Areas</h4>
                        <ul>
                            ${analysis.recommendations?.testing?.map(area => `<li>${area}</li>`).join('') || '<li>No testing areas specified</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    static formatChanges(changes) {
        if (!changes || changes.length === 0) {
            return '<p>No aligned changes specified</p>';
        }

        return changes.map(change => `
            <div class="change-item">
                <h5>${change.description}</h5>
                <div class="files">
                    <strong>Files:</strong>
                    <ul>
                        ${change.files.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>
                <div class="justification">
                    <strong>Justification:</strong>
                    <p>${change.justification}</p>
                </div>
            </div>
        `).join('');
    }

    static formatOutOfScopeChanges(changes) {
        if (!changes || changes.length === 0) {
            return '<p>No out of scope changes identified</p>';
        }

        return changes.map(change => `
            <div class="change-item out-of-scope">
                <h5>${change.description}</h5>
                <div class="files">
                    <strong>Files:</strong>
                    <ul>
                        ${change.files.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>
                <div class="concern">
                    <strong>Concern:</strong>
                    <p style="color: red;">${change.concern}</p>
                </div>
            </div>
        `).join('');
    }

    static formatKeyChanges(changes) {
        if (!changes || changes.length === 0) {
            return '<p>No key changes specified</p>';
        }

        return changes.map(change => `
            <div class="key-change-item">
                <h5>${change.description}</h5>
                <div class="impact-details">
                    <div class="technical-impact">
                        <strong>Technical Impact:</strong>
                        <p>${change.technicalImpact}</p>
                    </div>
                    <div class="business-impact">
                        <strong>Business Impact:</strong>
                        <p>${change.businessImpact}</p>
                    </div>
                </div>
            </div>
        `).join('');
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
