import { FEATURES } from '@/lib/config';
import type { Casino } from '@/lib/types';
import { CasinoModuleClient, type CasinoLabels } from './CasinoModuleClient';

/** Server gate: when real-money features are off, nothing (not even props) is sent to the browser. */
export function CasinoModule(props: { casinos: Casino[]; title: string; context: string; slotName?: string; t?: Partial<CasinoLabels> }) {
  if (!FEATURES.realMoney) return null;
  // Only the fields the cards render go to the browser: smaller page data, faster hydration, and the raw
  // affiliate URLs (`links`) stay on the server – every click goes through /go/.
  const casinos = props.casinos.map(({ links: _l, providers: _p, licenses: _li, terms: _t, rating: _r, minDeposit: _m, wagering: _w, sweeps: _s, ...c }) => c) as Casino[];
  return <CasinoModuleClient {...props} casinos={casinos} />;
}
