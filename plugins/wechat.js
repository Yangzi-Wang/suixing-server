const request = require("request")
const User = require('../models/User')


const use = {}

use.open = function (opts) {
    return new Promise(function (resolve, reject) {
        request(opts, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body)
            } else {
                reject()
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
        data.city = r1.result.ad_info.city
        res.send(data)

    }, error => {
        console.log(error)
    })
}
module.exports = userController