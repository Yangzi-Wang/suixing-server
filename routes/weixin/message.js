module.exports = router => {
  const mongoose = require('mongoose')
  const Message = mongoose.model('Message')
  const Team = mongoose.model('Team')

  //申请加入组队
  router.post('/message', async (req, res) => {
    await Message.create(req.body)
    res.send({ success: true, msg: "发送成功" })
  })

  //同意
  router.put('/message/:id', async (req, res) => {
    const message = await Message.findByIdAndUpdate(req.params.id, { status: 1 })
    //人数加一
    await Team.findByIdAndUpdate(req.body.teamid, {
      '$inc': { hasJoinNum: 1 },
      "$addToSet": {
        "hasJoin": message.participant
      }
    })
    res.send({ success: true })
  })

  //获取消息列表
  router.get('/messages/:id', async (req, res) => {
    const data = await Message.find({
      "$or": [
        { participant: req.params.id },
        { owner: req.params.id }
      ]
    }).lean()
    res.send(data)
  })
}
