import { buildMetadata } from '@/lib/seo';
import { GAME_PAGES } from '@/lib/table-games/pages';
import { TableGamePage } from '@/components/table-games/TableGamePage';

const g = GAME_PAGES['video-poker'];
export const metadata = buildMetadata({ title: g.titles, description: g.description, path: '/table-games/video-poker' });

export default function Page() {
  return <TableGamePage game="video-poker" />;
}
