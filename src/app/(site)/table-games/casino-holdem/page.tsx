import { buildMetadata } from '@/lib/seo';
import { GAME_PAGES } from '@/lib/table-games/pages';
import { TableGamePage } from '@/components/table-games/TableGamePage';

const g = GAME_PAGES['casino-holdem'];
export const metadata = buildMetadata({ title: g.titles, description: g.description, path: '/table-games/casino-holdem' });

export default function Page() {
  return <TableGamePage game="casino-holdem" />;
}
