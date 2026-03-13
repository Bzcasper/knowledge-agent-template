import type { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { z } from 'zod'

export const ROUTER_MODEL = 'google/gemini-2.5-flash-lite'
export const DEFAULT_MODEL = 'google/gemini-3-flash'

// Get custom models from environment
function getCustomModels(): string[] {
  const customModels: string[] = []
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CUSTOM_API_MODEL_')) {
      const providerName = key.replace('CUSTOM_API_MODEL_', '').toLowerCase()
      const modelName = value || `${providerName}-default`
      customModels.push(`custom/${modelName}`)
    }
  }
  
  return customModels
}

// Export the custom models list
export const CUSTOM_MODELS = getCustomModels()

export const agentConfigSchema = z.object({
  complexity: z.enum(['trivial', 'simple', 'moderate', 'complex'])
    .describe('trivial=greeting, simple=single lookup, moderate=multi-search, complex=deep analysis'),

  maxSteps: z.number().min(1).max(30)
    .describe('Agent iterations: 4 trivial, 8 simple, 15 moderate, 25 complex'),

  model: z.enum([
    'google/gemini-3-flash',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-opus-4.6',
    ...CUSTOM_MODELS,
  ]).describe('flash for trivial/simple, sonnet for moderate, opus for complex'),

  reasoning: z.string().max(200)
    .describe('Brief explanation of the classification'),
})

export type AgentConfig = z.infer<typeof agentConfigSchema>

export function getDefaultConfig(): AgentConfig {
  return {
    complexity: 'moderate',
    maxSteps: 15,
    model: 'anthropic/claude-sonnet-4.6',
    reasoning: 'Default fallback configuration',
  }
}

const MODEL_FALLBACKS: Record<string, string[]> = {
  'google/gemini-3-flash': ['anthropic/claude-sonnet-4.6', 'openai/gpt-4o'],
  'anthropic/claude-sonnet-4.6': ['google/gemini-3-flash', 'openai/gpt-4o'],
  'anthropic/claude-opus-4.6': ['anthropic/claude-sonnet-4.6', 'google/gemini-3-flash'],
  'google/gemini-2.5-flash-lite': ['google/gemini-3-flash', 'openai/gpt-4o-mini'],
}

// Add fallbacks for custom models (fallback to first custom model or default)
CUSTOM_MODELS.forEach(model => {
  if (!MODEL_FALLBACKS[model]) {
    MODEL_FALLBACKS[model] = CUSTOM_MODELS.filter(m => m !== model).length > 0
      ? CUSTOM_MODELS.filter(m => m !== model)
      : ['anthropic/claude-sonnet-4.6']
  }
})

export function getModelFallbackOptions(model: string): SharedV3ProviderOptions | undefined {
  const fallbacks = MODEL_FALLBACKS[model]
  if (!fallbacks?.length) return undefined
  return { gateway: { models: fallbacks } }
}
