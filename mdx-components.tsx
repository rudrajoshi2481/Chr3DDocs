import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'

// Get the default MDX components from the docs theme
const themeComponents = getThemeComponents()

// Merge components
export function useMDXComponents(components?: Record<string, unknown>) {
  return {
    ...themeComponents,
    ...components,
  }
}
