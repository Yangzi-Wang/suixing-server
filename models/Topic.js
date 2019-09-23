const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  images:[{type:String}],
  content: { type: String },
  location: { type: [Number], index: '2d'},
  city: { type: String },
  locationName: { type: String },
  labels: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Label' }],
  good: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
}, {
  timestamps: true
})

// schema.virtual('goodCount').get(function () { 
//   console.log(this.good.length)
//   return this.good.length
// });

module.exports = mongoose.model('Topic', schema)