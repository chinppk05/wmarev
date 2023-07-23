"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var payment_1 = require("../src/models/payment");
var receipt_1 = require("../src/models/receipt");
var invoice_1 = require("../src/models/invoice");
mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
var prepArray = [];
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var workbook, sheet;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, payment_1["default"].deleteMany({}).exec()];
            case 1:
                _a.sent();
                return [4 /*yield*/, receipt_1["default"].deleteMany({}).exec()];
            case 2:
                _a.sent();
                workbook = new Excel.Workbook();
                return [4 /*yield*/, workbook.xlsx.readFile(__dirname + "/prep/receipt_new.xlsx")];
            case 3:
                _a.sent();
                sheet = workbook.getWorksheet("Data");
                sheet.eachRow(function (row, rowNumber) {
                    var _a;
                    if (rowNumber > 1) {
                        var used = process.memoryUsage().heapUsed / 1024 / 1024;
                        var seq = (_a = row.getCell(2).value) !== null && _a !== void 0 ? _a : "";
                        try {
                            seq = seq.replace("wma-", "").replace("WMA-", "");
                        }
                        catch (error) {
                        }
                        prepArray.push({
                            sequence: seq,
                            year: row.getCell(3).value,
                            month: row.getCell(4).value,
                            meter: row.getCell(5).value,
                            name: row.getCell(6).value,
                            address: row.getCell(7).value,
                            qty: row.getCell(8).value,
                            rate: row.getCell(9).value,
                            flatRate: row.getCell(10).value,
                            debtText: row.getCell(11).value,
                            debtAmount: row.getCell("L").value,
                            vatRate: row.getCell("M").value,
                            totalAmount: row.getCell("N").value,
                            paymentAmount: row.getCell("O").value,
                            paymentDate: row.getCell("P").value,
                            category: row.getCell("Q").value,
                            categoryType: row.getCell("R").value,
                            calculationType: row.getCell("S").value,
                            invoiceAmount: row.getCell("T").value,
                            vat: row.getCell("U").value,
                            code: "01-kb",
                            isNextStage: true,
                            isPrint: true,
                            isRequested: true,
                            isApproved: true,
                            isSigned: true,
                            process: true,
                            createdAt: new Date()
                        });
                        console.log((row.getCell(8).value * row.getCell(9).value) * (1 + row.getCell("M").value), "reading " + rowNumber + ": Collecting... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                    }
                });
                savePayment();
                saveReceipt();
                return [2 /*return*/];
        }
    });
}); })();
var i = 0;
var j = 0;
var savePayment = function () { return __awaiter(void 0, void 0, void 0, function () {
    var used;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                used = process.memoryUsage().heapUsed / 1024 / 1024;
                if (!(prepArray[i] != undefined)) return [3 /*break*/, 2];
                return [4 /*yield*/, invoice_1["default"].findOne({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter }).then(function (data) { return __awaiter(void 0, void 0, void 0, function () {
                        var payment;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (data != null)
                                        payment = new payment_1["default"](__assign(__assign({}, prepArray[i]), { invoiceNumber: data.sequence }));
                                    else
                                        payment = new payment_1["default"](__assign(__assign({}, prepArray[i]), { invoiceNumber: "ไม่พบรายการชำระ" }));
                                    return [4 /*yield*/, payment.save().then(function () {
                                            delete mongoose.models['Payment'];
                                            delete mongoose.connection.collections['payments'];
                                            delete mongoose.modelSchemas['Payment'];
                                            if (prepArray[i] != undefined) {
                                                try {
                                                    invoice_1["default"].updateOne({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter }, { $set: { isPaid: true, paidReceipt: prepArray[i].sequence } }).then(function (newData) { return __awaiter(void 0, void 0, void 0, function () {
                                                        var jssl;
                                                        return __generator(this, function (_a) {
                                                            jssl = JSON.stringify({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter });
                                                            // console.log(`${jssl} - ${(data ?? { sequence: "notfound" }).sequence} ${prepArray[i].year} ${prepArray[i].month} /payments ${i}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
                                                            console.log("payments " + i + ": Saving... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                                                            savePayment();
                                                            i++;
                                                            return [2 /*return*/];
                                                        });
                                                    }); });
                                                }
                                                catch (error) {
                                                    console.log("payment error", error);
                                                }
                                            }
                                        })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                _a.sent();
                return [3 /*break*/, 2];
            case 2: return [2 /*return*/];
        }
    });
}); };
var saveReceipt = function () { return __awaiter(void 0, void 0, void 0, function () {
    var used, usage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                used = process.memoryUsage().heapUsed / 1024 / 1024;
                if (!(prepArray[j] != undefined)) return [3 /*break*/, 2];
                usage = new receipt_1["default"](prepArray[j]);
                return [4 /*yield*/, usage.save().then(function () {
                        console.log("receipts " + j + ": Saving... The script uses approximately " + Math.round(used * 100) / 100 + " MB");
                        j++;
                        delete mongoose.models['Receipt'];
                        delete mongoose.connection.collections['receipts'];
                        delete mongoose.modelSchemas['Receipt'];
                        setTimeout(function () {
                            saveReceipt();
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
