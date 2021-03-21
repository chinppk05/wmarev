const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  name: String,
  code: String,
  area: { type: ObjectId, ref: "Area" },

  treatment1: Number, //บำบัด ประเภท 1
  treatment2: Number, //บำบัด ประเภท 2
  treatment3: Number, //บำบัด ประเภท 3

  effluent1: Number, //น้ำทิ้ง ประเภท 1
  effluent2: Number, //น้ำทิ้ง ประเภท 2
  effluent3: Number, //น้ำทิ้ง ประเภท 3

})
schema.plugin(mongoosePaginate)
const AreaRate = mongoose.model("AreaRate", schema)
export default AreaRate