/** Rendert JSON-LD Structured Data im <head> via React 19 hoisting */

interface JsonLdProps {
  data: Record<string, unknown>;
}

// Verhindert Script-Tag-Injection: </script> im JSON bricht aus dem Tag aus
function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g,  '\\u003c')
    .replace(/>/g,  '\\u003e')
    .replace(/&/g,  '\\u0026');
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
