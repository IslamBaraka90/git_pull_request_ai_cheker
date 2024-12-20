const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs').promises;
const path = require('path');
const fileService = require('./fileService');
const socketService = require('./socketService');
require('dotenv').config();

class AIService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        
        // Initialize Google AI services
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.fileManager = new GoogleAIFileManager(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            systemInstruction: "You are a software designer and system architect. Analyze the provided source code context and answer questions about it."
        });
        
        this.promptsDir = path.join(__dirname, '..', 'prompts');
        this.tasksDir = path.join(__dirname, '..', 'tasks');
        
        // Ensure tasks directory exists
        this.ensureTasksDir();
        console.log('[AIService] Initialized with API key');
    }

    async ensureTasksDir() {
        try {
            await fs.mkdir(this.tasksDir, { recursive: true });
        } catch (error) {
            console.error('[AIService] Error creating tasks directory:', error);
        }
    }

    async generateTaskId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
        return `task_${timestamp}`;
    }

    async uploadToGemini(filePath, mimeType) {
        try {
            console.log(`[AIService] Uploading file: ${filePath}`);
            const uploadResult = await this.fileManager.uploadFile(filePath, {
                mimeType,
                displayName: path.basename(filePath),
            });
            console.log(`[AIService] Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.name}`);
            return uploadResult.file;
        } catch (error) {
            console.error('[AIService] Error uploading file:', error);
            throw error;
        }
    }

    async waitForFilesActive(files) {
        console.log("[AIService] Waiting for file processing...");
        for (const name of files.map((file) => file.name)) {
            let file = await this.fileManager.getFile(name);
            while (file.state === "PROCESSING") {
                await new Promise((resolve) => setTimeout(resolve, 10_000));
                file = await this.fileManager.getFile(name);
            }
            if (file.state !== "ACTIVE") {
                throw Error(`File ${file.name} failed to process`);
            }
        }
        console.log("[AIService] ...all files ready");
    }

    async getPrompt(templateName, variables) {
        try {
            console.log(`[AIService] Loading prompt template: ${templateName}`);
            const templatePath = path.join(this.promptsDir, templateName);
            let prompt = await fs.readFile(templatePath, 'utf8');
            
            Object.entries(variables).forEach(([key, value]) => {
                prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });
            
            return prompt;
        } catch (error) {
            console.error(`[AIService] Error loading prompt template: ${error.message}`);
            throw error;
        }
    }

    async generateContent(chatSession, prompt) {
        try {
            console.log('[AIService] Generating content with prompt length:', prompt.length);
            socketService.emitEvent('analysis:start', { message: 'Starting content generation' });
            
            const result = await chatSession.sendMessage(prompt);
            const text = result.response.text();

            socketService.emitEvent('analysis:complete', { 
                message: 'Content generation completed',
                results: text 
            });

            try {
                // Clean up markdown formatting if present
                let cleanText = text;
                if (text.includes('```json')) {
                    cleanText = text.split('```json')[1]  // Get content after ```json
                        .split('```')[0]    // Get content before closing ```
                        .trim();            // Remove any whitespace
                }
                
                console.log('[AIService] Cleaned response:', cleanText);
                return JSON.parse(cleanText);
            } catch (parseError) {
                console.error('[AIService] Failed to parse AI response:', parseError);
                console.error('[AIService] Raw response:', text);
                return {
                    error: 'Failed to parse AI analysis',
                    rawResponse: text
                };
            }
        } catch (error) {
            console.error('[AIService] Error generating content:', error);
            throw error;
        }
    }

    async analyzeSourceCode(sourceCodePath, featureScope) {
        try {
            const taskId = await this.generateTaskId();
            console.log(`[AIService] Starting analysis task: ${taskId}`);

            // Initial task start
            socketService.emitEvent('analysis:start', {
                taskId,
                step: 'sourceCodeAnalysis',
                status: 'preparing',
                message: 'Preparing source code analysis'
            });

            // Step 1: Generate source code file
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'sourceCodeAnalysis',
                status: 'generating',
                message: 'Generating source code file'
            });

            const fileResult = await fileService.generateSourceCodeFile(sourceCodePath);
            if (!fileResult.success) {
                throw new Error('Failed to generate source code representation');
            }

            // Step 2: Upload to Google AI
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'sourceCodeAnalysis',
                status: 'uploading',
                message: 'Uploading code to AI service'
            });

            const uploadedFile = await this.uploadToGemini(fileResult.path, 'text/plain');
            await this.waitForFilesActive([uploadedFile]);

            // Step 3: Initialize chat session
            const chatSession = this.model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [
                            {
                                fileData: {
                                    mimeType: uploadedFile.mimeType,
                                    fileUri: uploadedFile.uri,
                                }
                            }
                        ]
                    }
                ]
            });

            // Step 4: Run source code analysis
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'sourceCodeAnalysis',
                status: 'analyzing',
                message: 'Analyzing source code'
            });

            const sourceCodeAnalysis = await this.generateContent(chatSession, 
                await this.getPrompt('source-code-analysis.txt', { featureScope })
            );

            socketService.emitEvent('analysis:complete', {
                taskId,
                step: 'sourceCodeAnalysis',
                status: 'completed',
                message: 'Source code analysis completed',
                results: sourceCodeAnalysis
            });

            // Step 5: Run diff analysis
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'diffAnalysis',
                status: 'analyzing',
                message: 'Analyzing code changes'
            });

            const diffAnalysis = await this.generateContent(chatSession,
                await this.getPrompt('diff-analysis.txt', { featureScope })
            );

            socketService.emitEvent('analysis:complete', {
                taskId,
                step: 'diffAnalysis',
                status: 'completed',
                message: 'Changes analysis completed',
                results: diffAnalysis
            });

            // Step 6: Run feature review
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'featureReview',
                status: 'analyzing',
                message: 'Reviewing feature implementation'
            });

            const featureReview = await this.generateContent(chatSession,
                await this.getPrompt('feature-review.txt', { featureScope })
            );

            socketService.emitEvent('analysis:complete', {
                taskId,
                step: 'featureReview',
                status: 'completed',
                message: 'Feature review completed',
                results: featureReview
            });

            // Step 7: Generate guidelines
            socketService.emitEvent('analysis:progress', {
                taskId,
                step: 'guidelines',
                status: 'analyzing',
                message: 'Generating guidelines and recommendations'
            });

            const guidelines = await this.generateContent(chatSession,
                await this.getPrompt('guidelines.txt', {
                    featureScope,
                    previousAnalyses: JSON.stringify({
                        sourceCode: sourceCodeAnalysis,
                        diff: diffAnalysis,
                        feature: featureReview
                    })
                })
            );

            socketService.emitEvent('analysis:complete', {
                taskId,
                step: 'guidelines',
                status: 'completed',
                message: 'Guidelines generation completed',
                results: guidelines
            });

            // Save task results
            const taskResult = {
                taskId,
                sourceCodePath,
                featureScope,
                sourceCodeFile: fileResult.path,
                uploadedFile: uploadedFile.name,
                results: {
                    sourceCodeAnalysis,
                    diffAnalysis,
                    featureReview,
                    guidelines
                }
            };

            return taskResult;

        } catch (error) {
            console.error('[AIService] Analysis error:', error);
            socketService.emitEvent('analysis:error', {
                taskId,
                error: error.message,
                details: error.stack
            });
            throw error;
        }
    }

    async analyzeDiff(diff, featureScope) {
        try {
            console.log('[AIService] Analyzing diff');
            const prompt = await this.getPrompt('diff-analysis.txt', {
                diff,
                featureScope
            });
            return await this.generateContent(this.model.startChat(), prompt);
        } catch (error) {
            console.error('[AIService] Error in analyzeDiff:', error);
            throw error;
        }
    }

    async reviewFeature(sourceCode, diff, featureScope) {
        try {
            console.log('[AIService] Reviewing feature');
            const prompt = await this.getPrompt('feature-review.txt', {
                sourceCode,
                diff,
                featureScope
            });
            return await this.generateContent(this.model.startChat(), prompt);
        } catch (error) {
            console.error('[AIService] Error in reviewFeature:', error);
            throw error;
        }
    }

    async generateGuidelines(sourceCode, diff, featureScope, previousAnalyses) {
        try {
            console.log('[AIService] Generating guidelines');
            const prompt = await this.getPrompt('guidelines.txt', {
                sourceCode,
                diff,
                featureScope,
                previousAnalyses: JSON.stringify(previousAnalyses)
            });
            return await this.generateContent(this.model.startChat(), prompt);
        } catch (error) {
            console.error('[AIService] Error in generateGuidelines:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const aiService = new AIService();
module.exports = aiService;
