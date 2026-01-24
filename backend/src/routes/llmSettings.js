import express from 'express';
import * as llmSettingsController from '../controllers/llmSettings.js';

const router = express.Router();

// Get user's LLM settings
router.get('/', llmSettingsController.getLLMSettings);

// Update user's LLM settings
router.put('/', llmSettingsController.updateLLMSettings);

// Get available models for all providers
router.get('/models', llmSettingsController.getAvailableModels);

// Get Ollama status and models
router.get('/ollama/status', llmSettingsController.getOllamaStatus);

// Pull an Ollama model
router.post('/ollama/pull', llmSettingsController.pullOllamaModel);

// Delete an Ollama model
router.delete('/ollama/models/:modelName', llmSettingsController.deleteOllamaModel);

export default router;
