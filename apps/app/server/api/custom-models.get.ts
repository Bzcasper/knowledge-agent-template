export default defineEventHandler(() => {
  const customModels: string[] = []
  
  // Extract custom models from environment variables
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CUSTOM_API_MODEL_')) {
      const providerName = key.replace('CUSTOM_API_MODEL_', '').toLowerCase()
      const modelName = value || `${providerName}-default`
      customModels.push(`custom/${modelName}`)
    }
  }
  
  return {
    customModels,
  }
})