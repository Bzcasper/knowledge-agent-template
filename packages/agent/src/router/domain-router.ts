import { generateObject } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { log } from 'evlog'
import { expertSchema, type ExpertRoute } from './domain-schema'
import { EXPERT_SYSTEM_PROMPTS } from '../prompts/expert-prompts'
import { getModelByDomain } from './expert-models'

/**
 * Routes a question to the appropriate expert domain using a lightweight model
 */
export async function routeToExpert(
  question: string, 
  requestId: string,
  apiKey?: string
): Promise<ExpertRoute> {
  const gateway = createGateway(apiKey ? { apiKey } : undefined)
  
  try {
    const { object } = await generateObject({
      model: gateway('google/gemini-2.5-flash-lite'), // Cheap routing model
      schema: expertSchema,
      prompt: `Classify this question for expert routing:\n"${question}"\n
      - jewelry: appraisals, identification, pricing, listings
      - diy_crafts: upcycling, tutorials, eco-friendly projects  
      - code_n8n: automation, n8n, APIs, Cloudflare Workers
      - pricing: market comps, sold listings, valuation
      - social_content: YouTube scripts, thumbnails, captions
      - general: anything else`,
    })
    
    log.info({ 
      event: 'domain_router.decision', 
      requestId, 
      domain: object.domain, 
      complexity: object.complexity,
      reasoning: object.language 
    })
    
    return object
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log.error({ event: 'domain_router.failed', requestId, error: errorMessage })
    
    // Fallback to general domain
    return {
      domain: 'general',
      complexity: 'medium',
      language: 'en',
      requiresVision: false,
    }
  }
}

/**
 * Gets the system prompt for a specific domain
 */
export function getExpertPrompt(domain: string): string {
  return EXPERT_SYSTEM_PROMPTS[domain as keyof typeof EXPERT_SYSTEM_PROMPTS] || EXPERT_SYSTEM_PROMPTS.general
}

/**
 * Gets the model for a specific domain
 */
export function getExpertModel(domain: string) {
  return getModelByDomain(domain)
}

/**
 * Gets metadata for a domain (for UI display)
 */
export function getDomainMetadata(domain: string) {
  const metadata: Record<string, { label: string; icon: string; color: string }> = {
    jewelry: { label: '💎 Jewelry Expert', icon: '💎', color: 'text-amber-500' },
    diy_crafts: { label: '♻️ DIY Expert', icon: '♻️', color: 'text-green-500' },
    code_n8n: { label: '⚙️ Automation Expert', icon: '⚙️', color: 'text-blue-500' },
    pricing: { label: '📊 Pricing Expert', icon: '📊', color: 'text-purple-500' },
    social_content: { label: '🎬 Content Expert', icon: '🎬', color: 'text-pink-500' },
    general: { label: '🤖 Assistant', icon: '🤖', color: 'text-gray-500' },
  }
  
  return metadata[domain as keyof typeof metadata] || metadata.general
}