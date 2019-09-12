const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  title: { type: String },
  content: { type: String },
  memberNum: { type: String },
  location: { type: Array, index: '2d'},
  locationName: { type: String },
  date: { type: String },
  time: { type: String },
  price: { type: String },
  require: { type: String },
  postUrl: { type: String },
  good: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  collect: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  labels: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Label' }],
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
}, {
  timestamps: true
})
/*
schema.virtual('children', {
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
  ref: 'Category'
})

schema.virtual('newsList', {
  localField: '_id',
  foreignField: 'categories',
  justOne: false,
  ref: 'Article'
})
*/
module.exports = mongoose.model('Team', schema)