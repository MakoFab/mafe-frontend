import Script from 'next/script'

// Reemplaza este valor con tu ID de medición real de GA4 (G-XXXXXXXXXX)
// Puedes también leerlo desde una variable de entorno:
//   process.env.NEXT_PUBLIC_GA_ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

export default function Analytics() {
  // No carga nada si no hay ID configurado
  if (!GA_ID) return null

  return (
    <>
      {/* Carga el script de Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* Inicializa GA4 */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
