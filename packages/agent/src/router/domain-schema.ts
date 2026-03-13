import { z } from 'zod'

// Define your expert domains based on your custom models
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

// Export schema for use in other files
export const domainSchema = expertSchema