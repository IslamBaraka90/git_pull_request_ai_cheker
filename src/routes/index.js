const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');
const fileService = require('../services/fileService');

// Git routes
router.post('/check-repo', async (req, res) => {
    const { repoPath } = req.body;
    const gitInfo = await gitService.getRepoInfo(repoPath);
    res.json(gitInfo);
});

router.post('/compare-branches', async (req, res) => {
    const { repoPath, targetBranch } = req.body;
    const comparison = await gitService.compareBranches(repoPath, targetBranch);
    res.json(comparison);
});

router.post('/get-branches', async (req, res) => {
    const { repoPath } = req.body;
    const branches = await gitService.getBranches(repoPath);
    res.json(branches);
});

// File routes
router.post('/browse-files', async (req, res) => {
    const { path: dirPath } = req.body;
    const result = await fileService.listFiles(dirPath);
    res.json(result);
});

router.post('/get-file-content', async (req, res) => {
    const { path: filePath } = req.body;
    const result = await fileService.getFileContent(filePath);
    res.json(result);
});

router.post('/generate-source-file', async (req, res) => {
    const { repoPath, mainBranch } = req.body;
    // First checkout the main branch
    const checkoutResult = await gitService.checkoutBranch(repoPath, mainBranch);
    if (checkoutResult.error) {
        res.json({ success: false, error: checkoutResult.error });
        return;
    }
    // Then generate the source code file
    const result = await fileService.generateSourceCodeFile(repoPath, mainBranch);
    res.json(result);
});

module.exports = router;
