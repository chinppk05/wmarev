const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  name: String,
  code: String,
  area: { type: ObjectId, ref: "Area" },

  rate: Number, 
  year: Number, 

  description:String,

  rate1: Number, 
  rate2: Number, 
  rate3: Number, 

})
schema.plugin(mongoosePaginate)
const AreaRation = mongoose.model("AreaRation", schema)
export default AreaRation