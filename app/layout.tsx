import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata: Metadata = {
  title: {
    default: 'Chr-3D',
    template: '%s | Docs',
  },
  description: 'A simple Nextra docs starter.',
}

// const banner = (
//   <Banner storageKey="docs-banner">
//     Chr-3D TUI 
//   </Banner>
// )

const navbar = (
  <Navbar
    logo={<b>Chr-3D</b>}
    projectLink="https://github.com/shuding/nextra"
  />
)

const footer = (
  <Footer>MIT {new Date().getFullYear()} © Chr-3D.</Footer>
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        {/* Add favicons, custom <meta>, etc. as children of <Head> */}
      </Head>
      <body>
        <Layout
          // banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
          // footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
