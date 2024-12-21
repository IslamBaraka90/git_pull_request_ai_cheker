class AnalysisHandler {
    constructor(workflow) {
        this.workflow = workflow;
        this.analysisInProgress = false;
        this.currentTaskId = null;
        this.steps = {
            sourceCodeAnalysis: document.getElementById('sourceCodeAnalysis'),
            diffAnalysis: document.getElementById('diffAnalysis'),
            featureReview: document.getElementById('featureReview'),
            guidelines: document.getElementById('guidelines')
        };
        
        this.initializeSocketListeners();
    }

    initializeSocketListeners() {
        console.log('[AnalysisHandler] Initializing socket listeners');
        
        socketClient.on('analysis:start', (data) => {
            console.log('[AnalysisHandler] Received analysis:start', data);
            this.updateStepUI(data.step, {
                status: data.status,
                message: data.message
            });
        });

        socketClient.on('analysis:progress', (data) => {
            console.log('[AnalysisHandler] Received analysis:progress', data);
            this.updateStepUI(data.step, {
                status: data.status,
                message: data.message,
                inProgress: true
            });
        });

        socketClient.on('analysis:complete', (data) => {
            console.log('[AnalysisHandler] Received analysis:complete', data);
            this.updateStepUI(data.step, {
                status: 'completed',
                message: data.message,
                results: data.results
            });

            // If this is the last step, mark analysis as complete
            if (data.step === 'guidelines') {
                this.analysisInProgress = false;
            }
        });

        socketClient.on('analysis:error', (data) => {
            console.log('[AnalysisHandler] Received analysis:error', data);
            this.handleError(data.step || 'sourceCodeAnalysis', new Error(data.error));
            this.analysisInProgress = false;
        });
    }

    updateStepUI(stepId, data) {
        const step = this.steps[stepId];
        if (!step) return;

        const spinner = step.querySelector('.spinner');
        const statusText = step.querySelector('.status-text');
        const content = step.querySelector('.step-content');

        // Update spinner
        if (data.inProgress) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }

        // Update status text
        statusText.textContent = data.message || 'Processing...';
        
        // Update status class
        statusText.className = 'status-text ' + data.status;

        // If we have results, update the content
        if (data.results) {
            content.classList.remove('hidden');
            content.innerHTML = this.formatAnalysisResult(data.results);
        }
    }

    handleError(stepId, error) {
        const step = this.steps[stepId];
        if (!step) return;

        const spinner = step.querySelector('.spinner');
        const statusText = step.querySelector('.status-text');
        
        spinner.classList.add('hidden');
        statusText.textContent = `Error: ${error.message}`;
        statusText.className = 'status-text error';
        
        this.analysisInProgress = false;
    }

    formatAnalysisResult(result) {
        return AIResponseFormatter.format(result);
    }

    async startAnalysis() {
        if (this.analysisInProgress) {
            return; // Prevent duplicate analysis
        }

        try {
            this.analysisInProgress = true;
            this.workflow.moveToStep(5);
            const featureScope = document.getElementById('featureScope').value;
            
            // Reset all steps to pending state
            Object.keys(this.steps).forEach(stepId => {
                this.updateStepUI(stepId, {
                    status: 'pending',
                    message: 'Pending',
                    inProgress: false
                });
            });
            
            // Start source code analysis
            const taskResponse = await this.startAnalysisTask('sourceCodeAnalysis', '/api/analyze/source-code', {
                sourceCode: this.workflow.state.repoPath,
                featureScope,
                mainBranch: this.workflow.state.mainBranch,
                featureBranch: this.workflow.state.featureBranch
            });

            if (taskResponse.taskId) {
                this.currentTaskId = taskResponse.taskId;
            }
        } catch (error) {
            console.error('Error starting analysis:', error);
            this.handleError('sourceCodeAnalysis', error);
        }
    }

    async startAnalysisTask(stepId, endpoint, data) {
        const step = this.steps[stepId];
        if (!step) return;

        try {
            return await this.workflow.makeApiCall(endpoint, data);
        } catch (error) {
            this.handleError(stepId, error);
            throw error;
        }
    }
}
