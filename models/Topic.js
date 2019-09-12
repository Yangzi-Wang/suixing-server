const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  images:[{type:String}],
  content: { type: String },
  location: { type: Array, index: '2d'},
  locationName: { type: String },
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