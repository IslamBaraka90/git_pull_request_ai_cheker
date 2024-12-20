class BaseWorkflow {
    constructor() {
        this.currentStep = 1;
        this.state = {
            repoPath: '',
            sourceCodeFile: '',
            diffResult: '',
            analysisResults: {
                sourceCode: null,
                diff: null,
                feature: null,
                guidelines: null
            }
        };
    }

    moveToStep(step) {
        document.querySelectorAll('.step').forEach(el => {
            el.classList.add('hidden');
        });
        document.getElementById(`step${step}`).classList.remove('hidden');
        this.currentStep = step;
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.moveToStep(this.currentStep - 1);
        }
    }

    showError(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        modal.classList.remove('hidden');
    }

    closeErrorModal() {
        document.getElementById('errorModal').classList.add('hidden');
    }

    // Utility method for making API calls
    async makeApiCall(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }
}
