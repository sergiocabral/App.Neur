import { useConfig } from 'nextra-theme-docs'
import { useTheme } from 'next-themes'
import { type DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: function LogoComponent() {
    const { resolvedTheme } = useTheme()
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={resolvedTheme === 'dark' ? '/logo_w.svg' : '/logo.svg'}
          alt="Neur"
          width={24}
          height={24}
          style={{ borderRadius: '4px' }}
        />
        <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
          Neur
        </span>
      </div>
    )
  },
  faviconGlyph: '📚',
  project: {
    link: 'https://github.com/neurprojects'
  },
  docsRepositoryBase: 'https://github.com/neurprojects/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Neur'
    }
  },
  head: () => {
    const { title } = useConfig()
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={title ? title + ' – Neur' : 'Neur'} />
        <meta property="og:description" content="The Intelligent Copilot for Solana" />
      </>
    )
  },
  primaryHue: 210,
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} © <a href="https://neur.ai" target="_blank">Neur Agent</a>
      </span>
    )
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system',
    forcedTheme: undefined
  },
  navbar: {
    extraContent: (
      <>
        <a
          href="https://x.com/neur_sh"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginRight: '1rem', display: 'inline-flex', alignItems: 'center' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </>
    )
  }
}

export default config