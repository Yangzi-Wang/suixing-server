const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  no: { type: String, unique: true  },
  status: { type: Number ,default: 1 },
  title: { type: String },
  content: { type: String },
  memberNum: { type: String },
  hasJoinNum: { type: Number ,default: 1 },
  hasJoin: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  manager: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  location: { type: [Number], index:'2d' },
  city: { type: String },
  distance: { type: Number ,default: 0 },
  locationName: { type: String },
  date: { type: String },
  time: { type: String },
  price: { type: String },
  require: { type: String },
  postUrl: [{ type: String }],
  good: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  forwardCount: { type: Number ,default: 0 },
  collect: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  labels: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Label' }],
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
}, {
  timestamps: true
})

schema.index({location: '2d'});
module.exports = mongoose.model('Team', schema)