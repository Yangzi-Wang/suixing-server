const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  participant: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
  status: { type: Number ,default: 0},
}, {
  timestamps: true
})

module.exports = mongoose.model('Message', schema)