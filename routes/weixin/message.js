module.exports = router => {
  const mongoose = require('mongoose')
  const Message = mongoose.model('Message')
  const Team = mongoose.model('Team')
  const Topic = mongoose.model('Topic')
  const Comment = mongoose.model('Comment')
  const User = mongoose.model('User')



  //0申请、1同意已加入、2加入后被退出、3主动退出、4邀请、5组队已删除且正在申请
  //申请加入组队
  router.post('/message', async (req, res) => {
    await Message.create(req.body)
    res.send({ success: true, msg: "发送成功" })
  })

  //同意
  router.put('/message/:id', async (req, res) => {
    const message = await Message.findByIdAndUpdate(req.params.id, { status: 1 })
    //人数加一
    await Team.findByIdAndUpdate(message.team, {
      // '$inc': { hasJoinNum: 1 },
      "$addToSet": {
        "hasJoin": message.participant
      }
    })
    //参与过的组队
    await User.findByIdAndUpdate(message.participant, {
      "$addToSet": {
        "joinedTeams": message.team
      }
    })
    res.send({ success: true })
  })

  //获取消息列表
  router.get('/messages/:id', async (req, res) => {
    const messages = await Message.find({
      "$or": [
        { participant: req.params.id, status: 1 },
        { participant: req.params.id, status: 2 },
        { participant: req.params.id, status: 4 },
        { participant: req.params.id, status: 5 },
        { owner: req.params.id, status: 0 },
      ]
    })
      .populate('owner', 'nickName avatarUrl')
      .populate('participant', 'nickName avatarUrl')
      .populate('team', 'title')
      .lean()

    // 找出我的话题和组队的id
    // const teams = await Team.find({
    //   owner: req.params.id
    // }, { _id: 1 })
    // const teamIdArr = teams.map(v => v._id)

    // const topics = await Topic.find({
    //   owner: req.params.id
    // }, { _id: 1 })
    // const topicIdArr = topics.map(v => v._id)
    // const idArr = teamIdArr.concat(topicIdArr)
    // 找出给我的评论
    // const comments = await Comment.find({
    //   to: { $in: idArr }
    // }).populate('owner', 'nickName avatarUrl')
    //   .lean()

    // 合并
    const data = messages//.concat(comments)
    data!=''&&data.sort(function (a, b) {
      let date1 = a['updatedAt'] || '2019-10-18T17:51:17.846Z'
      let date2 = b['updatedAt'] || '2019-10-18T17:51:17.846Z'
      return date1 > date2 ? -1 : 1
    })

    //未读消息计数
    const user = await User.findById(req.params.id,{latestReadMsg:1})
    
    // let index = 0;
    let unRead = false
    const latestRM = user.latestReadMsg?user.latestReadMsg.toString():''
    // for(let i = 0;i<data.length;i++){
      if(data!=''&&data[0]._id!=latestRM) {
        // index=i
        unRead = true
      }
    // }
    // console.log(user.latestReadMsg)
    res.send({msg:data,unRead})
  })

  //记录已读消息
  router.post('/readMessages', async (req, res) => {
    req.body.msgid!=''&&await User.findByIdAndUpdate(req.body.userid, {
      latestReadMsg: req.body.msgid
    })
    res.send({ success: true })
  })
}