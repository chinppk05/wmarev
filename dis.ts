import { DateTime } from "luxon"
const sortDebts = [
  { month: 9, year: 2564, yearMonth: 256409 },
  { month: 10, year: 2564, yearMonth: 256410 },
  { month: 11, year: 2564, yearMonth: 256411 },
  { month: 12, year: 2564, yearMonth: 256412 },
  { month: 1, year: 2565, yearMonth: 256501 },
  // { month: 2, year: 2565, yearMonth: 256502 },
  // { month: 3, year: 2565, yearMonth: 256503 },
  // { month: 4, year: 2565, yearMonth: 256504 },
  { month: 5, year: 2565, yearMonth: 256505 }
]
let display2 = (invoices: Array<any>) => {
  let maxYear = Math.max(...invoices.map(el => el.year))
  let maxYearMonth = Math.max(...invoices.map(el => el.yearMonth))
  let debts = invoices
  let mapDebts = debts.map((debt) => ({
    month: debt.month,
    year: debt.year,
    yearMonth: parseInt(
      String(debt.year) + String(debt.month).padStart(2, "0")
    ),
  }));
  let sortDebts = mapDebts.sort((a, b) => a.yearMonth - b.yearMonth);
  let debtText: Array<any> = [];
  let arrayDebtText: Array<any> = [];
  let latest: any = {};
  for (const [i, debt] of sortDebts.entries()) {
    let current = DateTime.fromObject({
      year: debt.year - 543,
      month: debt.month,
      day: 10,
    });
    let formatDate = current
      .reconfigure({ outputCalendar: "buddhist" })
      .setLocale("th")
      .toFormat("LLLyy");
    let gap = (latest.yearMonth ?? 0) - (debt.yearMonth ?? 0)
    debtText.push({
      text: formatDate,
      yearMonth: debt.yearMonth,
      gap
    });
    latest = debt;
  }
  for (const [i, debt] of debtText.entries()) {
    if (debt.yearMonth === maxYearMonth){
      if(debt.gap===-1){
        arrayDebtText.push({ text: "-" });
      }
    }
    if (debt.gap === -1) {
      if(debtText.length-1 === i){
      arrayDebtText.push({ text: debt.text });}
      else {
        arrayDebtText.push({ text: "-" });
      }
      try {
        if (debtText[i + 1].gap !== -1)
          arrayDebtText.push({ text: debt.text });
      } catch (error) { }
    } else {
      arrayDebtText.push({ text: debt.text });
    }
  }
  let finalDebtAmount = debts.reduce(
    (acc, debt) => acc + debt.totalAmount,
    0
  );
  let finalDebtText = arrayDebtText
    .map((el) => el.text)
    .join(arrayDebtText.length == 2 ? "-" : "/")
    .replace(/\/-(.*?)([ก-ฮ])/g, "-$2");
  return {
    debtAmount: finalDebtAmount,
    debtText: finalDebtText,
    original: debtText,
    // debts,
    maxYear,
    maxYearMonth
  };
}

console.log(display2(sortDebts).debtText)
console.log(display2(sortDebts).original)