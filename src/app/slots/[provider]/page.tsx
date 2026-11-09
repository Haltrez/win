import { permanentRedirect } from 'next/navigation';
import { getProviders } from '@/lib/data';

export const dynamicParams = false;
export function generateStaticParams() {
  return getProviders().map((p) => ({ provider: p.slug }));
}
/** /slots/[provider] is a natural URL to type; canonical hub lives at /providers/[provider]. */
export default async function Page({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  permanentRedirect(`/providers/${provider}`);
}
