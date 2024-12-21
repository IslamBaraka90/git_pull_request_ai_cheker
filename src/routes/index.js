const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');
const fileService = require('../services/fileService');
const aiService = require('../services/aiService'); // Assuming aiService is defined in a separate file
const path = require('path');
const fs = require('fs').promises;

// Git routes
router.post('/check-repo', async (req, res) => {
    console.log('[Route] /check-repo - Request body:', req.body);
    const { repoPath } = req.body;
    const gitInfo = await gitService.getRepoInfo(repoPath);
    console.log('[Route] /check-repo - Response:', gitInfo);
    res.json(gitInfo);
});

router.post('/compare-branches', async (req, res) => {
    console.log('[Route] /compare-branches - Request body:', req.body);
    const { repoPath, targetBranch, featureScope,mainBranch } = req.body;
    const comparison = await gitService.compareBranches(repoPath, targetBranch, mainBranch);
    console.log('[Route] /compare-branches - Response:', comparison);
    res.json(comparison);
});

router.post('/get-branches', async (req, res) => {
    console.log('[Route] /get-branches - Request body:', req.body);
    const { repoPath } = req.body;
    const branches = await gitService.getBranches(repoPath);
    console.log('[Route] /get-branches - Response:', branches);
    res.json(branches);
});

// Analysis routes
router.post('/analyze/source-code', async (req, res) => {
    console.log('Start sourcecode')
    try {
        console.log('[Route] /analyze/source-code - Request body:', req.body);
        const { sourceCode, featureScope, mainBranch, featureBranch, diffResults } = req.body;
        
        // Start the analysis task
        const taskResult = await aiService.analyzeSourceCode(sourceCode, featureScope, mainBranch, featureBranch, diffResults);
        
        // Return the task ID and initial status
        console.log('[Route] /analyze/source-code - Task started:', taskResult.taskId);
        res.json({
            taskId: taskResult.taskId,
            status: 'started',
            message: 'Analysis task started'
        });
    } catch (error) {
        console.error('[Route] /analyze/source-code - Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// In routes/index.js, modify the /analyze/task/:taskId route:
router.get('/analyze/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const taskFile = path.join(__dirname, '..', 'tasks', `${taskId}.json`);
        
        const exists = await fs.access(taskFile).then(() => true).catch(() => false);
        if (exists) {
            const taskData = JSON.parse(await fs.readFile(taskFile, 'utf8'));
            console.log('[Route] /analyze/task/:taskId - Task data:', taskData);
            res.json({
                taskId,
                status: 'completed',
                results: taskData.results
            });
        } else {
            res.json({
                taskId,
                status: 'in_progress',
                message: 'Analysis task is still running'
            });
        }
    } catch (error) {
        console.error('[Route] /analyze/task/:taskId - Error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch task status'
        });
    }
});

router.post('/analyze/diff', async (req, res) => {
    try {
        console.log('[Route] /analyze/diff - Request body:', req.body);
        const { diff, featureScope } = req.body;
        const analysis = await aiService.analyzeDiff(diff, featureScope);
        console.log('[Route] /analyze/diff - Response:', analysis);
        res.json(analysis);
    } catch (error) {
        console.error('[Route] /analyze/diff - Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/analyze/feature', async (req, res) => {
    try {
        console.log('[Route] /analyze/feature - Request body:', req.body);
        const { sourceCode, diff, featureScope } = req.body;
        const analysis = await aiService.reviewFeature(sourceCode, diff, featureScope);
        console.log('[Route] /analyze/feature - Response:', analysis);
        res.json(analysis);
    } catch (error) {
        console.error('[Route] /analyze/feature - Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/analyze/guidelines', async (req, res) => {
    try {
        console.log('[Route] /analyze/guidelines - Request body:', req.body);
        const { sourceCode, diff, featureScope, previousAnalyses } = req.body;
        const analysis = await aiService.generateGuidelines(sourceCode, diff, featureScope, previousAnalyses);
        console.log('[Route] /analyze/guidelines - Response:', analysis);
        res.json(analysis);
    } catch (error) {
        console.error('[Route] /analyze/guidelines - Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// File routes
router.post('/browse-files', async (req, res) => {
    console.log('[Route] /browse-files - Request body:', req.body);
    const { path: dirPath } = req.body;
    const result = await fileService.listFiles(dirPath);
    console.log('[Route] /browse-files - Response:', result);
    res.json(result);
});

router.post('/get-file-content', async (req, res) => {
    console.log('[Route] /get-file-content - Request body:', req.body);
    const { path: filePath } = req.body;
    const result = await fileService.getFileContent(filePath);
    console.log('[Route] /get-file-content - Response:', result);
    res.json(result);
});

router.post('/generate-source-file', async (req, res) => {
    console.log('[Route] /generate-source-file - Request body:', req.body);
    const { repoPath, mainBranch } = req.body;
    // First checkout the main branch
    const checkoutResult = await gitService.checkoutBranch(repoPath, mainBranch);
    if (checkoutResult.error) {
        console.error('[Route] /generate-source-file - Checkout error:', checkoutResult.error);
        res.json({ success: false, error: checkoutResult.error });
        return;
    }
    // Then generate the source code file
    const result = await fileService.generateSourceCodeFile(repoPath, mainBranch);
    console.log('[Route] /generate-source-file - Response:', result);
    res.json(result);
});

// Compare branches endpoint - now just returns diff
router.post('/api/compare-branches', async (req, res) => {
    console.log('[Route] /api/compare-branches - Request body:', req.body);
    const { repoPath, mainBranch, targetBranch, featureScope } = req.body;
    console.log('Repo path:', repoPath);
    console.log('Main branch:', mainBranch);
    console.log('Target branch:', targetBranch);

    try {
        
        // First checkout to main branch
        await gitService.checkoutBranch(repoPath, mainBranch);
        // Then compare with target branch
        const result = await gitService.compareBranches(repoPath, targetBranch,mainBranch);
        
        // Add feature scope and branch info to result
        result.featureScope = featureScope;
        result.mainBranch = mainBranch;
        result.targetBranch = targetBranch;
        
        console.log('[Route] /api/compare-branches - Response:', result);
        res.json(result);
    } catch (error) {
        console.error('[Route] /api/compare-branches - Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
