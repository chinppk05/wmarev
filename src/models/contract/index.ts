const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    name: String,
    address: String,
    contractNumber: String,
    contractStart: Date,
    contractEnd: Date,
    contractSigned: Date,
    contractLaunch: Date,
    province: String,
    district: String,
    subDistrict: String,
    postal: String,
    signedBy: String,
    signedPosition: String,
    activeYear: Number,
    accountCode: Number,
    fileUrl1: [String],
    fileUrl2: [String],
    maximum: Number,
    isMaximum: Boolean,
    conditions: [{
        category: String,
        value: String,
        valueProfit: String,
        valueLoss: String,
        value2: String,
        description: String,
        collector: String,
        calculation: String,
        period: String,
    }],
    collections: [{
        category: String,
        fileUrl: [String],
        amount:Number,
        year:Number,
        quarter:Number,
        value: String,
        value2: String,
    }],
    documents: [String],

    category1:Number,
    category2:Number,
    category3:Number,
})
schema.plugin(mongoosePaginate)
const Contract = mongoose.model("Contract", schema)
export default Contract