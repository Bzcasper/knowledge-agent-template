<script setup lang="ts">
const props = defineProps<{
  domain?: string
  label?: string
  icon?: string
  color?: string
}>()

const EXPERT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  jewelry: { label: '💎 Jewelry Expert', icon: '💎', color: 'text-amber-500' },
  diy_crafts: { label: '♻️ DIY Expert', icon: '♻️', color: 'text-green-500' },
  code_n8n: { label: '⚙️ Automation Expert', icon: '⚙️', color: 'text-blue-500' },
  pricing: { label: '📊 Pricing Expert', icon: '📊', color: 'text-purple-500' },
  social_content: { label: '🎬 Content Expert', icon: '🎬', color: 'text-pink-500' },
  general: { label: '🤖 Assistant', icon: '🤖', color: 'text-gray-500' },
}

const metadata = computed(() => {
  if (props.domain && EXPERT_LABELS[props.domain]) {
    return EXPERT_LABELS[props.domain]
  }
  return { label: props.label || 'Assistant', icon: props.icon || '🤖', color: props.color || 'text-gray-500' }
})
</script>

<template>
  <span 
    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-muted/50"
    :class="metadata.color"
  >
    <span>{{ metadata.icon }}</span>
    <span>{{ metadata.label }}</span>
  </span>
</template>