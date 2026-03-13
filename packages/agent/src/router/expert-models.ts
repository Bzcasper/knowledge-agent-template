import { createOpenAI } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

// Your Modal-deployed models via OpenAI-compatible endpoint
const modalClient = createOpenAI({
  baseURL: process.env.MODAL_BASE_URL || 'https://your-modal-app.modal.run/v1',
  apiKey: process.env.MODAL_API_KEY,
})

// Your Cloudflare Workers AI gateway
const cfAI = createOpenAI({
  baseURL: process.env.CF_AI_GATEWAY 
    ? `https://gateway.ai.cloudflare.com/v1/${process.env.CF_ACCOUNT_ID}/ai-gateway/openai`
    : process.env.CF_AI_GATEWAY_URL || 'https://gateway.ai.cloudflare.com/v1/your-account/ai-gateway/openai',
  apiKey: process.env.CF_AI_TOKEN,
})

// Helper to get model by domain
export function getModelByDomain(domain: string): LanguageModel {
  switch (domain) {
    case 'jewelry':
      return modalClient('qwen3.5-vl-32b')
    case 'diy_crafts':
      return modalClient('meta-llama/llama-4-maverick')
    case 'code_n8n':
      return anthropic('claude-sonnet-4-20250514')
    case 'pricing':
      return google('gemini-2.0-flash')
    case 'social_content':
      return modalClient('meta-llama/llama-4-maverick')
    case 'general':
    default:
      return google('gemini-2.5-flash-lite')
  }
}

// Map for direct access
export const EXPERT_MODELS = {
  jewelry:        modalClient('qwen3.5-vl-32b'),
  diy_crafts:     modalClient('meta-llama/llama-4-maverick'),
  code_n8n:       anthropic('claude-sonnet-4-20250514'),
  pricing:        google('gemini-2.0-flash'),
  social_content: modalClient('meta-llama/llama-4-maverick'),
  general:        google('gemini-2.5-flash-lite'),
} as const

export type ExpertDomain = keyof typeof EXPERT_MODELS