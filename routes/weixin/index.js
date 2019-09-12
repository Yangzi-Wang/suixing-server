module.exports = app => {
  const router = require('express').Router()
  const mongoose = require('mongoose')
  const userController = require('../../plugins/wechat')
  const Topic = mongoose.model('Topic')
  const Team = mongoose.model('Team')
  const User = mongoose.model('User')
  const Comment = mongoose.model('Comment')
  const Label = mongoose.model('Label')


  router.post('/topic', async (req, res) => {
    const model = await Topic.create(req.body)
    await User.findByIdAndUpdate(req.body.owner, {
      "$addToSet": {
        "topics": model._id,
      }
    })
    res.send({ success: true })
  })

  router.post('/team', async (req, res) => {
    const model = await Team.create(req.body)
    await User.findByIdAndUpdate(req.body.owner, {
      "$addToSet": {
        "teams": model._id,
      }
    })
    res.send({ success: true })
  })

  router.get('/topic', async (req, res) => {
    const topics = await Topic.find((err, result) => {
      if (err) {
        // return err.status(400).send({   
        //   message: '错误',   
        //   data: []   
        // });   
      }
    })
      .populate('owner', 'nickName avatarUrl intro')
      .lean()
    const data = topics.map(item => {
      item.goodCount = item.good.length
      // var date = item.updateAt
      // item.createTime = date.substring(5,10)//+''+date.substring(11,16)
      return item
    })
    // console.log(data)
    res.send(data)
  })

  router.get('/team', async (req, res) => {
    const teams = await Team.find()
      .populate('owner', 'nickName avatarUrl intro')
      .lean()
    const data = teams.map(item => {
      item.goodCount = item.good.length
      item.collectCount = item.collect.length
      return item
    })
    // console.log(data)
    res.send(data)
  })

  router.post("/openid", userController.login)
  //获取城市信息
  router.post('/reverseGeocoder', userController.reverseGeocoder)

  router.post('/user', async (req, res) => {
    const model = await User.findByIdAndUpdate(req.body.userid, {
      "$set": {
        "nickName": req.body.nickName,
        "avatarUrl": req.body.avatarUrl
      }
    }, {
      "fields": { "nickName": 1,"avatarUrl":1 },
      "new": true
    })
    res.send(model)
  })

  router.get('/user/:id', async (req, res) => {
    const data = await User.findById(req.params.id, { openid: 0 })
      .populate('topics', 'content images locationName good')
      .populate('teams', 'postUrl locationName good collect')
      .lean()

    const fans = await User.find({
      interest: req.params.id
    }, { _id: 1 })

    data.interestCount = data.interest.length
    data.fansCount = fans.length
    res.send(data)
  })

  //关注
  router.post('/interest', async (req, res) => {
    await User.findByIdAndUpdate(req.body.userid, {
      "$addToSet": {
        "interest": req.body.myid
      }
    })
    res.send({ success: true, msg: '关注成功' })
  })

  //获取我的关注
  router.get('/user/interest/:id', async (req, res) => {
    const data = await User.findById(req.params.id, { interest: 1 })
      .populate('interest', 'nickName avatarUrl intro')
      .lean()
    res.send(data)
  })

  //获取我的粉丝
  router.get('/user/fans/:id', async (req, res) => {
    const data = await User.find({
      interest: req.params.id
    }, { nickName: 1, avatarUrl: 1, intro: 1 })
      .lean()
    res.send(data)
  })

  //点赞
  router.put('/topicLike', async (req, res) => {
    await Topic.findByIdAndUpdate(req.body.topicid, {
      "$addToSet": {
        "good": req.body.userid
      }
    })
    res.send({ success: true })
  })

  router.put('/teamLike', async (req, res) => {
    await Team.findByIdAndUpdate(req.body.teamid, {
      "$addToSet": {
        "good": req.body.userid
      }
    })
    res.send({ success: true })
  })

  //取消点赞
  router.delete('/topicLike', async (req, res) => {
    await Topic.findByIdAndUpdate(req.body.topicid, {
      "$pull": {
        "good": req.body.userid
      }
    })
    res.send({ success: true })
  })

  router.delete('/teamLike', async (req, res) => {
    await Team.findByIdAndUpdate(req.body.teamid, {
      "$pull": {
        "good": req.body.userid
      }
    })
    res.send({ success: true })
  })

  //组队收藏
  router.put('/teamCollect', async (req, res) => {
    await Team.findByIdAndUpdate(req.body.teamid, {
      "$addToSet": {
        "collect": req.body.userid
      }
    })
    res.send({ success: true })
  })

  //取消收藏
  router.delete('/teamCollect', async (req, res) => {
    await Team.findByIdAndUpdate(req.body.teamid, {
      "$pull": {
        "collect": req.body.userid
      }
    })
    res.send({ success: true })
  })

  //获取收藏列表
  router.get('/user/collection/:id', async (req, res) => {
    const collections = await Team.find({
      collect: req.params.id
    }, { postUrl: 1, locationName: 1, good: 1, collect: 1 })
      .populate('owner', 'nickName avatarUrl intro').lean()
      const data = collections.map(item => {
        item.goodCount = item.good.length
        item.collectCount = item.collect.length
        return item
      })
    res.send(data)
  })

  //添加评论
  router.post('/comment', async (req, res) => {
    const model = await Comment.create(req.body)
    res.send({ success: true })
  })

  //获取评论
  router.get('/comment/:id', async (req, res) => {
    const comments = await Comment.find({
      to: req.params.id
    }).populate('owner', 'nickName avatarUrl')
      .lean()
    res.send(comments)
  })

  //获取标签
  router.get('/labels', async (req, res) => {
    const data = await Label.find().lean()
    res.send(data)
  })


  router.get('/test', async (req, res) => {
    const data = await Team.aggregate([
      {
        $geoNear: {
          near: [23.12901, 113.2668],//{ type: "Point", coordinates: [ 0 , 0 ] },
          distanceField: "distance",
          spherical: false
        }
      }
    ])



    // .near({
    //   near: [23.12901, 113.2668],
    //   distanceField: "dist.calculated", // required
    //   maxDistance: 0.008,
    //   query: { type: "public" },
    //   includeLocs: "dist.location",
    //   uniqueDocs: true,
    //   num: 5
    // });
    res.send(data)
  })

  //搜索
  router.post('/search', async (req, res) => {
    const teams = await Team.find({
      "$or": [
        { 'title': eval("/" + req.body.key + "/i") },
        { 'content': eval("/" + req.body.key + "/i") }
      ]
    }).populate('owner', 'nickName avatarUrl intro').lean()

    const topics = await Topic.find({
         'content': eval("/" + req.body.key + "/i")
    }).populate('owner', 'nickName avatarUrl intro').lean()

    res.send({ teams: teams , topics: topics})
  })


  app.use('/weixin/api', router)
}