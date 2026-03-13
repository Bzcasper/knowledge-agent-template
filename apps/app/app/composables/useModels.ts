export function formatModelName(modelId: string): string {
  const acronyms = ['gpt', 'ai', 'glm', 'api', 'gemini', 'claude', 'qwen'] // words that should be uppercase
  const isCustom = modelId.startsWith('custom/')
  const modelName = isCustom ? modelId.replace('custom/', '') : (modelId.split('/')[1] || modelId)

  return modelName
    .split(/[-_]/)
    .map((word) => {
      const lowerWord = word.toLowerCase()
      return acronyms.includes(lowerWord)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function useModels() {
  const defaultModels = [
    'google/gemini-3-flash',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-opus-4.6',
  ]

  // Custom models - initially hardcoded for SSR, will be updated from API
  const customModels = ref([
    'custom/bitterbot-default',
    'custom/gemini-3.1-flash-image-preview',
    'custom/glm-5-thinking',
    'custom/grok-4.20-beta',
    'custom/google/gemini-3-flash-preview',
    'custom/qwen3.5-plus',
    'custom/z-image-turbo',
  ])

  const models = computed(() => [...defaultModels, ...customModels.value])

  const model = useCookie<string>('model', { default: () => 'anthropic/claude-sonnet-4.6' })

  // Fetch custom models from API on client side
  if (process.client) {
    useAsyncData('custom-models', () => $fetch('/api/custom-models')
      .then(response => {
        customModels.value = response.customModels
      })
      .catch(err => console.error('Failed to fetch custom models:', err))
    )
  }

  return {
    models,
    model,
    formatModelName,
  }
}
