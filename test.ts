const qty = 47.00
const rate = 3.50
const debtAmount = 0
const totalAmount = 0


let rounddown = (num: number) => {
  let result = Math.floor(num * 100) / 100;
  return result
}
let roundup = (num: number) => {
  let result = Math.ceil(num * 100) / 100;
  return result
}

const invoiceAmount = (debtAmount + totalAmount)
const billAmount = rounddown((totalAmount * (1 + (0.07 ?? 0))))

console.log(invoiceAmount)
console.log(billAmount)