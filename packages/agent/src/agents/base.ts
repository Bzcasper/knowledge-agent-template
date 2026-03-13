import { stepCountIs, ToolLoopAgent, type StepResult, type ToolSet } from 'ai'
import { log } from 'evlog'
import { DEFAULT_MODEL, getModelFallbackOptions, CUSTOM_MODELS } from '../router/schema'
import { compactContext } from '../core/context'
import { callOptionsSchema } from '../core/schemas'
import { sanitizeToolCallInputs } from '../core/sanitize'
import { countConsecutiveToolSteps, shouldForceTextOnlyStep } from '../core/policy'
import { webSearchTool } from '../tools/web-search'
import type { AgentCallOptions, AgentExecutionContext, CreateAgentOptions } from '../types'

// Helper function to determine if a model is a custom model
function isCustomModel(model: string): boolean {
  return model.startsWith('custom/') || CUSTOM_MODELS.includes(model)
}

export function createAgent({
  tools,
  getAgentConfig,
  route,
  buildPrompt,
  resolveModel,
  onRouted,
  onStepFinish,
  onFinish,
}: CreateAgentOptions) {
  let maxSteps = 15

  return new ToolLoopAgent({
    model: DEFAULT_MODEL,
    callOptionsSchema,
    prepareCall: async ({ options, ...settings }) => {
      const modelOverride = (options as AgentCallOptions | undefined)?.model
      const customContext = (options as AgentCallOptions | undefined)?.context

      const [routerConfig, agentConfig] = await Promise.all([
        route(),
        getAgentConfig(),
      ])

      const effectiveMaxSteps = Math.round(routerConfig.maxSteps * agentConfig.maxStepsMultiplier)
      const routedModel = resolveModel?.(routerConfig, agentConfig)
        ?? agentConfig.defaultModel
        ?? DEFAULT_MODEL
      const effectiveModel = modelOverride ?? routedModel

      maxSteps = effectiveMaxSteps
      onRouted?.({ routerConfig, agentConfig, effectiveModel, effectiveMaxSteps })

      const executionContext: AgentExecutionContext = {
        mode: 'chat',
        effectiveModel,
        maxSteps: effectiveMaxSteps,
        routerConfig,
        agentConfig,
        customContext,
      }

      // For custom models, we need to import the provider dynamically
      let model: any = effectiveModel
      if (isCustomModel(effectiveModel)) {
        try {
          // Dynamic import to avoid circular dependencies
          const { getModel } = await import('../core/custom-models')
          model = getModel(effectiveModel)
        } catch (error) {
          log.warn('agent', `Failed to load custom model ${effectiveModel}, using gateway fallback`)
        }
      }

      return {
        ...settings,
        model,
        instructions: buildPrompt(routerConfig, agentConfig),
        tools: { ...tools, web_search: webSearchTool },
        stopWhen: stepCountIs(effectiveMaxSteps),
        providerOptions: getModelFallbackOptions(effectiveModel),
        experimental_context: executionContext,
      }
    },
    prepareStep: ({ stepNumber, messages, steps }) => {
      sanitizeToolCallInputs(messages)
      const normalizedSteps = (steps as StepResult<ToolSet>[] | undefined) ?? []
      const compactedMessages = compactContext({ messages, steps: normalizedSteps })

      if (shouldForceTextOnlyStep({ stepNumber, maxSteps, steps: normalizedSteps })) {
        log.info({ event: 'agent.force_text_step', step: stepNumber + 1, maxSteps, toolStreak: countConsecutiveToolSteps(normalizedSteps) })
        return {
          tools: {},
          toolChoice: 'none' as const,
          activeTools: [],
          ...(compactedMessages !== messages ? { messages: compactedMessages } : {}),
        }
      }

      if (compactedMessages !== messages) {
        return { messages: compactedMessages }
      }
    },
    onStepFinish,
    onFinish,
  })
}
