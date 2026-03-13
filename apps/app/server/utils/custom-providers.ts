import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGateway } from '@ai-sdk/gateway'

// Define custom provider configurations based on environment variables
export interface CustomProviderConfig {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

// Extract custom providers from environment variables
function getCustomProviders(): CustomProviderConfig[] {
  const providers: CustomProviderConfig[] = []

  // Process CUSTOM_API_BASE_URL_* variables (without VITE_ prefix)
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CUSTOM_API_BASE_URL_')) {
      const providerName = key.replace('CUSTOM_API_BASE_URL_', '').toLowerCase()
      const baseURL = value
      const apiKey = process.env[`CUSTOM_API_KEY_${providerName.toUpperCase()}`] || 
                    process.env[`CUSTOM_API_KEY_${providerName}`] || ''
      const model = process.env[`CUSTOM_API_MODEL_${providerName.toUpperCase()}`] || 
                   process.env[`CUSTOM_API_MODEL_${providerName}`] || 
                   `${providerName}-default`

      if (baseURL && apiKey) {
        providers.push({
          name: providerName,
          baseURL,
          apiKey,
          model,
        })
      }
    }
  }

  return providers
}

// Create provider instances
export function createCustomProviders() {
  const configs = getCustomProviders()
  const providers: Record<string, ReturnType<typeof createOpenAICompatible>> = {}

  for (const config of configs) {
    providers[config.name] = createOpenAICompatible({
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      includeUsage: true,
    })
  }

  return { providers, configs }
}

// Get all available models including custom ones
export function getAllModels(): string[] {
  const { configs } = createCustomProviders()
  const defaultModels = [
    'google/gemini-3-flash',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-opus-4.6',
  ]

  const customModels = configs.map(config => `custom/${config.model}`)
  return [...defaultModels, ...customModels]
}

// Get model by identifier
export function getModel(modelId: string) {
  const { providers, configs } = createCustomProviders()
  
  // Check if it's a custom model (format: custom/model-name)
  if (modelId.startsWith('custom/')) {
    const modelName = modelId.replace('custom/', '')
    const config = configs.find(c => c.model === modelName)
    if (config) {
      return providers[config.name](modelName)
    }
  }

  // Use AI Gateway for default models
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
  const gateway = createGateway(gatewayApiKey ? { apiKey: gatewayApiKey } : undefined)
  return gateway(modelId)
}