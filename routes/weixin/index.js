module.exports = app => {
  const router = require('express').Router()
  const mongoose = require('mongoose')
  const Topic = mongoose.model('Topic')
  const Team = mongoose.model('Team')
  const User = mongoose.model('User')
  const Comment = mongoose.model('Comment')
  const Label = mongoose.model('Label')
  const Forward = mongoose.model('Forward')
  const Message = mongoose.model('Message')
  const Chat = mongoose.model('Chat')


  const userController = require('../../plugins/wechat')


  require('./user')(router)
  require('./message')(router)
  require('./region')(router)




  //提交话题
  router.post('/topic', async (req, res) => {
    let data = req.body
    data.city = await userController.getCity(data.location[0], data.location[1])               //location必须有
    const model = await Topic.create(data)
    await User.findByIdAndUpdate(req.body.owner, {
      "$addToSet": {
        "topics": model._id,
      }
    })
    res.send({ success: true })
  })

  //删除话题
  router.delete('/topic/:id', async (req, res) => {
    const model = await Topic.findByIdAndDelete(req.params.id)
    console.log(model)
    await User.findByIdAndUpdate(model.owner, {
      "$pull": {
        "topics": req.params.id,
      }
    })
    res.send({ success: true })
  })


  //提交组队
  router.post('/team', async (req, res) => {
    let data = req.body
    data.city = await userController.getCity(data.location[0], data.location[1])               //location必须有
    data.no = (Math.random() * 10000000).toString(16).substr(0, 5) + Math.random().toString().substr(2, 5)
    const model = await Team.create(data).catch(err => console.log(err))
    await User.findByIdAndUpdate(req.body.owner, {
      "$addToSet": {
        "teams": model._id,
      }
    })
    res.send({ success: true })
  })

  //删除组队
  router.delete('/team/:id', async (req, res) => {
    const model = await Team.findByIdAndDelete(req.params.id)
    await User.findByIdAndUpdate(model.owner, {
      "$pull": {
        "teams": req.params.id,
      }
    })
    //删除评论(收藏无需删除，点赞无需删除)
    // const comments = await Comment.find({
    //   to:req.params.id
    // }).lean()
    // comments.forEach(item=>{
    //   await Comment.findByIdAndDelete(item._id)
    // })

    res.send({ success: true })
  })

  //获取首页话题
  router.post('/topics', async (req, res) => {
    let options = {}
    if (req.body.getNear) {
      options.location = {
        $near: [req.body.lat, req.body.lng],
        $maxDistance: req.body.maxDistance / 111.12
      }
    }
    const topics = await Topic.find(options, 
      (err, result) => {
      if (err) {
        // return err.status(400).send({   
        //   message: '错误',   
        //   data: []   
        // });   
      }
    })
      .populate('owner', 'nickName avatarUrl intro')
      .lean()
    await userController.addDistance(req.body.lat, req.body.lng, topics)
    await userController.addCommentCount(topics)
    // const data = topics.map(item => {
    //   item.goodCount = item.good.length
    //   return item
    // })
    // console.log(data)
    res.send(topics)
  })

  //获取首页组队
  router.post('/teams', async (req, res) => {

    let options = {}
    if (req.body.getNear) {
      options.location = {
        $near: [req.body.lat, req.body.lng],
        $maxDistance: req.body.maxDistance / 111.12
      }
    }

    const teams = await Team.find(options,{ postUrl: 1, locationName: 1, good: 1, collect: 1, location: 1, createdAt: 1, forwardCount:1, status:1 })
      .populate('owner', 'nickName avatarUrl intro')
      .lean()

    await userController.addDistance(req.body.lat, req.body.lng, teams)
    await userController.addCommentCount(teams)

    // teams.forEach(item => {
    //     // item.goodCount = item.good.length
    //   // item.collectCount = item.collect.length
    //   const cm = cmArr.filter(i=>{
    //     return i._id.toString()==item._id
    //   })
    //   if(cm[0])
    //   item.commentCount = cm[0].total
    // })
    // console.log(teams)

    res.send(teams)
  })

  //组队详情
  router.get('/team/:id', async (req, res) => {
    let team = await Team.findById(req.params.id)
      .populate('owner', 'nickName avatarUrl intro')
      .populate('hasJoin', 'nickName avatarUrl')
      .populate('labels')
      .lean()

    await userController.addDistance(req.query.lat, req.query.lng, [team])

    const comments = await Comment.find({
      to: req.params.id
    }).populate('owner', 'nickName avatarUrl')
      .lean()

    team.commentCount = comments.length
    // team.goodCount = team.good.length
    // team.collectCount = team.collect.length

    res.send({ team: team, comments: comments })
  })

  //话题详情
  router.get('/topic/:id', async (req, res) => {
    let topic = await Topic.findById(req.params.id)
      .populate('owner', 'nickName avatarUrl intro')
      .lean()

    await userController.addDistance(req.query.lat, req.query.lng, [topic])

    const comments = await Comment.find({
      to: req.params.id
    }).populate('owner', 'nickName avatarUrl')
      .lean()

    topic.commentCount = comments.length

    res.send({ topic: topic, comments: comments })
  })


  //转发
  router.post('/forward', async (req, res) => {
    const model = await Forward.create(req.body)
    req.body.ref == 'Topic' && await Topic.findByIdAndUpdate(req.body.from, {
      '$inc': { 'forwardCount': 1 }
    })
    req.body.ref == 'Team' && await Team.findByIdAndUpdate(req.body.from, {
      '$inc': { 'forwardCount': 1 }
    })
    res.send({ success: true })
  })

  //删除转发
  router.delete('/forward/:id', async (req, res) => {
    const model = await Forward.findByIdAndDelete(req.params.id)
    model.ref == 'Topic' && await Topic.findByIdAndUpdate(model.from, {
      '$inc': { 'forwardCount': -1 }
    })
    model.ref == 'Team' && await Team.findByIdAndUpdate(model.from, {
      '$inc': { 'forwardCount': -1 }
    })
    res.send({ success: true })
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



  //添加评论
  router.post('/comment', async (req, res) => {
    const model = await Comment.create(req.body)
    res.send({ success: true })
  })

  //删除评论
  router.delete('/comment/:id', async (req, res) => {
    await Comment.findByIdAndDelete(req.param.id)
    res.send({ success: true })
  })

  //获取评论
  router.get('/comments/:id', async (req, res) => {
    const comments = await Comment.find({
      to: req.params.id
    }).populate('owner', 'nickName avatarUrl')
      .lean()
    res.send(comments)
  })

  //群聊发言
  router.post('/teamSpeak', async (req, res) => {
    const model = await Chat.create({
      team: req.body.teamid,
      content: req.body.content,
      owner: req.body.userid
    })
    const data = await Chat.populate(model, { path: 'owner', model: 'User', select: 'nickName avatarUrl' })
    res.send(data)
  })


  //获取群聊内容
  router.get('/team/chat/:id', async (req, res) => {
    // const data = await Team.findById(req.params.id, { chat: 1 })
    //   .populate('chat.owner', 'nickName avatarUrl')
    //   .lean()

    const data = await Chat.find({
      team: req.params.id
    }, { team: 0 })
      .populate('owner', 'nickName avatarUrl')
      .lean()

    res.send(data)
  })

  //获取讨论组列表
  router.get('/team/chatList/:id', async (req, res) => {
    const data = await Team.find({
      "$or": [
        { "owner": req.params.id },
        { "hasJoin": req.params.id }
      ]
    }, { postUrl: 1, hasJoinNum: 1, memberNum: 1, title: 1, owner: 1 })
      .populate('owner', 'nickName avatarUrl intro')
      .lean()

    res.send(data)
  })

  //通过账号返回用户id
  router.get('/noToUserid/:no', async (req, res) => {
    const data = await User.findOne({
      no: req.params.no
    }, { avatarUrl: 1, nickName: 1 }).lean()

    res.send(data)
  })

  //更新加入组队的成员
  router.put('/teamMember', async (req, res) => {
    const model = await Team.findByIdAndUpdate(req.body.teamid, {
      "$addToSet": {
        "hasJoin": req.body.userid
      },
      '$inc': { 'hasJoinNum': 1 }
    }, {
      "new": true
    })
    const data = await Team.populate(model, { path: 'hasJoin', model: 'User', select: 'nickName avatarUrl intro' })
    // console.log(data)

    Message.create({
      team: req.body.teamid,
      owner: model.owner,
      participant: req.body.userid,
      status: 4
    })

    res.send(data.hasJoin)
  })

  //删除某个组队的成员
  router.delete('/teamMember', async (req, res) => {
    const model = await Team.findByIdAndUpdate(req.body.teamid, {
      "$pull": {
        "hasJoin": req.body.userid
      },
      '$inc': { 'hasJoinNum': -1 }
    }, {
      "new": true
    })
    const data = await Team.populate(model, { path: 'hasJoin', model: 'User', select: 'nickName avatarUrl intro' })

    //删除某个组队的成员,发信息
    Message.create({
      team: req.body.teamid,
      owner: model.owner,
      participant: req.body.userid,
      status: 2
    })

    res.send(data.hasJoin)
  })


  //获取加入组队的成员
  router.get('/teamMember/:id', async (req, res) => {
    const model = await Team.findById(req.params.id, { hasJoin: 1 }).populate('hasJoin', 'nickName avatarUrl intro')
    res.send(model.hasJoin)
  })

  //结束活动
  router.put('/team/over', async (req, res) => {
    await Team.findByIdAndUpdate(req.body.teamid, {
      status: 0
    })

    res.send({ success: true })
  })




  //获取标签
  router.get('/labels', async (req, res) => {
    const data = await Label.find().lean()
    res.send(data)
  })


  router.get('/test', async (req, res) => {
    /*const data = await Team.aggregate([
      {
        $geoNear: {
          near: [23.12901, 113.2668],//{ type: "Point", coordinates: [ 0 , 0 ] },
          distanceField: "distance",
          spherical: false,
          distanceMultiplier: 6371
        }
      }
    ])*/

    // var options = { near: [23.12901, 113.2668], maxDistance: 5000 };
    // const data2 = await Team.geoSearch({ type : "location" },  options, function(err, res) {
    //   console.log(res);
    // });

    //fail
    // const coords = {type: 'Point', coordinates: [23, 113]};
    //   await Team.find({loc: {$near: coords}}).exec(function(err, res) {
    //     console.log(res);
    //   });

    //ok
    // await Team.find({location: {$near: [23, 113]}}).exec(function(err, res) {
    //   console.log(res);
    // });

    //(Math.random()*10000000).toString(16).substr(0,4)+'-'+(new Date()).getTime()+'-'+Math.random().toString().substr(2,5)
    const no = (Math.random() * 10000000).toString(16).substr(0, 4) + Math.random().toString().substr(2, 5)
    res.send(no)
  })

  //搜索
  router.post('/search', async (req, res) => {
    // const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{10}$')
    // let teams,topics;
    // if (req.body.key.length == 10 && checkForHexRegExp.test(req.body.key)) {
    //   teams = await Team.find({
    //     no:req.body.key
    //   }).populate('owner', 'nickName avatarUrl intro').lean()
    // }else{}
    
    let searchKey = req.body.key
    const labels = await Label.find()
    const labelNameArr = labels.map(i=>i.name)
    const index = labelNameArr.indexOf(req.body.key)
    if(index!=-1){
      searchKey = labels[index]._id
    }


    const teams = await Team.find({
      "$or": [
        { 'no': searchKey },
        { 'title': eval("/" + searchKey + "/i") },
        { 'content': eval("/" + searchKey + "/i") },
        { 'labels':  searchKey }
      ]
    }).populate('owner', 'nickName avatarUrl intro').lean()

    const topics = await Topic.find({
      'content': eval("/" + searchKey + "/i")
    }).populate('owner', 'nickName avatarUrl intro').lean()

    try {
      let total = teams.concat(topics)
      let p = [
        userController.addDistance(req.body.lat, req.body.lng, total),
        userController.addCommentCount(total)
      ]
      await Promise.all(p)

    } catch (err) {
      console.log(err)
    }

    res.send({ teams: teams, topics: topics })
  })

  //筛选
  router.post('/sieve', async (req, res) => {
    if (req.body.type == 0) {
      let opt = {
        city: req.body.city,
      }
      if (req.body.date) opt.date = req.body.date
      if (req.body.labels != '') opt.labels = { '$all': req.body.labels }

      const teams = await Team.find(opt).populate('owner', 'nickName avatarUrl intro').lean()

      await userController.addDistance(req.body.lat, req.body.lng, teams)
      await userController.addCommentCount(teams)

      // const topics = await Topic.find({
      //   labels:req.body.labels,
      //   city:req.body.city,
      // }).populate('owner', 'nickName avatarUrl intro').lean()
      // console.log(teams)
      res.send({ teams: teams })
    } else {

    }

  })



  app.use('/weixin/api', router)
}