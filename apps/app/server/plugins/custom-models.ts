export default defineNitroPlugin((nitroApp) => {
  // This plugin runs on the server side and can access environment variables
  // We'll use it to populate custom models in the runtime config
  
  const customModels: string[] = []
  
  // Extract custom models from environment variables
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CUSTOM_API_MODEL_')) {
      const providerName = key.replace('CUSTOM_API_MODEL_', '').toLowerCase()
      const modelName = value || `${providerName}-default`
      customModels.push(`custom/${modelName}`)
    }
  }
  
  // Log available custom models
  if (customModels.length > 0) {
    console.log(`[Custom Models] Loaded ${customModels.length} custom models:`, customModels)
  }
})