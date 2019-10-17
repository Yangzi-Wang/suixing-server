const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  no: { type: String, unique: true },
  nickName: { type: String },
  avatarUrl:{type:String},
  openid:{type:String},
  intro: { type: String },
  phone: { type: String },
  wechat: { type: String },
  follow: [
    {type: mongoose.SchemaTypes.ObjectId, ref: 'User'}
  ],
  topics:[
    {type: mongoose.SchemaTypes.ObjectId, ref: 'Topic'}
  ],
  teams:[
    {type: mongoose.SchemaTypes.ObjectId, ref: 'Team'}
  ],
  // collects:[
  //   {type: mongoose.SchemaTypes.ObjectId, ref: 'Team'}
  // ],
  // goods:[
  //   {type: mongoose.SchemaTypes.ObjectId, ref: 'Topic'}
  // ],
  location: {type: [Number], index: '2d'}
  // goods:[
  //   {type: mongoose.SchemaTypes.ObjectId, ref: ''}
  // ],
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
module.exports = mongoose.model('User', schema)