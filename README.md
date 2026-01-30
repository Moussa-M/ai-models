# AI Models Intelligence Grid

A comprehensive, interactive grid for exploring and comparing AI language models across different providers. Compare features, pricing, capabilities, and performance metrics for hundreds of AI models in one place.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://models.apertacodex.ai)

🌐 **Live Demo:** [models.apertacodex.ai](https://models.apertacodex.ai)

## ✨ Features

- 🤖 **Multi-Provider Support** - Compare models from OpenAI, Anthropic, Google, Meta, Mistral, and more
- 🔍 **Advanced Filtering** - Filter by provider, capabilities, pricing, context length, and more
- 💬 **AI-Powered Search** - Use natural language to find models (e.g., "show me cheap models with vision support")
- 📊 **Interactive Data Grid** - Sort, filter, and customize columns to your preference
- 💰 **Pricing Comparison** - Compare input/output token costs across models
- 📏 **Context Window Info** - See maximum input/output tokens for each model
- 🎨 **Dark Mode** - Eye-friendly dark theme support
- 💾 **Offline Support** - IndexedDB caching for improved performance
- 🔄 **Auto-Refresh** - Stay up-to-date with the latest model information
- 📱 **Responsive Design** - Works seamlessly on all devices

## 🎯 Use Cases

- **Model Selection** - Find the perfect AI model for your use case
- **Cost Analysis** - Compare pricing across providers to optimize costs
- **Feature Discovery** - Discover models with specific capabilities (vision, audio, function calling)
- **Performance Research** - Analyze context windows and token limits
- **Competitive Analysis** - Track the AI model landscape
- **Education** - Learn about different AI models and their capabilities

## 🚀 Getting Started

Simply visit [models.apertacodex.ai](https://models.apertacodex.ai) to start exploring!

### Search Examples

Try these AI-powered search queries:

```
"Find cheapest models with vision support"
"Show me Google models with large context"
"Which models support function calling?"
"Show Anthropic models under $5 per million tokens"
"Find models with reasoning capabilities"
```

## 🔍 Filter Options

### By Provider
- OpenAI
- Anthropic
- Google (Gemini)
- Meta (Llama)
- Mistral
- Cohere
- And many more...

### By Capability
- **Vision** - Image understanding
- **Audio** - Audio input/output
- **Function Calling** - Tool use and function execution
- **Reasoning** - Advanced reasoning capabilities
- **Web Search** - Built-in web search
- **Prompt Caching** - Efficient prompt reuse

### By Pricing
- Maximum input cost per token
- Maximum output cost per token
- Custom price ranges

### By Context Length
- Minimum input tokens
- Maximum context window
- Custom token ranges

## 📊 Column Information

### Model Details
- **Model ID** - Unique model identifier
- **Provider** - AI provider/company
- **Mode** - Completion type (chat, text, embedding)
- **Max Input** - Maximum input tokens
- **Max Output** - Maximum output tokens

### Pricing (per million tokens)
- **Input Cost** - Cost per million input tokens
- **Output Cost** - Cost per million output tokens
- **Cached Input** - Cost for cached prompts (if supported)

### Capabilities
- **Vision** - Image support
- **Audio** - Audio support
- **Functions** - Function calling
- **Reasoning** - Extended reasoning
- **Web Search** - Internet access
- **Caching** - Prompt caching

## 🛠️ Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **IndexedDB** - Client-side caching for performance
- **Tailwind CSS** - Modern, responsive styling
- **Vercel** - Fast, reliable hosting
- **AI Integration** - Natural language query processing

## 📈 Data Sources

Model data is aggregated from official provider APIs and documentation, including:
- OpenAI API
- Anthropic API
- Google AI Studio
- Meta AI
- Mistral API
- And more...

Data is automatically updated to ensure accuracy.

## 🎨 Customization

### Column Visibility
- Show/hide columns based on your needs
- Customize which capabilities to display
- Save preferences for future sessions

### Display Preferences
- Toggle between light and dark themes
- Adjust table density
- Configure auto-refresh intervals

### Filter Presets
- Save custom filter combinations
- Quick access to frequently used filters
- Share filter configurations

## 💾 Offline Support

The application uses IndexedDB to cache model data locally, providing:
- Faster load times
- Offline browsing capability
- Reduced bandwidth usage
- Seamless experience even with poor connectivity

## 🔄 Updates

Model data is automatically refreshed every 5 minutes when the app is active, ensuring you always have access to the latest information.

## 🤝 Contributing

Issues and pull requests are welcome! Feel free to contribute improvements or report bugs.

## 📄 License

MIT License

## 🔗 Related Projects

- [AK - API Key Manager](https://github.com/ApertaCodex/ak) - Secure API key management
- [VS Code Extension Builder](https://github.com/Moussa-M/vscode-extension-builder) - Build VS Code extensions with AI
- [SQL.js Playground](https://github.com/Moussa-M/sqljs) - Browser-based SQL playground

---

Built with ❤️ by [Moussa Mokhtari](https://github.com/Moussa-M)
