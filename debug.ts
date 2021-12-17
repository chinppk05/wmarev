
function floorDecimals(value: any, decimals: any) {
  //@ts-ignore
  return Number(Math.floor(value + 'e' + decimals) + 'e-' + decimals);
}
let vat = 1.225

// let result = vat.toString().split(".")
// let final = result[0] + "." + result[1].slice(0, 2)
// let finalFloat = parseFloat(final)
console.log(floorDecimals(vat,2))