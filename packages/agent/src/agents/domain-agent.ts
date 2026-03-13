import { stepCountIs, ToolLoopAgent, type StepResult, type ToolSet, type UIMessage } from 'ai'
import { log } from 'evlog'
import { DEFAULT_MODEL, getModelFallbackOptions } from '../router/schema'
import { buildChatSystemPrompt } from '../prompts/chat'
import { applyComplexity } from '../prompts/shared'
import { compactContext } from '../core/context'
import { callOptionsSchema } from '../core/schemas'
import { sanitizeToolCallInputs } from '../core/sanitize'
import { countConsecutiveToolSteps, shouldForceTextOnlyStep } from '../core/policy'
import { webSearchTool } from '../tools/web-search'
import type { AgentConfigData, AgentCallOptions, AgentExecutionContext, RoutingResult } from '../types'
import { routeToExpert, getExpertPrompt, getDomainMetadata } from '../router/domain-router'

export interface DomainAgentOptions {
  tools: Record<string, unknown>
  getAgentConfig: () => Promise<AgentConfigData>
  messages: UIMessage[]
  /** AI Gateway API key. Optional — falls back to OIDC on Vercel or AI_GATEWAY_API_KEY env var. */
  apiKey?: string
  requestId?: string
  /** Falls back to agentConfig.defaultModel then DEFAULT_MODEL */
  defaultModel?: string
  onRouted?: (result: RoutingResult & { domain: string }) => void
    
  onStepFinish?: (stepResult: any) => void
    
  onFinish?: (result: any) => void
}

export function createDomainAgent({
  tools,
  getAgentConfig,
  messages,
  apiKey,
  requestId,
  defaultModel = DEFAULT_MODEL,
  onRouted,
  onStepFinish,
  onFinish,
}: DomainAgentOptions) {
  const id = requestId ?? crypto.randomUUID().slice(0, 8)
  let maxSteps = 15
  let expertDomain = 'general'

  return new ToolLoopAgent({
    model: DEFAULT_MODEL,
    callOptionsSchema,
    prepareCall: async ({ options, ...settings }) => {
      const modelOverride = (options as AgentCallOptions | undefined)?.model
      const customContext = (options as AgentCallOptions | undefined)?.context

      // Get last user message for domain routing
      const lastUserMessage = messages[messages.length - 1]
      let questionText = ''
      if (lastUserMessage?.role === 'user') {
        questionText = lastUserMessage.parts
          ?.filter((p): p is { type: 'text', text: string } => p.type === 'text')
          .map(p => p.text)
          .join('\n') || ''
      }

      // Route to expert domain
      if (questionText) {
        const expertRoute = await routeToExpert(questionText, id, apiKey)
        expertDomain = expertRoute.domain
        const domainMetadata = getDomainMetadata(expertRoute.domain)
        log.info('chat', `[${id}] Domain routed to: ${domainMetadata.label}`)
      }

      // Get routing config and agent config
      const [routerConfig, agentConfig] = await Promise.all([
        routeQuestion(messages, id, apiKey),
        getAgentConfig(),
      ])

      const effectiveMaxSteps = Math.round(routerConfig.maxSteps * agentConfig.maxStepsMultiplier)
      const effectiveModel = modelOverride ?? agentConfig.defaultModel ?? defaultModel

      maxSteps = effectiveMaxSteps
      onRouted?.({ routerConfig, agentConfig, effectiveModel, effectiveMaxSteps, domain: expertDomain })

      const executionContext: AgentExecutionContext = {
        mode: 'chat',
        effectiveModel,
        maxSteps: effectiveMaxSteps,
        routerConfig,
        agentConfig,
        customContext,
      }

      // Build domain-specific system prompt
      const basePrompt = buildChatSystemPrompt(agentConfig)
      const domainPrompt = getExpertPrompt(expertDomain)
      const finalPrompt = applyComplexity(domainPrompt, routerConfig)

      return {
        ...settings,
        model: effectiveModel,
        instructions: finalPrompt,
        tools: { ...tools, web_search: webSearchTool },
        stopWhen: stepCountIs(effectiveMaxSteps),
        providerOptions: getModelFallbackOptions(effectiveModel),
        experimental_context: executionContext,
      }
    },
    prepareStep: ({ stepNumber, messages: stepMessages, steps }) => {
      sanitizeToolCallInputs(stepMessages)
      const normalizedSteps = (steps as StepResult<ToolSet>[] | undefined) ?? []
      const compactedMessages = compactContext({ messages: stepMessages, steps: normalizedSteps })

      if (shouldForceTextOnlyStep({ stepNumber, maxSteps, steps: normalizedSteps })) {
        log.info({ event: 'agent.force_text_step', step: stepNumber + 1, maxSteps, toolStreak: countConsecutiveToolSteps(normalizedSteps) })
        return {
          tools: {},
          toolChoice: 'none' as const,
          activeTools: [],
          ...(compactedMessages !== stepMessages ? { messages: compactedMessages } : {}),
        }
      }

      if (compactedMessages !== stepMessages) {
        return { messages: compactedMessages }
      }
    },
    onStepFinish,
    onFinish,
  })
}