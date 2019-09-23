module.exports = router => {
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/suixing';

router.get('/test2',  (req, res) => {

MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
    if (err) throw err;
    // console.log(db);
    var dbase = db.db("suixing");
    // dbase.createCollection('site', function (err, res) {
    //     if (err) throw err;
    //     console.log("创建集合!");
        // db.close();
    // });
    // dbase.collection("teams"). find({}).toArray(function(err, result) { // 返回集合中所有数据
    //     if (err) throw err;
    //     // console.log(result);
    //     res.send(result)
    //     db.close();
    // });
    // dbase.collection("teams").aggregate([
    //     {
    //       $geoNear: {
    //          near: [23, 113],
    //          distanceField: "distance",
    //          spherical: true
    //       }  
    //     }
    //  ]).toArray(function(err, res) {
    //     if (err) throw err;
    //     console.log(JSON.stringify(res));
    //     db.close();
    //   });
    dbase.collection("teams").find(
        { 'location':
          { $geoNear :
                          [23, 113],
                        //  $distanceField: "distance",
                        //  $spherical: true
                      
            // { $geometry:
            // //   { type: "Point",  coordinates: [ 23, 113 ] }
            //     // $maxDistance: 1000
            // }
          }
        }
      ).toArray(function(err, result) {
        res.send(result)
        console.log(result);
        // db.close();
      });      
    
});
})
}

