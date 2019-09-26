module.exports = router => {
    const userController = require('../../plugins/wechat')
    const mongoose = require('mongoose')
    const Topic = mongoose.model('Topic')
    const Team = mongoose.model('Team')
    const User = mongoose.model('User')
    const Comment = mongoose.model('Comment')

    router.post("/openid", userController.login)
    //获取城市信息
    router.post('/reverseGeocoder', userController.reverseGeocoder)

    //重新授权时，更新用户信息
    router.put('/user', async (req, res) => {
        const model = await User.findByIdAndUpdate(req.body.userid, {
            "$set": {
                "nickName": req.body.nickName,
                "avatarUrl": req.body.avatarUrl
            }
        }, {
            "fields": { "nickName": 1, "avatarUrl": 1 },
            "new": true
        })
        res.send(model)
    })

    //获取用户信息、话题、组队
    router.post('/user', async (req, res) => {
        const data = await User.findById(req.body.id, { openid: 0 })
            .populate('topics', 'content images locationName location good')
            .populate('teams', 'postUrl locationName good collect location')
            .lean()

        const fans = await User.find({
            interest: req.body.id
        }, { _id: 1 })

        if (data.interest)
            data.interestCount = data.interest.length
        else
            data.interestCount = 0
        if (fans)
            data.fansCount = fans.length
        else
            data.fansCount = 0

        // data.teams.commentCount = comments.length
        data.teams.forEach(item => {
            item.goodCount = item.good.length
            item.collectCount = item.collect.length
        });

        data.topics.forEach(item => {
            item.goodCount = item.good.length
        });


        try {
            await userController.addDistance(req.body.lat, req.body.lng, data.teams)
            await userController.addDistance(req.body.lat, req.body.lng, data.topics)
        } catch (err) {
            console.log(err)
        }
        res.send(data)
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

    //关注
    router.post('/interest', async (req, res) => {
        await User.findByIdAndUpdate(req.body.userid, {
            "$addToSet": {
                "interest": req.body.myid
            }
        })
        res.send({ success: true, msg: '关注成功' })
    })

    //获取收藏列表
    router.post('/user/collection', async (req, res) => {
        const collections = await Team.find({
            collect: req.body.id
        }, { postUrl: 1, locationName: 1, good: 1, collect: 1, location: 1 })
            .populate('owner', 'nickName avatarUrl intro').lean()

        await userController.addDistance(req.body.lat, req.body.lng, collections)

        const data = collections.map(item => {
            item.goodCount = item.good.length
            item.collectCount = item.collect.length
            return item
        })
        res.send(data)
    })

    //获取评论信息
    router.get('/messages/comment/:id', async (req, res) => {
        const teams = await Team.find({
            owner: req.params.id
        }, { _id: 1 })
        const teamIdArr = teams.map(v => v._id)

        const topics = await Topic.find({
            owner: req.params.id
        }, { _id: 1 })
        const topicIdArr = topics.map(v => v._id)
        const idArr = teamIdArr.concat(topicIdArr)
        const comments = await Comment.find({
            to: { $in: idArr }
        }).populate('owner', 'nickName avatarUrl')
            .lean()
        res.send(comments)
    })

}
