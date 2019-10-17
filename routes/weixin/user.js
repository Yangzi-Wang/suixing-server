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
            // .populate('topics', 'content images locationName location good')
            .populate({
                path: 'topics',
                select: 'content images locationName location good owner updatedAt',
                populate: { path: 'owner', select: 'nickName avatarUrl' }
            })
            .populate({
                path: 'teams',
                select: 'postUrl locationName good collect location owner updatedAt',
                populate: { path: 'owner', select: 'nickName avatarUrl' }
            })
            //fail // .populate('teams', 'postUrl locationName good collect location owner.nickName owner.avatarUrl')
            .lean()

        const fans = await User.find({
            follow: req.body.id
        }, { _id: 1 })

        if (data.follow)
            data.followCount = data.follow.length
        else
            data.followCount = 0
        if (fans)
            data.fansCount = fans.length
        else
            data.fansCount = 0

        // data.teams.commentCount = comments.length
        // data.teams.forEach(item => {
        //     item.goodCount = item.good.length
        //     item.collectCount = item.collect.length
        // });

        // data.topics.forEach(item => {
        //     item.goodCount = item.good.length
        // });


        try {
            await userController.addDistance(req.body.lat, req.body.lng, data.teams)
            await userController.addDistance(req.body.lat, req.body.lng, data.topics)
            await userController.addCommentCount(data.teams)
            await userController.addCommentCount(data.topics)
        } catch (err) {
            console.log(err)
        }
        res.send(data)
    })

    //获取用户基本信息
    router.get('/userBasicInfo/:id', async (req, res) => {
        const model = await User.findById(req.params.id, {no:1,nickName:1,avatarUrl:1,intro:1,phone:1,wechat:1}).lean()
        res.send(model)
    })

    //更新用户基本信息
    router.put('/userBasicInfo', async (req, res) => {
        await User.findByIdAndUpdate(req.body.userid, {
            "$set": req.body.info
        })
        res.send({success:true})
    })

    //获取我的关注
    router.get('/user/follow/:id', async (req, res) => {
        const data = await User.findById(req.params.id, { follow: 1 })
            .populate('follow', 'nickName avatarUrl intro')
            .lean()
        res.send(data)
    })

    //获取我的粉丝
    router.get('/user/fans/:id', async (req, res) => {
        const data = await User.find({
            follow: req.params.id
        }, { nickName: 1, avatarUrl: 1, intro: 1 })
            .lean()
        res.send(data)
    })

    //关注
    router.post('/follow', async (req, res) => {
        await User.findByIdAndUpdate(req.body.userid, {
            "$addToSet": {
                "follow": req.body.myid
            }
        })
        res.send({ success: true, msg: '关注成功' })
    })

    //取消关注
    router.post('/followCancel', async (req, res) => {
        await User.findByIdAndUpdate(req.body.userid, {
            "$pull": {
                "follow": req.body.myid
            }
        })
        res.send({ success: true })
    })

    //获取收藏列表
    router.post('/user/collection', async (req, res) => {
        const collections = await Team.find({
            collect: req.body.id
        }, { postUrl: 1, locationName: 1, good: 1, collect: 1, location: 1, updatedAt: 1 })
            .populate('owner', 'nickName avatarUrl intro').lean()

        await userController.addDistance(req.body.lat, req.body.lng, collections)
        await userController.addCommentCount(collections)

        // const data = collections.map(item => {
        //     item.goodCount = item.good.length
        //     item.collectCount = item.collect.length
        //     return item
        // })
        res.send(collections)
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
