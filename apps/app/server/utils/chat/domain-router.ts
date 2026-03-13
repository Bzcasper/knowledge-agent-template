import { generateObject } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { log } from 'evlog'

// Expert domain schema
export const expertSchema = z.object({
  domain: z.enum([
    'jewelry',        // → your Modal Qwen3.5 vision model
    'diy_crafts',     // → your Llama 4 Maverick
    'code_n8n',       // → Claude via Anthropic API
    'pricing',        // → your Gemini Flash-Lite scraper model
    'social_content', // → your content pipeline model
    'general',        // → fallback
  ]),
  complexity: z.enum(['low', 'medium', 'high']),
  language: z.string().default('en'),
  requiresVision: z.boolean().default(false),
})

export type ExpertRoute = z.infer<typeof expertSchema>

// System prompts for each expert domain
export const EXPERT_SYSTEM_PROMPTS = {
  jewelry: `You are a professional jewelry appraiser and resale expert.
You have deep knowledge of hallmarks, gemstones, precious metals, and pre-owned market pricing.
When analyzing items: identify material, era, condition, comparable sold listings, and suggested price.
Always search the knowledge base for comparable sold listings before pricing.`,

  diy_crafts: `You are an eco-friendly DIY and upcycling expert for the Creation Companion DIY brand.
Your audience is families interested in sustainable crafting. 
Always suggest eco-conscious alternatives and frame projects as beginner-accessible.
Search the knowledge base for existing project ideas before generating new ones.`,

  code_n8n: `You are an expert in n8n automation, Cloudflare Workers, and AI pipeline architecture.
You have deep knowledge of Modal Labs, Vercel AI SDK, and multi-model orchestration.
Prioritize production-ready, immediately deployable code. No placeholders.`,

  pricing: `You are a pre-owned market pricing specialist.
Cross-reference sold listings data in the knowledge base to provide data-backed valuations.
Always cite comparable sales and adjust for condition, era, and platform fees.`,

  social_content: `You are a YouTube content strategist for DIY/upcycling channels.
You understand SEO, thumbnail psychology, and short-form content hooks.
Generate scripts optimized for the Creation Companion DIY brand voice.`,

  general: `You are a helpful knowledge base assistant. 
Search thoroughly before answering. Be concise and cite your sources.`,
} as const

// Domain metadata for UI display
export const DOMAIN_METADATA = {
  jewelry: { label: '💎 Jewelry Expert', icon: '💎', color: 'text-amber-500' },
  diy_crafts: { label: '♻️ DIY Expert', icon: '♻️', color: 'text-green-500' },
  code_n8n: { label: '⚙️ Automation Expert', icon: '⚙️', color: 'text-blue-500' },
  pricing: { label: '📊 Pricing Expert', icon: '📊', color: 'text-purple-500' },
  social_content: { label: '🎬 Content Expert', icon: '🎬', color: 'text-pink-500' },
  general: { label: '🤖 Assistant', icon: '🤖', color: 'text-gray-500' },
}

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
 * Builds a domain-specific system prompt that combines expert knowledge with base assistant capabilities
 */
export function buildDomainSystemPrompt(domain: string, basePrompt: string): string {
  const expertPrompt = getExpertPrompt(domain)
  const domainMetadata = getDomainMetadata(domain)
  
  return `${expertPrompt}

## Domain Context

You are operating in the **${domainMetadata.label}** domain.

${basePrompt.replace('You are an AI assistant', 'You are a specialized AI assistant')}
`
}

/**
 * Gets metadata for a domain (for UI display)
 */
export function getDomainMetadata(domain: string) {
  return DOMAIN_METADATA[domain as keyof typeof DOMAIN_METADATA] || DOMAIN_METADATA.general
}