class Workflow extends BaseWorkflow {
    constructor() {
        super();
        this.state = {
            repoPath: '',
            currentStep: 1,
            analysisResults: {}
        };
        
        this.repositoryHandler = new RepositoryHandler(this);
        this.diffHandler = new DiffHandler(this);
        this.analysisHandler = new AnalysisHandler(this);
    }

    initializeEventListeners() {
        // Remove existing listeners first
        const checkRepo = document.getElementById('checkRepo');
        const nextToBranches = document.getElementById('nextToBranches');
        const viewDiff = document.getElementById('viewDiff');
        const startAnalysis = document.getElementById('startAnalysis');
        const backButtons = document.querySelectorAll('.btn-secondary');
        const closeBtn = document.querySelector('.modal .close');

        // Clean up existing listeners
        checkRepo?.replaceWith(checkRepo.cloneNode(true));
        nextToBranches?.replaceWith(nextToBranches.cloneNode(true));
        viewDiff?.replaceWith(viewDiff.cloneNode(true));
        startAnalysis?.replaceWith(startAnalysis.cloneNode(true));
        backButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
        closeBtn?.replaceWith(closeBtn.cloneNode(true));

        // Re-get elements after replacement
        document.getElementById('checkRepo')?.addEventListener('click', () => 
            this.repositoryHandler.checkRepository());

        document.getElementById('nextToBranches')?.addEventListener('click', () => 
            this.moveToStep(3));

        document.getElementById('viewDiff')?.addEventListener('click', () => 
            this.diffHandler.viewDifferences());

        document.getElementById('startAnalysis')?.addEventListener('click', () => 
            this.analysisHandler.startAnalysis());

        document.querySelectorAll('.btn-secondary').forEach(button => {
            button.addEventListener('click', () => this.prevStep());
        });

        const newCloseBtn = document.querySelector('.modal .close');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => this.closeErrorModal());
        }
    }

    moveToStep(step) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
        
        // Show target step
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.remove('hidden');
            this.state.currentStep = step;
        } else {
            console.error(`Step ${step} not found`);
        }
    }

    prevStep() {
        if (this.state.currentStep > 1) {
            this.moveToStep(this.state.currentStep - 1);
        }
    }

    showError(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        if (modal && errorMessage) {
            errorMessage.textContent = message;
            modal.classList.remove('hidden');
        } else {
            alert(message);
        }
    }

    closeErrorModal() {
        const modal = document.getElementById('errorModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async makeApiCall(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }
}

// Initialize workflow when document is ready
let workflowInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    if (!workflowInstance) {
        workflowInstance = new Workflow();
        workflowInstance.initializeEventListeners();
        window.workflow = workflowInstance;
    }
});
