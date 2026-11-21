'use client';
import dynamic from 'next/dynamic';
import type { CtaCasino } from '../DemoCta';

export type GameKey = 'blackjack' | 'roulette' | 'baccarat' | 'video-poker' | 'casino-holdem';
const Loading = () => <div className="tg tg-loading" aria-busy="true"><div className="tg-table"><div className="tg-felt"><p>Setting up the table…</p></div></div></div>;
/** Each game is its own lazy chunk – only the game on the page is downloaded (next/dynamic needs literal options). */
const Blackjack = dynamic(() => import('./Blackjack'), { ssr: false, loading: Loading });
const Roulette = dynamic(() => import('./Roulette'), { ssr: false, loading: Loading });
const Baccarat = dynamic(() => import('./Baccarat'), { ssr: false, loading: Loading });
const VideoPoker = dynamic(() => import('./VideoPoker'), { ssr: false, loading: Loading });
const CasinoHoldem = dynamic(() => import('./CasinoHoldem'), { ssr: false, loading: Loading });

export function TableGame({ game, casinos }: { game: GameKey; casinos: CtaCasino[] }) {
  switch (game) {
    case 'blackjack': return <Blackjack casinos={casinos} />;
    case 'roulette': return <Roulette casinos={casinos} />;
    case 'baccarat': return <Baccarat casinos={casinos} />;
    case 'video-poker': return <VideoPoker casinos={casinos} />;
    case 'casino-holdem': return <CasinoHoldem casinos={casinos} />;
  }
}
