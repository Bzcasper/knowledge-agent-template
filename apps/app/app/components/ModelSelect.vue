<script setup lang="ts">
const { model, models, formatModelName } = useModels()

const providerIcons: Record<string, string> = {
  openai: 'i-simple-icons-openai',
  anthropic: 'i-simple-icons-anthropic',
  google: 'i-simple-icons-google',
  moonshotai: 'i-lucide-moon', // Moonshot doesn't have a simple-icons entry
  custom: 'i-lucide-robot', // Custom models icon
}

function getProviderIcon(modelId: string) {
  const [provider = ''] = modelId.split('/')
  
  // Handle custom models (format: custom/model-name)
  if (provider === 'custom') {
    return providerIcons.custom
  }
  
  return providerIcons[provider] || 'i-custom-bot'
}

// Group models by provider
const groupedModels = computed(() => {
  const groups: Record<string, typeof models> = {}
  
  models.forEach(modelId => {
    const [provider] = modelId.split('/')
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(modelId)
  })
  
  return groups
})

const items = computed(() => models.map(m => ({
  label: formatModelName(m),
  value: m,
  icon: getProviderIcon(m),
  group: m.startsWith('custom/') ? 'Custom' : m.split('/')[0]?.charAt(0).toUpperCase() + m.split('/')[0]?.slice(1),
})))
</script>

<template>
  <USelectMenu
    v-model="model"
    :items
    size="sm"
    :icon="getProviderIcon(model)"
    variant="ghost"
    value-key="value"
    class="hover:bg-default focus:bg-default data-[state=open]:bg-default"
    :ui="{
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
      content: 'w-auto min-w-max max-h-80'
    }"
  >
    <template #label>
      <span class="truncate">{{ formatModelName(model) }}</span>
    </template>
  </USelectMenu>
</template>
