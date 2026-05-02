import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Nanum_Pen_Script } from 'next/font/google'
import 'nextra-theme-docs/style.css'

const nanumPenScript = Nanum_Pen_Script({
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Chr-3D',
    template: '%s | Docs',
  },
  description: 'Chr3D documentation for Hi-C, ChIA-PET, and HiChIP pipelines.',
}

// const banner = (
//   <Banner storageKey="docs-banner">
//     Chr-3D TUI 
//   </Banner>
// )

const navbar = (
  <Navbar
    logo={
      <span className={nanumPenScript.className} style={{ fontSize: '32px' }}>
        Chr 3D
      </span>
    }
    projectLink="https://github.com/rudrajoshi2481/Chr3DDocs"
  />
)

const footer = (
  <Footer>MIT {new Date().getFullYear()} © Chr3D.</Footer>
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
          docsRepositoryBase="https://github.com/rudrajoshi2481/Chr3DDocs/tree/main"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          // footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
