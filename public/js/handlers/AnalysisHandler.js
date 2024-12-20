class AnalysisHandler {
    constructor(workflow) {
        this.workflow = workflow;
        this.analysisInProgress = false;
        this.currentTaskId = null;
        this.pollingInterval = null;
    }

    async startAnalysis() {
        if (this.analysisInProgress) {
            return; // Prevent duplicate analysis
        }

        try {
            this.analysisInProgress = true;
            this.workflow.moveToStep(5);
            const featureScope = document.getElementById('featureScope').value;
            
            // Start source code analysis and get task ID
            const taskResponse = await this.startAnalysisTask('sourceCodeAnalysis', '/api/analyze/source-code', {
                sourceCode: this.workflow.state.repoPath,
                featureScope
            });

            if (taskResponse.taskId) {
                this.currentTaskId = taskResponse.taskId;
                this.startPolling();
            }
        } catch (error) {
            console.error('Error starting analysis:', error);
            this.handleError('sourceCodeAnalysis', error);
        }
    }

    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(async () => {
            try {
                const status = await this.checkTaskStatus(this.currentTaskId);
                
                if (status.status === 'completed') {
                    clearInterval(this.pollingInterval);
                    this.handleTaskCompletion(status.results);
                }
            } catch (error) {
                console.error('Error polling task status:', error);
                clearInterval(this.pollingInterval);
                this.handleError('sourceCodeAnalysis', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    async startAnalysisTask(stepId, endpoint, data) {
        const step = document.getElementById(stepId);
        const spinner = step.querySelector('.spinner');
        const statusText = step.querySelector('.status-text');

        try {
            // Update UI to show in-progress
            spinner.classList.remove('hidden');
            statusText.textContent = 'Starting Analysis...';
            statusText.className = 'status-text in-progress';

            // Make API call to start the task
            return await this.workflow.makeApiCall(endpoint, data);
        } catch (error) {
            this.handleError(stepId, error);
            throw error;
        }
    }

    async checkTaskStatus(taskId) {
        return await this.workflow.makeApiCall(`/api/analyze/task/${taskId}`, null, 'GET');
    }

    handleTaskCompletion(results) {
        this.analysisInProgress = false;
        
        // Update UI for each analysis step
        if (results.sourceCodeAnalysis) {
            this.updateStepUI('sourceCodeAnalysis', results.sourceCodeAnalysis);
        }
        if (results.diffAnalysis) {
            this.updateStepUI('diffAnalysis', results.diffAnalysis);
        }
        if (results.featureReview) {
            this.updateStepUI('featureReview', results.featureReview);
        }
        if (results.guidelines) {
            this.updateStepUI('guidelines', results.guidelines);
        }

        // Store results in workflow state
        this.workflow.state.analysisResults = results;
    }

    updateStepUI(stepId, result) {
        const step = document.getElementById(stepId);
        const spinner = step.querySelector('.spinner');
        const statusText = step.querySelector('.status-text');
        const content = step.querySelector('.step-content');

        spinner.classList.add('hidden');
        statusText.textContent = 'Completed';
        statusText.className = 'status-text completed';
        
        content.classList.remove('hidden');
        content.innerHTML = this.formatAnalysisResult({
            type: stepId,
            analysis: result
        });
    }

    handleError(stepId, error) {
        const step = document.getElementById(stepId);
        const spinner = step.querySelector('.spinner');
        const statusText = step.querySelector('.status-text');

        spinner.classList.add('hidden');
        statusText.textContent = 'Error: ' + error.message;
        statusText.className = 'status-text error';
        
        this.analysisInProgress = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    formatAnalysisResult(result) {
        if (!result || !result.analysis) {
            return '<div class="error-message">No analysis data available</div>';
        }

        let html = '<div class="analysis-result">';
        
        switch (result.type) {
            case 'sourceCodeAnalysis':
                html += this.formatSourceCodeAnalysis(result);
                break;
            case 'diffAnalysis':
                html += this.formatDiffAnalysis(result);
                break;
            case 'featureReview':
                html += this.formatFeatureReview(result);
                break;
            case 'guidelines':
                html += this.formatGuidelines(result);
                break;
            default:
                html += `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        }

        html += '</div>';
        return html;
    }

    formatSourceCodeAnalysis(result) {
        return `
            <h5>Code Quality Score: ${result.analysis.codeQuality?.score || 'N/A'}</h5>
            <div class="findings">
                <h6>Findings:</h6>
                <ul>
                    ${result.analysis.codeQuality?.findings?.map(f => `<li>${f}</li>`).join('') || 'No findings'}
                </ul>
            </div>
            <div class="scope-analysis">
                <h6>Scope Analysis:</h6>
                <p>In Scope: ${result.analysis.scope?.inScope?.join(', ') || 'None'}</p>
                <p>Out of Scope: ${result.analysis.scope?.outOfScope?.join(', ') || 'None'}</p>
            </div>
        `;
    }

    formatDiffAnalysis(result) {
        return `
            <div class="changes-analysis">
                <h6>Changes Impact: ${result.analysis.changes?.impact || 'N/A'}</h6>
                <h6>Risk Level: ${result.analysis.changes?.riskLevel || 'N/A'}</h6>
                <h6>Key Changes:</h6>
                <ul>
                    ${result.analysis.changes?.keyChanges?.map(c => `<li>${c}</li>`).join('') || 'No changes'}
                </ul>
            </div>
        `;
    }

    formatFeatureReview(result) {
        return `
            <div class="implementation-review">
                <h6>Implementation Completeness: ${result.analysis.implementation?.completeness || 'N/A'}%</h6>
                <h6>Suggestions:</h6>
                <ul>
                    ${result.analysis.implementation?.suggestions?.map(s => `<li>${s}</li>`).join('') || 'No suggestions'}
                </ul>
            </div>
        `;
    }

    formatGuidelines(result) {
        return `
            <div class="recommendations">
                <h6>Recommendations:</h6>
                <ul>
                    ${result.analysis.recommendations?.map(r => `<li>${r}</li>`).join('') || 'No recommendations'}
                </ul>
                <h6>Next Steps:</h6>
                <ul>
                    ${result.analysis.nextSteps?.map(s => `<li>${s}</li>`).join('') || 'No next steps'}
                </ul>
            </div>
        `;
    }
}
