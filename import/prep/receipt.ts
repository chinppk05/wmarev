import fs from "fs"
import path from "path"
import { DateTime } from "luxon"
import Excel from "exceljs"


const folder =  __dirname + "./excel";

let main = async () => {
  const files = await fs.promises.readdir(folder);
  for (const file of files) {
    const filePath = path.join(folder, file);
    const stat = await fs.promises.stat(filePath);
    console.log(stat)
  }
}

main()