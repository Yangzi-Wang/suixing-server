const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  content: { type: String },
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  team: { type: mongoose.SchemaTypes.ObjectId },
}, {
  timestamps: true
})

module.exports = mongoose.model('Chat', schema)