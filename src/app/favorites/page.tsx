import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FavoritesList } from '@/components/Favorites';

export const metadata = buildMetadata({ title: 'Your Favourite Slots', description: 'Slots you have saved on this device.', path: '/favorites', noindex: true });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Favourites', path: '/favorites' }]} />
      <h1>Your favourite slots</h1>
      <p className="muted small">Saved on this device only – no account needed.</p>
      <FavoritesList />
    </>
  );
}
