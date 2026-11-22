import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';
import { SITEMAP_IDS } from './sitemap';

const DISALLOW = ['/go/', '/api/', '/favorites', '/random', '/*?_rsc=', '/*&_rsc='];
/** AI search and assistant crawlers, allowed explicitly so the site can be cited in AI answers (see /llms.txt). */
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'meta-externalagent', 'DuckAssistBot', 'YouBot', 'cohere-ai'];

export default function robots(): MetadataRoute.Robots {
  if (SITE.noindex) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: [`${SITE.url}/sitemap.xml`, ...SITEMAP_IDS.map((id) => `${SITE.url}/sitemap/${id}.xml`)],
  };
}
