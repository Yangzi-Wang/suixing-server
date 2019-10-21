const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  from: { type: mongoose.SchemaTypes.ObjectId, ref: 'Topic' },
  ref: { type: String },
}, {
  timestamps: true
})

module.exports = mongoose.model('Forward', schema)