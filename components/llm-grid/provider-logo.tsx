interface ProviderLogoProps {
  provider: string
  className?: string
}

export function ProviderLogo({ provider, className = "w-4 h-4" }: ProviderLogoProps) {
  const p = provider.toLowerCase()

  if (p.includes("openai")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#10a37f">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    )
  }

  if (p.includes("anthropic")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#d97757">
        <path d="M17.304 3.541h-3.672l6.696 16.918H24l-6.696-16.918Zm-10.608 0L0 20.459h3.792l1.368-3.553h7.008l1.368 3.553h3.792L10.608 3.541H6.696Zm-.216 10.777L8.688 8.42l2.208 5.898H6.48Z" />
      </svg>
    )
  }

  if (p.includes("google") || p.includes("vertex") || p.includes("gemini")) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    )
  }

  if (p.includes("together")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#7c3aed">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16 8 8 0 010-16zm0 2a6 6 0 100 12 6 6 0 000-12z" />
      </svg>
    )
  }

  if (p.includes("mistral")) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <rect x="0" y="0" width="5" height="5" fill="#f97316" />
        <rect x="19" y="0" width="5" height="5" fill="#000" />
        <rect x="0" y="6" width="5" height="5" fill="#f97316" />
        <rect x="6" y="6" width="5" height="5" fill="#f97316" />
        <rect x="13" y="6" width="5" height="5" fill="#000" />
        <rect x="19" y="6" width="5" height="5" fill="#f97316" />
        <rect x="0" y="13" width="5" height="5" fill="#f97316" />
        <rect x="6" y="13" width="5" height="5" fill="#000" />
        <rect x="13" y="13" width="5" height="5" fill="#f97316" />
        <rect x="19" y="13" width="5" height="5" fill="#000" />
        <rect x="0" y="19" width="5" height="5" fill="#f97316" />
        <rect x="19" y="19" width="5" height="5" fill="#f97316" />
      </svg>
    )
  }

  if (p.includes("cohere")) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#39594D"
          d="M8.667 4C4.373 4 0 6.933 0 12.8c0 3.947 2.933 7.2 6.56 7.2 1.92 0 3.947-.427 6.027-1.493 2.24-1.12 4.693-2.987 7.413-5.6.64-.64.96-1.44.96-2.24a3.2 3.2 0 0 0-3.2-3.2c-.907 0-1.813.373-2.453 1.067l-1.867 2.027c-.853.907-2.027 1.44-3.307 1.44-2.453 0-4.48-2.027-4.48-4.533C5.653 5.28 6.987 4 8.667 4z"
        />
        <path
          fill="#D18EE2"
          d="M6.56 20c-4.08 0-6.56-3.68-6.56-7.2C0 6.933 4.373 4 8.667 4c-1.68 0-3.014 1.28-3.014 3.467 0 2.506 2.027 4.533 4.48 4.533 1.28 0 2.454-.533 3.307-1.44l1.867-2.027c.64-.694 1.546-1.067 2.453-1.067a3.2 3.2 0 0 1 3.2 3.2c0 .8-.32 1.6-.96 2.24-2.72 2.613-5.173 4.48-7.413 5.6C10.507 19.573 8.48 20 6.56 20z"
        />
      </svg>
    )
  }

  if (p.includes("bedrock") || p.includes("amazon") || p.includes("aws")) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#FF9900"
          d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.41 4.28L12 12.74l-7.41-4.28L12 4.18zM4 9.04l7 4.04v7.88l-7-3.5V9.04zm9 11.92v-7.88l7-4.04v8.42l-7 3.5z"
        />
      </svg>
    )
  }

  if (p.includes("deepseek")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0066FF">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    )
  }

  if (p.includes("dashscope") || p.includes("qwen") || p.includes("alibaba")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#FF6A00">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14a6 6 0 100 12 6 6 0 000-12z" />
      </svg>
    )
  }

  if (p.includes("yi")) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="#2563eb"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (p.includes("xai") || p.includes("grok")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#000000">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }

  if (p.includes("azure")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0078D4">
        <path d="M13.05 4.24L6.56 18.05 2 18l5.09-13.8zm.83 1.13l3.12 5.6-4.36 6.29 6.37.01L22 18.04z" />
      </svg>
    )
  }

  if (p.includes("groq")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#F55036">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="5" fill="white" />
      </svg>
    )
  }

  if (p.includes("perplexity")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#20808D">
        <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.5L18 8v8l-6 3-6-3V8l6-3.5z" />
      </svg>
    )
  }

  if (p.includes("replicate")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#000">
        <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
      </svg>
    )
  }

  if (p.includes("huggingface") || p.includes("hugging")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#FFD21E">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S7 10.83 7 10s.67-1.5 1.5-1.5zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM12 18c-2.33 0-4.32-1.45-5.12-3.5h1.67c.69 1.19 1.97 2 3.45 2s2.76-.81 3.45-2h1.67c-.8 2.05-2.79 3.5-5.12 3.5z" />
      </svg>
    )
  }

  if (p.includes("fireworks")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#FF4500">
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>
    )
  }

  if (p.includes("anyscale")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#6366F1">
        <path d="M12 2l10 6v8l-10 6-10-6V8l10-6zm0 4L6 9v6l6 3.5 6-3.5V9l-6-3z" />
      </svg>
    )
  }

  if (p.includes("ollama")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#888">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" fill="white" />
        <circle cx="12" cy="12" r="3" fill="#888" />
      </svg>
    )
  }

  if (p.includes("meta") || p.includes("llama")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0668E1">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
      </svg>
    )
  }

  if (p.includes("voyage")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2L4 5v6.5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6z" />
      </svg>
    )
  }

  if (p.includes("cerebras")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#14B8A6">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }

  if (p.includes("ai21")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#8B5CF6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    )
  }

  // Default fallback - gray globe
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#6b7280">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  )
}
