import { FEATURES } from '@/lib/config';
import type { Casino } from '@/lib/types';
import { CasinoModuleClient } from './CasinoModuleClient';

/** Server gate: when real-money features are off, nothing (not even props) is sent to the browser. */
export function CasinoModule(props: { casinos: Casino[]; title: string; context: string; slotName?: string }) {
  if (!FEATURES.realMoney) return null;
  return <CasinoModuleClient {...props} />;
}
