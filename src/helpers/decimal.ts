export const getDecimal = (num: any) => {
  return parseFloat(num)/100;
}
export const setDecimal = (num: any) => {
  return Math.round(num * 100);
}
