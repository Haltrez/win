import fs from 'node:fs';
import path from 'node:path';

export type BigWin = {
  id: string; amount: string; amountShort: string; game: string; maker: string; where: string; date: string; sortDate: string;
  type: 'online' | 'land-based'; stake: string; story: string; sources: { name: string; url: string }[];
};
/**
 * A clip we may show. Two allowed bases, enforced by the validator:
 *  - basis "embed": a YouTube video played through YouTube's own embed player, which the uploader has left
 *    enabled (checked via YouTube oEmbed on embedChecked). We never download or re-upload video.
 *  - basis "permission": the creator gave written permission (required for Twitch clips).
 */
export type Clip = {
  id: string; platform: 'youtube' | 'twitch'; videoId: string; title: string; streamer: string; channelUrl: string;
  slot?: string; winX?: number; date: string;
  basis: 'embed' | 'permission'; embedChecked?: string;
  permission?: { granted: true; by: string; on: string; how: string };
};

const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', f), 'utf8')) as T;
export const getBigWins = () => read<BigWin[]>('big-wins.json');
export const getClips = () => read<Clip[]>('clips.json').filter((c) => (c.basis === 'embed' && c.platform === 'youtube') || c.permission?.granted === true).sort((a, b) => b.date.localeCompare(a.date));
export const getClipsForSlot = (provider: string, slug: string) => getClips().filter((c) => c.slot === `${provider}/${slug}`);
