"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Excel = require('exceljs');
var mongoose = require('mongoose');
var invoice_1 = require("../src/models/invoice");
var usage_1 = require("../src/models/usage");
mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
var prepArray = [];
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var workbook, sheet, no, lastYearMonth, currentYearMonth;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, invoice_1["default"].deleteMany({}).exec()];
            case 1:
                _a.sent();
                return [4 /*yield*/, usage_1["default"].deleteMany({}).exec()];
            case 2:
                _a.sent();
                workbook = new Excel.Workbook();
                return [4 /*yield*/, workbook.xlsx.readFile(__dirname + "/prep/WMA_INV_CONSOL_R4_NEW.xlsx")];
            case 3:
                _a.sent();
                sheet = workbook.getWorksheet("รวม INV");
                sheet.columns = [
                    { header: 'Id', key: 'id', width: 10 },
                    { header: 'Sequence', key: 'sequence', width: 15 },
                    { header: 'Year', key: 'year', width: 10 },
                    { header: 'Month', key: 'month', width: 10 },
                    { header: 'Meter', key: 'meter', width: 10 },
                    { header: 'Name', key: 'name', width: 20 },
                    { header: 'Address', key: 'address', width: 30 },
                    { header: 'Qty', key: 'qty', width: 10 },
                    { header: 'Rate', key: 'rate', width: 10 },
                    { header: 'FlatRate', key: 'flatRate', width: 10 },
                    { header: 'DebtText', key: 'debtText', width: 10 },
                    { header: 'DebtAmount', key: 'debtAmount', width: 10 },
                    { header: 'TotalAmount', key: 'totalAmount', width: 10 },
                    { header: 'Category', key: 'category', width: 10 },
                    { header: 'CategoryType', key: 'categoryType', width: 10 },
                ];
                no = 1;
                lastYearMonth = "";
                currentYearMonth = "";
                sheet.eachRow(function (row, rowNumber) {
                    var _a;
                    if (rowNumber >= 5) {
                        var used = process.memoryUsage().heapUsed / 1024 / 1024;
                        currentYearMonth = row.getCell("P") + row.getCell("Q");
                        var vatText = ((_a = row.getCell("L").text) !== null && _a !== void 0 ? _a : "").replace(",", "");
                        var vat = parseFloat(vatText);
                        prepArray.push({
                            no: no,
                            sequence: row.getCell("C"),
                            name: row.getCell("E"),
                            address: row.getCell("F"),
                            debtText: row.getCell("G"),
                            debtAmount: row.getCell("H"),
                            qty: row.getCell("I"),
                            rate: row.getCell("Y") == 'บาท/เดือน' ? row.getCell("W") : row.getCell("J"),
                            totalAmount: row.getCell("K"),
                            vat: vat,
                            invoiceAmount: parseFloat(row.getCell("N")),
                            category: row.getCell("O").value,
                            year: row.getCell("P").value,
                            month: row.getCell("Q").value,
                            meter: row.getCell("V") == 'เลิกใช้น้ำแล้ว' ? row.getCell("S") : row.getCell("V"),
                            flatRate: row.getCell("W").value,
                            categoryType: row.getCell("X").text,
                            calculationType: row.getCell("Y").text,
                            vatRate: 0.07,
                            code: "01-kb",
                            isNextStage: true, isPrint: true,
                            status: row.getCell("V").text == "เลิกใช้น้ำแล้ว" ? "เลิกใช้น้ำแล้ว" : "ปกติ",
                            createdAt: new Date()
                            // no:no,
                            // sequence: row.getCell(2),
                            // year: row.getCell(3),
                            // month: row.getCell(4),
                            // meter: row.getCell(5),
                            // name: row.getCell(6),
                            // address: row.getCell(7),
                            // qty: row.getCell(8),
                            // rate: row.getCell(16)=='บาท/เดือน'?row.getCell(13):row.getCell(9),
                            // flatRate: row.getCell(10),
                            // debtText: row.getCell(11),
                            // debtAmount: row.getCell(12),
                            // totalAmount: row.getCell(13),
                            // invoiceAmount: (parseFloat(row.getCell(13))*1.07) + parseFloat(row.getCell(12)),
                            // billAmount: (row.getCell(13)*1.07),
                            // category: row.getCell(14),
                            // categoryType: row.getCell(15),
                            // calculationType:row.getCell(16),
                            // vatRate: 0.07,
                            // code: "01-kb",
                            // isNextStage: true, isPrint: true,
                            // createdAt:new Date()
                        });
                        if (lastYearMonth != currentYearMonth)
                            no = 1;
                        lastYearMonth = row.getCell(3) + row.getCell(4);
                        // if(row.getCell(5)==='12170456052'){
                        if (row.getCell(5) == '12170456052') {
                            console.log('row', row.getCell(3), row.getCell(4));
                        }
                        else {
                            // console.log('row',row)
                        }
                        console.log("reading " + rowNumber + ": " + ((parseFloat(row.getCell(13)) * 1.07) + parseFloat(row.getCell(12))) + " Collecting... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                    }
                });
                saveInvoice();
                return [2 /*return*/];
        }
    });
}); })();
var i = 0;
var j = 0;
var saveInvoice = function () { return __awaiter(void 0, void 0, void 0, function () {
    var used, invoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                used = process.memoryUsage().heapUsed / 1024 / 1024;
                if (!(prepArray[i] != undefined)) return [3 /*break*/, 2];
                invoice = new invoice_1["default"](prepArray[i]);
                return [4 /*yield*/, invoice.save().then(function () {
                        console.log("invoices " + i + ": Saving... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                        i++;
                        delete mongoose.models['Invoice'];
                        delete mongoose.connection.collections['invoices'];
                        delete mongoose.modelSchemas['Invoice'];
                        setTimeout(function () {
                            saveInvoice();
                        }, 1);
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                saveUsage();
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var saveUsage = function () { return __awaiter(void 0, void 0, void 0, function () {
    var used, usage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                used = process.memoryUsage().heapUsed / 1024 / 1024;
                if (!(prepArray[j] != undefined)) return [3 /*break*/, 2];
                try {
                    prepArray[i - 1] = null;
                }
                catch (error) {
                }
                usage = new usage_1["default"](prepArray[j]);
                return [4 /*yield*/, usage.save().then(function () {
                        console.log("usages " + j + ": Saving... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                        j++;
                        delete mongoose.models['Usage'];
                        delete mongoose.connection.collections['usages'];
                        delete mongoose.modelSchemas['Usage'];
                        setTimeout(function () {
                            saveUsage();
                        }, 1);
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                console.log('done!', i, j);
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
