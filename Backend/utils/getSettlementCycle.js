// utils/getSettlementCycle.js
export function getSettlementCycle(date = new Date()) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const cycle = day <= 10 ? 1 : day <= 20 ? 2 : 3;
  return `${year}-${month.toString().padStart(2, "0")}-C${cycle}`;
}
