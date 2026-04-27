// Minimal root layout required by Next.js.
// All real layout (html, body, fonts, providers) lives in app/[locale]/layout.tsx
// so that the <html lang> attribute can be set dynamically per locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
