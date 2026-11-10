import fs from 'node:fs';
import path from 'node:path';

export type BigWin = {
  id: string; amount: string; amountShort: string; game: string; maker: string; where: string; date: string; sortDate: string;
  type: 'online' | 'land-based'; stake: string; story: string; sources: { name: string; url: string }[];
};
/**
 * A streamer clip we are allowed to show. Add entries to content/clips.json ONLY with the streamer's
 * written permission – the validator rejects clips without a permission record.
 */
export type Clip = {
  id: string; platform: 'youtube' | 'twitch'; videoId: string; title: string; streamer: string; channelUrl: string;
  slot?: string; winX?: number; date: string;
  permission: { granted: true; by: string; on: string; how: string };
};

const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', f), 'utf8')) as T;
export const getBigWins = () => read<BigWin[]>('big-wins.json');
export const getClips = () => read<Clip[]>('clips.json').filter((c) => c.permission?.granted === true).sort((a, b) => b.date.localeCompare(a.date));
export const getClipsForSlot = (provider: string, slug: string) => getClips().filter((c) => c.slot === `${provider}/${slug}`);
