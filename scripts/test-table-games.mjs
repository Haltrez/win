#!/usr/bin/env node
/**
 * Unit tests for the free table games' maths (src/lib/table-games).
 * The engine is TypeScript; this compiles it to CommonJS in a temp folder with the project's tsc, then runs
 * plain assertions – no test framework needed.  Run: node scripts/test-table-games.mjs
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'table-games-'));
const src = path.resolve('src/lib/table-games');
const files = fs.readdirSync(src).filter((f) => f.endsWith('.ts')).map((f) => path.join(src, f));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), ...files, '--outDir', out, '--module', 'commonjs', '--target', 'es2022', '--moduleResolution', 'node', '--skipLibCheck', '--strict', '--esModuleInterop'], { stdio: 'inherit' });
const load = (m) => require(path.join(out, `${m}.js`));

const cards = load('cards'), bj = load('blackjack'), side = load('blackjack-side'), rl = load('roulette'), bac = load('baccarat'), poker = load('poker'), vp = load('video-poker'), ch = load('casino-holdem'), rng = load('rng');
const { parseCards, parseCard } = cards;

let passed = 0, failed = 0;
const eq = (a, b, msg) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (ok) passed++; else { failed++; console.error(`✗ ${msg}\n   expected ${JSON.stringify(b)}\n   got      ${JSON.stringify(a)}`); } };
const ok = (c, msg) => eq(Boolean(c), true, msg);
const near = (a, b, tol, msg) => { if (Math.abs(a - b) <= tol) passed++; else { failed++; console.error(`✗ ${msg}: ${a} not within ${tol} of ${b}`); } };

/* ---------------------------------------------------------------- RNG */
{
  const counts = new Array(37).fill(0);
  for (let i = 0; i < 37000; i++) counts[rng.randomInt(37)]++;
  ok(counts.every((c) => c > 800 && c < 1200), 'randomInt(37) is roughly uniform over 37k draws');
  ok(!counts.includes(0), 'every pocket is reachable');
  const d = cards.freshDeck(); eq(d.length, 52, 'fresh deck has 52 cards'); eq(new Set(d.map(cards.cardId)).size, 52, 'all 52 distinct');
  const shoe = new cards.Shoe(6); eq(shoe.remaining, 312, '6-deck shoe has 312 cards');
}

/* ---------------------------------------------------------------- Blackjack */
{
  const hv = (s) => bj.handValue(parseCards(s));
  eq(hv('AS KD'), { total: 21, soft: true }, 'A-K is soft 21');
  eq(hv('AS AD'), { total: 12, soft: true }, 'A-A is soft 12');
  eq(hv('AS 6D 10C'), { total: 17, soft: false }, 'A-6-10 is hard 17');
  eq(hv('KS QD 5C'), { total: 25, soft: false }, 'K-Q-5 busts at 25');
  ok(bj.isBlackjack(parseCards('AS JD')), 'A-J is blackjack');
  ok(!bj.isBlackjack(parseCards('AS 5D 5C')), 'three-card 21 is not blackjack');

  // settlement
  const st = (hands, dealer) => bj.settle({ phase: 'dealer', hands: hands.map((h, i) => ({ cards: parseCards(h.c), bet: h.bet ?? 10, done: true, doubled: false, fromSplit: h.split ?? false, seat: i })), active: 0, dealer: parseCards(dealer), returned: 0, staked: 0 });
  eq(st([{ c: 'AS KD' }], '10S 7D').returned, 25, 'blackjack pays 3:2 (10 → 25 back)');
  eq(st([{ c: 'AS KD' }], 'AD KS').returned, 10, 'blackjack vs blackjack pushes');
  eq(st([{ c: '10S 9D' }], 'AD KS').returned, 0, '19 loses to dealer blackjack');
  eq(st([{ c: '10S 9D' }], '10D 8S').returned, 20, '19 beats 18 and pays 1:1');
  eq(st([{ c: '10S 9D' }], '10D 9S').returned, 10, '19 vs 19 pushes');
  eq(st([{ c: '10S 6D 9C' }], '10D 9S').returned, 0, 'bust loses even when dealer would have lost');
  eq(st([{ c: '10S 6D' }], '10D 6S 9C').returned, 20, 'dealer bust pays');
  eq(st([{ c: 'AS KD', split: true }], '10D 7S').returned, 20, 'A-10 after a split is 21, not blackjack: pays 1:1');
  eq(st([{ c: '10S 9D', bet: 20 }, { c: '10S 5D', bet: 10 }], '10D 8S').returned, 40, 'two hands settle independently');

  // dealer stands on soft 17: a fixed shoe where dealer draws A,6
  const fake = (seq) => { const q = parseCards(seq); return { needsShuffle: false, reshuffle() {}, draw: () => q.shift() }; };
  // deal order: player, dealer, player, dealer
  let s = bj.deal(fake('10S AD 8C 6S 5D'), 10); // player 18, dealer A-6 (soft 17)
  s = bj.stand(fake('5D'), s);
  eq(s.dealer.length, 2, 'dealer stands on soft 17 (draws no card)');
  eq(s.hands[0].result, 'win', 'player 18 beats soft 17');
  s = bj.deal(fake('10S 10D 6C 6S 5D 9D'), 10); // player 16, dealer 16 → draws 5 → 21
  s = bj.stand(fake('5D 9D'), s);
  eq(s.dealer.length, 3, 'dealer draws on 16');
  eq(bj.handValue(s.dealer).total, 21, 'dealer makes 21');
  // split up to three hands, double after split, split aces get one card
  s = bj.deal(fake('8S 5D 8C 9S'), 10);
  ok(bj.canSplit(s), 'can split 8-8');
  s = bj.split(fake('8D 8H 2C 3C'), s); // first hand gets 8D → 8-8 again
  ok(bj.canSplit(s), 'can re-split to a third hand');
  s = bj.split(fake('8H 2C 3C'), s);
  eq(s.hands.length, 3, 'three hands after two splits');
  ok(!bj.canSplit(s), 'no fourth hand');
  ok(bj.canDouble(s), 'double after split allowed');
  eq(s.staked, 30, 'each split adds one bet');
  s = bj.deal(fake('AS 5D AC 9S'), 10);
  s = bj.split(fake('KD QD 4C'), s);
  eq(s.phase, 'settled', 'split aces take one card each and the round ends');
  eq(s.hands.map((h) => h.cards.length), [2, 2], 'each split ace has exactly two cards');
  eq(s.returned, 40, 'A-K and A-Q after split pay 1:1 each (not 3:2) vs dealer 14→ must draw: dealer 5-9-4 = 18 → both 21s win');

  // multiple seats: deal order seat1, seat2, dealer, seat1, seat2, dealer
  s = bj.dealSeats(fake('2S 3S 10D 4S 5S 7D 9C 9H 8C'), [10, 20]);
  eq(s.hands.map((h) => cards.cardId(h.cards[0]) + cards.cardId(h.cards[1])), ['2S4S', '3S5S'], 'two seats dealt round the table');
  eq(s.dealer.map(cards.cardId), ['10D', '7D'], 'dealer gets the third and sixth cards');
  eq(s.staked, 30, 'seat bets add up');
  s = bj.stand(fake('9C 9H 8C'), s); eq(s.active, 1, 'standing on seat 1 moves to seat 2');
  s = bj.stand(fake('9C 9H 8C'), s); eq(s.phase, 'settled', 'both seats stood → settled');
  eq(s.hands.map((h) => h.result), ['lose', 'lose'], 'both low hands lose to dealer 17');
  s = bj.dealSeats(fake('AS 5S 10D KS 6S 7D 9C'), [10, 20]); // seat 1 blackjack, seat 2 11
  eq(s.hands[0].done, true, 'seat 1 natural is done at once'); eq(s.active, 1, 'play starts at seat 2');
  s = bj.dealSeats(fake('AS 5S AD KS 6S KD'), [10, 20]); // dealer blackjack ends everything
  eq(s.phase, 'settled', 'dealer blackjack settles every seat'); eq(s.returned, 10, 'seat 1 natural pushes, seat 2 loses');
  // split limit is per seat
  s = bj.dealSeats(fake('8S 2S 5D 8C 3S 9S'), [10, 10]);
  s = bj.split(fake('8D 8H 8C 7C 7D'), s); s = bj.split(fake('8H 8C 7C 7D'), s);
  eq(s.hands.filter((h) => h.seat === 0).length, 3, 'seat 1 split to three hands');
  ok(!bj.canSplit(s), 'seat 1 cannot split a fourth time');
  eq(s.hands.length, 4, 'seat 2 untouched');
  let threw = false; try { bj.dealSeats(fake('AS'), [1, 1, 1, 1]); } catch { threw = true; } ok(threw, 'four seats refused');

  // basic strategy spot checks (6 decks, S17, DAS)
  const adv = (hand, up, o = { canSplit: true, canDouble: true }) => bj.basicStrategy(parseCards(hand), parseCard(up), o).action;
  eq(adv('8S 8D', '10S'), 'split', 'always split 8s');
  eq(adv('AS AD', '10S'), 'split', 'always split aces');
  eq(adv('10S 10D', '6S'), 'stand', 'never split 10s');
  eq(adv('5S 5D', '6S'), 'double', '5-5 is a hard 10: double vs 6');
  eq(adv('5S 5D', '10S'), 'hit', '5-5 vs 10: hit');
  eq(adv('9S 9D', '7S'), 'stand', '9-9 vs 7: stand');
  eq(adv('9S 9D', '8S'), 'split', '9-9 vs 8: split');
  eq(adv('4S 4D', '5S'), 'split', '4-4 vs 5 with DAS: split');
  eq(adv('4S 4D', '7S'), 'hit', '4-4 vs 7: hit');
  eq(adv('AS 6D', '10S'), 'hit', 'soft 17 vs 10: hit');
  eq(adv('AS 7D', '9S'), 'hit', 'soft 18 vs 9: hit');
  eq(adv('AS 7D', '2S'), 'stand', 'soft 18 vs 2: stand');
  eq(adv('AS 7D', '6S'), 'double', 'soft 18 vs 6: double');
  eq(adv('AS 7D', '6S', { canSplit: false, canDouble: false }), 'stand', 'soft 18 vs 6 with no double: stand');
  eq(adv('AS 8D', '6S'), 'stand', 'soft 19 vs 6: stand (S17)');
  eq(adv('2S 3D 6C', '2S', { canSplit: false, canDouble: false }), 'hit', 'hard 11 after 3 cards can\'t double: hit');
  eq(adv('6S 5D', 'AS'), 'hit', '11 vs ace: hit under S17');
  eq(adv('6S 5D', '10S'), 'double', '11 vs 10: double');
  eq(adv('10S 2D', '4S'), 'stand', '12 vs 4: stand');
  eq(adv('10S 2D', '3S'), 'hit', '12 vs 3: hit');
  eq(adv('10S 6D', '7S'), 'hit', '16 vs 7: hit');
  eq(adv('10S 6D', '6S'), 'stand', '16 vs 6: stand');
  eq(adv('AS AD', '10S', { canSplit: false, canDouble: true }), 'hit', 'A-A with no split allowed is soft 12: hit');
  eq(adv('AS 4D', '4S'), 'double', 'soft 15 vs 4: double');
  eq(adv('AS 2D', '4S'), 'hit', 'soft 13 vs 4: hit');
}

/* ---------------------------------------------------------------- Blackjack side bets */
{
  const s3 = (s) => { const c = parseCards(s); const r = side.evaluate21p3(c[0], c[1], c[2]); return r ? r.pays : 0; };
  eq(s3('7S 7S 7S'), 100, '21+3 suited trips 100:1');
  eq(s3('7S 7D 7C'), 30, '21+3 three of a kind 30:1');
  eq(s3('5H 6H 7H'), 40, '21+3 straight flush 40:1');
  eq(s3('AS 2S 3S'), 40, '21+3 A-2-3 suited is a straight flush');
  eq(s3('QS KS AS'), 40, '21+3 Q-K-A suited is a straight flush');
  eq(s3('5H 6D 7H'), 10, '21+3 straight 10:1');
  eq(s3('KS AD 2C'), 0, '21+3 K-A-2 is not a straight');
  eq(s3('2H 9H KH'), 5, '21+3 flush 5:1');
  eq(s3('2H 9D KC'), 0, '21+3 nothing');
  const pp = (s) => { const c = parseCards(s); const r = side.evaluatePerfectPairs(c[0], c[1]); return r ? r.pays : 0; };
  eq(pp('8S 8S'), 25, 'perfect pair 25:1'); eq(pp('8S 8C'), 12, 'coloured pair (black) 12:1'); eq(pp('8H 8D'), 12, 'coloured pair (red) 12:1'); eq(pp('8H 8S'), 6, 'mixed pair 6:1'); eq(pp('8H 9H'), 0, 'no pair');
  // exact house edges for a 6-deck shoe, cross-checked by hand: PP = 1 - (26*5 + 13*6 + 7*12)/311
  near(side.edgePerfectPairs(6), 100 * (1 - (26 * 5 + 13 * 6 + 7 * 12) / 311), 0.01, 'Perfect Pairs 6-deck edge = 6.11%');
  near(side.EDGE_PP, 6.11, 0.01, 'Perfect Pairs published 6-deck figure');
  // 21+3: hand-counted combinations of a 312-card shoe
  const C3 = (312 * 311 * 310) / 6, suitedTrips = 52 * 20, sf = 12 * 4 * 216, trips = 13 * (2024 - 80), str = 12 * (13824 - 864), fl = 4 * (76076 - 2592 - 260);
  near(side.edge21p3(6), 100 * (1 - (suitedTrips * 101 + sf * 41 + trips * 31 + str * 11 + fl * 6) / C3), 0.01, '21+3 6-deck edge = 4.63%');
  near(side.EDGE_21P3, 4.63, 0.01, '21+3 published 6-deck figure');
  near(side.edgePerfectPairs(8), 4.10, 0.01, 'Perfect Pairs 8-deck edge = 4.10% (the commonly quoted figure)');
}

/* ---------------------------------------------------------------- Roulette */
{
  eq(rl.WHEEL_ORDER.length, 37, '37 pockets');
  eq(new Set(rl.WHEEL_ORDER).size, 37, 'each number once');
  eq(rl.pocketColor(0), 'green', '0 is green'); eq(rl.pocketColor(1), 'red', '1 is red'); eq(rl.pocketColor(2), 'black', '2 is black'); eq(rl.pocketColor(19), 'red', '19 is red'); eq(rl.pocketColor(10), 'black', '10 is black');
  const bet = (kind, anchor, amount) => ({ ...rl.makeBet(kind, anchor), amount });
  eq(rl.settleBets([bet('straight', [17], 1)], 17).returned, 36, 'straight pays 35:1 (36 back)');
  eq(rl.settleBets([bet('straight', [17], 1)], 18).returned, 0, 'losing straight returns 0');
  eq(rl.settleBets([bet('split', [17, 18], 2)], 18).returned, 36, 'split pays 17:1');
  eq(rl.settleBets([bet('street', [1], 1)], 3).returned, 12, 'street pays 11:1');
  eq(rl.settleBets([bet('corner', [1], 1)], 5).returned, 9, 'corner pays 8:1');
  eq(rl.settleBets([bet('line', [1], 1)], 6).returned, 6, 'line pays 5:1');
  eq(rl.settleBets([bet('dozen', [1], 1)], 24).returned, 3, '2nd dozen pays 2:1');
  eq(rl.settleBets([bet('column', [0], 1)], 34).returned, 3, 'column 1 pays 2:1');
  eq(rl.settleBets([bet('red', [], 5)], 32).returned, 10, 'red pays 1:1');
  eq(rl.settleBets([bet('red', [], 5)], 0).returned, 0, 'zero beats every outside bet');
  eq(rl.settleBets([bet('even', [], 5)], 0).returned, 0, 'zero is not even');
  eq(rl.settleBets([bet('low', [], 5), bet('high', [], 5)], 18).returned, 10, '18 is low');
  for (const k of Object.keys(rl.PAYS)) near(rl.expectedReturn(k), 36 / 37, 1e-9, `${k}: expected return 36/37 (2.70% edge)`);
  eq(rl.makeBet('column', [2]).numbers, [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], 'third column numbers');
  eq(rl.makeBet('black').numbers.length, 18, '18 black numbers');
}

/* ---------------------------------------------------------------- Baccarat */
{
  eq(bac.bacTotal(parseCards('KS 9D')), 9, 'K-9 = 9');
  eq(bac.bacTotal(parseCards('7S 8D')), 5, '7-8 = 15 → 5');
  eq(bac.bacTotal(parseCards('AS AD')), 2, 'aces count 1');
  // Third-card tableau
  eq(bac.bankerDraws(3, 8), false, 'banker 3 stands when player drew an 8');
  eq(bac.bankerDraws(3, 9), true, 'banker 3 draws on player 9');
  eq(bac.bankerDraws(4, 1), false, 'banker 4 stands on player 1');
  eq(bac.bankerDraws(4, 2), true, 'banker 4 draws on player 2');
  eq(bac.bankerDraws(5, 3), false, 'banker 5 stands on player 3');
  eq(bac.bankerDraws(5, 4), true, 'banker 5 draws on player 4');
  eq(bac.bankerDraws(6, 5), false, 'banker 6 stands on player 5');
  eq(bac.bankerDraws(6, 6), true, 'banker 6 draws on player 6');
  eq(bac.bankerDraws(7, 6), false, 'banker 7 always stands');
  eq(bac.bankerDraws(6, null), false, 'banker 6 stands when player stood');
  eq(bac.bankerDraws(5, null), true, 'banker 5 draws when player stood');
  eq(bac.bankerDraws(0, 0), true, 'banker 0 always draws');
  const coup = (seq) => { const q = parseCards(seq); return bac.playCoup(() => q.shift()); };
  let r = coup('9S 2D KC 5H'); eq([r.playerTotal, r.bankerTotal, r.natural, r.winner], [9, 7, true, 'player'], 'natural 9 ends the coup');
  // player 2+3 = 5 draws an 8 → 13 → 3; banker 2+4 = 6 stands against a third-card 8 (draws only on 6/7). Banker 6 beats 3.
  r = coup('2S 2D 3C 4H 8D 9D'); eq([r.player.length, r.banker.length, r.playerTotal, r.bankerTotal, r.winner], [3, 2, 3, 6, 'banker'], 'tableau: player draws, banker 6 stands on third-card 8');
  r = coup('6S 6D 10C 10H'); eq([r.playerTotal, r.bankerTotal, r.winner], [6, 6, 'tie'], '6 vs 6 both stand → tie');
  eq(bac.settleBaccarat({ player: 10, banker: 0, tie: 0 }, 'player'), 20, 'player pays 1:1');
  eq(bac.settleBaccarat({ player: 0, banker: 20, tie: 0 }, 'banker'), 39, 'banker pays 0.95:1');
  eq(bac.settleBaccarat({ player: 0, banker: 0, tie: 5 }, 'tie'), 45, 'tie pays 8:1');
  eq(bac.settleBaccarat({ player: 10, banker: 10, tie: 0 }, 'tie'), 20, 'player/banker push on a tie');
  eq(bac.settleBaccarat({ player: 10, banker: 10, tie: 0 }, 'banker'), 19.5, 'mixed bets settle separately');
  // Simulated edge over many coups stays in a plausible band
  let net = 0, n = 200000; const shoe = new cards.Shoe(8);
  for (let i = 0; i < n; i++) { const c = bac.dealCoup(shoe); net += bac.settleBaccarat({ player: 0, banker: 1, tie: 0 }, c.winner) - 1; }
  near(-net / n * 100, 1.06, 0.35, `banker house edge over ${n} coups ≈ 1.06%`);
}

/* ---------------------------------------------------------------- Poker evaluator */
{
  const cat = (s) => poker.evaluateBest(parseCards(s)).category;
  eq(cat('AS KS QS JS 10S'), 'royal-flush', 'royal flush');
  eq(cat('9S 8S 7S 6S 5S'), 'straight-flush', 'straight flush');
  eq(cat('AS 2S 3S 4S 5S'), 'straight-flush', 'wheel straight flush');
  eq(cat('9S 9D 9C 9H 2S'), 'four-of-a-kind', 'quads');
  eq(cat('9S 9D 9C 2H 2S'), 'full-house', 'full house');
  eq(cat('2S 9S 4S JS 7S'), 'flush', 'flush');
  eq(cat('AS 2D 3C 4H 5S'), 'straight', 'wheel');
  eq(cat('10S JD QC KH AS'), 'straight', 'broadway');
  eq(cat('KS AD 2C 3H 4S'), 'high-card', 'K-A-2-3-4 is not a straight');
  eq(cat('9S 9D 9C 3H 2S'), 'three-of-a-kind', 'trips');
  eq(cat('9S 9D 3C 3H 2S'), 'two-pair', 'two pair');
  eq(cat('JS JD 3C 4H 2S'), 'pair', 'pair');
  eq(cat('KS JD 3C 4H 2S'), 'high-card', 'high card');
  const sc = (s) => poker.evaluateBest(parseCards(s)).score;
  ok(sc('AS AD 3C 4H 2S') > sc('KS KD QC JH 9S'), 'pair of aces beats pair of kings');
  ok(sc('KS KD AC 4H 2S') > sc('KS KD QC JH 9S'), 'kicker decides equal pairs');
  ok(sc('2S 2D 2C 3H 3S') > sc('AS AD KC KH KS') === false, 'aces full beats deuces full');
  ok(sc('6S 5D 4C 3H 2S') > sc('AS 2D 3C 4H 5S'), '6-high straight beats the wheel');
  ok(sc('2S 2D 3C 3H 4S') > sc('AS AD KC 4H 2S'), 'two pair beats one pair');
  eq(sc('AS AD 3C 4H 2S'), sc('AH AC 3D 4S 2C'), 'suits do not matter for score');
  eq(poker.evaluateBest(parseCards('AS KS QS JS 10S 2D 3C')).category, 'royal-flush', 'best of 7 finds the royal');
  eq(poker.evaluateBest(parseCards('2S 2D 5C 5H 5S 9D 9C')).category, 'full-house', 'best of 7: 5s full of 9s');
  eq(poker.evaluateBest(parseCards('2S 2D 5C 5H 5S 9D 9C')).kickers, [5, 9], 'full house picks the higher pair');
}

/* ---------------------------------------------------------------- Video poker 9/6 */
{
  const pay = (s) => vp.vpPayout(parseCards(s), 5);
  eq(pay('AS KS QS JS 10S'), 4000, 'royal pays 800×5 at max coins');
  eq(vp.vpPayout(parseCards('AS KS QS JS 10S'), 1), 250, 'royal pays 250 with one coin');
  eq(pay('9S 8S 7S 6S 5S'), 250, 'straight flush 50');
  eq(pay('9S 9D 9C 9H 2S'), 125, 'quads 25');
  eq(pay('9S 9D 9C 2H 2S'), 45, 'full house 9');
  eq(pay('2S 9S 4S JS 7S'), 30, 'flush 6');
  eq(pay('AS 2D 3C 4H 5S'), 20, 'straight 4');
  eq(pay('9S 9D 9C 3H 2S'), 15, 'trips 3');
  eq(pay('9S 9D 3C 3H 2S'), 10, 'two pair 2');
  eq(pay('JS JD 3C 4H 2S'), 5, 'jacks pay 1');
  eq(pay('10S 10D 3C 4H 2S'), 0, 'tens pay nothing');
  eq(pay('KS JD 3C 4H 2S'), 0, 'high card pays nothing');
  // Paytable return: the 9/6 table is 99.54% – check the table rows are the full-pay numbers
  eq(vp.VP_PAYTABLE.map((p) => p.pays), [800, 50, 25, 9, 6, 4, 3, 2, 1], '9/6 full-pay table');
  near(vp.VP_RTP, 99.54, 0.001, 'published RTP 99.54%');
  // Hold strategy
  const hold = (s) => { const h = parseCards(s); const a = vp.vpStrategy(h); return h.filter((_, i) => a.hold[i]).map(cards.cardId).join(' '); };
  eq(hold('AS KS QS JS 9D'), 'AS KS QS JS', 'hold four to a royal over nothing');
  eq(hold('AS KS QS JS 9S'), 'AS KS QS JS', 'break a flush for four to a royal');
  eq(hold('AS KS QS JS 10D'), 'AS KS QS JS', 'break a straight for four to a royal');
  eq(hold('9S 9D 9C 9H 2S'), '9S 9D 9C 9H', 'quads: hold four');
  eq(hold('9S 9D 9C 3H 2S'), '9S 9D 9C', 'trips: hold three');
  eq(hold('9S 9D 3C 3H 2S'), '9S 9D 3C 3H', 'two pair: hold both');
  eq(hold('JS JD 3C 4H 2S'), 'JS JD', 'high pair: hold the pair');
  eq(hold('JS JD QS KS 2D'), 'JS JD', 'high pair beats three to a royal');
  eq(hold('AS KS QS 5D 7C'), 'AS KS QS', 'three to a royal');
  eq(hold('AS KS QS 5S 7C'), 'AS KS QS', 'three to a royal beats four to a flush');
  eq(hold('AS KS 2S 5S 7C'), 'AS KS 2S 5S', 'four to a flush beats two suited high cards');
  eq(hold('5S 5D 7S 8S 9S'), '5S 7S 8S 9S', 'four to an inside straight flush beats a low pair');
  eq(hold('4S 4D 5S 6S 9C'), '4S 4D', 'low pair beats three to a straight flush');
  eq(hold('4S 4D 5S 6S 9S'), '4S 5S 6S 9S', 'four to a flush beats a low pair');
  eq(hold('4S 4D 5S 6S 7S'), '4S 5S 6S 7S', 'four to an open straight flush beats a low pair');
  eq(hold('4S 4D 5S 6S 7D'), '4S 4D', 'low pair beats four to an outside straight');
  eq(hold('4S 5D 6S 7S 9D'), '4S 5D 6S 7S', 'four to an outside straight');
  eq(hold('AS KD 3C 4H 7S'), 'AS KD', 'two unsuited high cards');
  eq(hold('AS KD QC 4H 7S'), 'KD QC', 'three unsuited high cards: keep the lowest two');
  eq(hold('AS 3D 4C 8H 7S'), 'AS', 'one high card');
  eq(hold('2S 3D 5C 8H 9S'), '', 'rubbish: draw five');
  eq(hold('JS 10S 4C 8H 2D'), 'JS 10S', 'suited J-10 beats a lone jack');
  eq(hold('JS QD KC AD 2S'), 'JS QD KC AD', 'inside straight with four high cards (J-Q-K-A): hold four');
  eq(hold('JS QD KC 5D 2S'), 'JS QD KC', 'unsuited J-Q-K: hold three');
  eq(hold('JS QD KC AD 9S'), 'JS QD KC AD', 'J-Q-K-A over unsuited J-Q-K');
  eq(hold('2S 3S 4S KD 9C'), 'KD', 'one high card beats 2-3-4 suited (type 3)');
  eq(hold('2S 3S 4S 8D 9C'), '2S 3S 4S', '2-3-4 suited beats drawing five');
  eq(hold('9S 10S QS 3D 4C'), '9S 10S QS', '9-10-Q suited (one gap, one high) is a type-1 straight flush draw');
  eq(hold('8S 8D 8C 8H KD'), '8S 8D 8C 8H', 'quads with a kicker');
  eq(hold('AS KS QS JS 10S'), 'AS KS QS JS 10S', 'pat royal: hold all');
}

/* ---------------------------------------------------------------- Casino Hold'em */
{
  const q = (s) => ch.dealerQualifies(poker.evaluateBest(parseCards(s)));
  ok(!q('AS KD 9C 5H 2S 7D 3C'), 'ace-high does not qualify');
  ok(!q('3S 3D 9C 5H 2S 7D 10C'), 'pair of 3s does not qualify');
  ok(q('4S 4D 9C 5H 2S 7D 10C'), 'pair of 4s qualifies');
  ok(q('2S 2D 3C 3H 9S 7D 10C'), 'two pair qualifies');
  eq(ch.anteBonusPays('royal-flush'), 100, 'royal 100:1'); eq(ch.anteBonusPays('straight-flush'), 20, 'SF 20:1'); eq(ch.anteBonusPays('four-of-a-kind'), 10, 'quads 10:1');
  eq(ch.anteBonusPays('full-house'), 3, 'FH 3:1'); eq(ch.anteBonusPays('flush'), 2, 'flush 2:1'); eq(ch.anteBonusPays('straight'), 1, 'straight 1:1'); eq(ch.anteBonusPays('high-card'), 1, 'high card 1:1');
  // Fixed deals: player AS KS, dealer 2D 3C, board laid out so the turn/river are known (deck pops from the end)
  const fixed = (player, dealer, flop, turnRiver) => ({ phase: 'decide', ante: 10, call: 0, player: parseCards(player), dealer: parseCards(dealer), board: parseCards(flop), deck: parseCards(turnRiver).reverse() });
  let r = ch.chCall(fixed('AS KS', '2D 3C', 'AD 7H 9C', 'JS 5D'));
  eq(r.result.outcome, 'no-qualify', 'dealer 2-3 high misses: no qualify');
  eq(r.result.returned, 10 * 2 + 20, 'no qualify: ante pays 1:1 (pair), call pushes');
  r = ch.chCall(fixed('AS KS', '7D 7C', 'AD 9H 9C', 'JS 5D'));
  eq(r.result.outcome, 'win', 'player two pair beats dealer two pair 9s & 7s');
  eq(r.result.returned, 10 * 2 + 20 * 2, 'win: ante 1:1 + call 1:1');
  r = ch.chCall(fixed('AS KS', 'QD QC', '2D 9H 9C', 'JS 5D'));
  eq(r.result.outcome, 'lose', 'queens up beats ace-high… player has 9s with A kicker vs dealer Q-Q-9-9');
  eq(r.result.returned, 0, 'loss returns nothing');
  r = ch.chCall(fixed('AS 2S', 'AD 2D', 'KC QH JC', '10S 5D'));
  eq(r.result.outcome, 'push', 'identical straights push');
  eq(r.result.returned, 30, 'push returns ante and call');
  r = ch.chCall(fixed('AS KS', '2D 3C', 'QS JS 10S', '4D 5D'));
  eq(r.result.returned, 10 * 101 + 20, 'royal flush with a non-qualifying dealer: ante 100:1, call pushes');
  r = ch.chCall(fixed('AS KS', '4D 4C', 'QS JS 10S', '7D 5D'));
  eq(r.result.returned, 10 * 101 + 40, 'royal flush vs qualified dealer: ante 100:1, call 1:1');
  eq(ch.chFold(fixed('2S 7D', '4D 4C', 'QS JS 10S', '7D 5D')).result.returned, 0, 'fold loses the ante');
  // Strategy
  const act = (p, f) => ch.chStrategy(parseCards(p), parseCards(f)).action;
  eq(act('AS 7D', '2C 9H KD'), 'call', 'ace-high: call');
  eq(act('KS 7D', '2C 9H QD'), 'call', 'king-high: call');
  eq(act('7S 7D', '2C 9H KD'), 'call', 'pocket pair: call');
  eq(act('7S 2D', '7C 9H KD'), 'call', 'paired the flop: call');
  eq(act('5S 2D', '9C 9H KD'), 'call', 'board pair: call');
  eq(act('5S 6D', '7C 8H KD'), 'call', 'open-ended straight draw: call');
  eq(act('5S 6S', '7S 8S KD'), 'call', 'four to a flush: call');
  eq(act('QS 6D', '7C 8H 2D'), 'call', 'queen-high, rainbow flop: call');
  eq(act('QS 6D', '7C 8C 2C'), 'fold', 'queen-high, single-suit flop with none of the suit: fold');
  eq(act('QC 6D', '7C 8C 2C'), 'call', 'queen-high with one of the flop suit… that is four to a flush anyway: call');
  eq(act('9S 6D', '2C 10H KD'), 'fold', 'two low cards, missed flop, no draw: fold');
  eq(act('3S 8D', 'JC 10H 2D'), 'fold', 'junk: fold');
  // fold rate in a plausible band
  let folds = 0, n = 20000;
  for (let i = 0; i < n; i++) { const s = ch.chDeal(1); if (ch.chStrategy(s.player, s.board).action === 'fold') folds++; }
  near(folds / n * 100, 18, 5, `fold rate over ${n} random deals ≈ 18%`);
}

console.log(`\n${passed} passed, ${failed} failed`);
fs.rmSync(out, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
