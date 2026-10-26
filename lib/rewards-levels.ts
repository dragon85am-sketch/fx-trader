export const REWARD_LEVELS = [
  ["Bronze",0,20],["Silver",20,22.5],["Gold",40,25],
  ["Platinum",70,27.5],["Diamond",110,30],["Sapphire",150,32.5],
  ["Emerald",200,35],["Ruby",250,37.5],["Titanium",300,40],
  ["Master",350,42.5],["Grandmaster",400,45],["Elite",450,47.5],
  ["Champion",500,50],["Legend",550,52.5],["Elite Legend",600,55],
] as const;
export function getRewardLevel(lots: number) {
  let index = 0;
  REWARD_LEVELS.forEach((level, i) => { if (lots >= level[1]) index = i; });
  return { index, number: index + 1, name: REWARD_LEVELS[index][0], percentage: REWARD_LEVELS[index][2], next: REWARD_LEVELS[index+1] ?? null };
}
