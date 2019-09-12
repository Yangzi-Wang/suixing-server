const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  content: { type: String },
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  to: { type: mongoose.SchemaTypes.ObjectId },
}, {
  timestamps: true
})

module.exports = mongoose.model('Comment', schema)