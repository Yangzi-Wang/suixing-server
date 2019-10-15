const request = require("request")
const User = require('../models/User')
const Comment = require('../models/Comment')

const use = {}

use.open = function (opts) {
    return new Promise(function (resolve, reject) {
        request(opts, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body)
            } else {
                reject(error)
            }
        })
    })
}



let userController = {}

userController.login = function (req, res) {
    let appId = "wx6c5657bed2744574"
    let secret = "e1ef28e85b3a1e24b8e50c38f4e292bc"
    let js_code = req.body.code
    // let encryptedData = req.body.encryptedData
    // let iv = req.body.iv
    let opts = {
        url: `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`
    }

    use.open(opts).then(async val => {
        let r1 = JSON.parse(val)
        // let pc = new WXBizDataCrypt(appId,r1,session_key)
        // let data = pc.decryptData(encryptedData,iv)

        const data = await User.findOne({
            openid: r1.openid
        }, { nickName: 1 })
        // console.log(data)
        if (data) {
            res.send(data._id)
        } else {
            const model = await User.create({ openid: r1.openid })
            res.send(model._id)
        }

    }, error => {
        console.log(error)
    })
}

userController.reverseGeocoder = function (req, res) {
    let key = 'JPLBZ-P2Q3I-GNXG6-5WX4P-3RFBS-QMBRG'
    let lat = req.body.lat
    let lng = req.body.lng
    let opts = {
        url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}`
    }
    use.open(opts).then(async val => {
        let r1 = JSON.parse(val)
        let data = {}
        if (r1.status == 0) {
            if (r1.result.ad_info) data.city = r1.result.ad_info.city
        } else {
            res.status(r1.status).send({
                msg: r1.message
            })
        }
        res.send(data)

    }, error => {
        console.log(error)
    })
}

userController.getCity = function (lat, lng) {
    return new Promise(function (resolve, reject) {
        let key = 'JPLBZ-P2Q3I-GNXG6-5WX4P-3RFBS-QMBRG'
        let opts = {
            url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}`
        }
        use.open(opts).then(async val => {
            let r1 = JSON.parse(val)
            resolve(r1.result.address_component.city)

        }, error => {
            console.log(error)
            reject()
        })
    })
}

userController.getDistance = function (from, to) {
    return new Promise(function (resolve, reject) {
        let key = 'JPLBZ-P2Q3I-GNXG6-5WX4P-3RFBS-QMBRG'
        let opts = {
            url: `https://apis.map.qq.com/ws/distance/v1/?mode=walking&from=${from}&to=${to}&key=${key}`
        }
        use.open(opts).then(async val => {
            let r1 = JSON.parse(val)
            // console.log(r1)
            if (r1.status == 0)
                resolve(r1.result.elements)
            else {
                console.log(r1.message)
                reject(r1.message)
            }

        }, error => {
            console.log('网络错误', error)
            reject(error)
        })
    })
}

userController.addDistance = function (lat, lng, arr) {
    return new Promise(async function (resolve, reject) {
        const from = lat + ',' + lng;
        let to = '';

        arr.forEach((item, index) => {
            const slpitStr = (index == arr.length - 1) ? '' : ';';
            to += item.location[0] + ',' + item.location[1] + slpitStr;
        })

        try {
            if (arr.length) {
                //获取距离信息，并合并到数据中
                const distanceArr = await userController.getDistance(from, to)
                arr.forEach((item, index) => {
                    // console.log(distanceArr[index].distance)
                    // Object.assign(item, {distance:distanceArr[index].distance})
                    item.distance = distanceArr[index].distance
                })
                resolve()
                // console.log(arr)
            } else { resolve() }
        } catch (err) {
            console.log('获取测距数据失败', err);
            arr.map((item) => {
                return Object.assign(item, { distance: '0' })
            })
            reject(err)
        }
    })
}

userController.addCommentCount = function (objs) {
    return new Promise(async function (resolve, reject) {

        try {
            const cmArr = await Comment.aggregate([
                // {$match: {}},
                { $group: { _id: '$to', total: { $sum: 1 } } }
            ])
            objs.forEach(item => {
                const cm = cmArr.filter(i => {
                    return i._id.toString() == item._id
                })
                if (cm[0])
                    item.commentCount = cm[0].total
            })
            resolve()

        } catch (err) {

            reject(err)
        }
    })
}


module.exports = userController