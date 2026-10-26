export const REWARD_LEVELS = [
  ["Bronze", 0, 20],
  ["Silver", 20, 22.5],
  ["Gold", 40, 25],
  ["Platinum", 70, 27.5],
  ["Diamond", 150, 30],
  ["Sapphire", 200, 32.5],
  ["Emerald", 250, 35],
  ["Ruby", 300, 37.5],
  ["Titanium", 350, 40],
  ["Master", 400, 42.5],
  ["Grandmaster", 450, 45],
  ["Elite", 500, 47.5],
  ["Champion", 550, 50],
  ["Legend", 600, 52.5],
  ["Elite Legend", 650, 55],
] as const;

export function getRewardLevel(lots: number) {
  let index = 0;
  REWARD_LEVELS.forEach((level, i) => {
    if (lots >= level[1]) index = i;
  });
  return {
    index,
    number: index + 1,
    name: REWARD_LEVELS[index][0],
    percentage: REWARD_LEVELS[index][2],
    next: REWARD_LEVELS[index + 1] ?? null,
  };
}
