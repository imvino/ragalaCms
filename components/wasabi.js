 const {S3Client,ListObjectsCommand }= require('@aws-sdk/client-s3')

const mysql = require('serverless-mysql')({
    config: {
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      //  host:'localhost',database:'ragalacms',user:'root',password:''
    }
})
// Connection
// This is how you can use the .aws credentials file to fetch the credentials
// const credentials = new AWS.SharedIniFileCredentials({profile: 'wasabi'});
// AWS.config.credentials = credentials;
// This is a configuration to directly use a profile from aws credentials file.
// AWS.config.credentials.accessKeyId = process.env.WASABIID
// AWS.config.credentials.secretAccessKey = process.env.WASABIKEY
// Set an endpoint.
// const ep = new AWS.Endpoint('s3.wasabisys.com');
// Create an S3 client
// const s3 = new AWS.S3({endpoint: ep});
 //
// const s3 = new S3({
//     region: 'us-east-1', // replace with your desired region
//     credentials: fromIni({
//         profile: 'wasabi',
//         accessKeyId: process.env.WASABIID,
//         secretAccessKey: process.env.WASABIKEY,
//     }),
//     endpoint: 'https://s3.wasabisys.com',
// });

const s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.WASABIID,
        secretAccessKey: process.env.WASABIKEY,
    },
    endpoint: 'https://s3.wasabisys.com',
});

let delCount = 15;
let counter = 0;
let mailCounter = 0;

module.exports = async function wasabi(table,nurl) {
    let bucket = ['img.ragalahari.com', 'media.ragalahari.com', 'starzone.ragalahari.com', 'imgcdn.ragalahari.com',
        'www1.ragalahari.com', 'imgcdn.raagalahari.com', 'img.raagalahari.com', 'timg.raagalahari.com', 'szcdn.ragalahari.com', 'www.ragalahari.com','szcdn1.ragalahari.com']
    //'gallery.ragalahari.com',media1.ragalahari.com,74.52.160.190,media1.ragalahari.com,www.ragalahari.net,www.telugudvdshop.com
//`wasabi` is null
    let _webUrl = table == 'movies_poster'?'`permaLink`,`nurl`':'`nurl`'

    let ids = await mysql.query("SELECT `rid`,"+_webUrl+",`imageName` FROM `"+table+"` where `wasabi` is null order by rid desc")
    async function run(val) {
        console.log(val)
        let selPath = table == 'movies_poster'?'`fileLocation` as path':'path'
        let sql = await mysql.query("SELECT "+selPath+" FROM `"+table+"` where `wasabi` is null and `rid`=" + val.rid)
        console.log('started', val.rid)
        if (sql[0]?.path) {
            let Orgin = sql[0].path.replace(/http:\/\//gi, '').split('/')
            let bucketName = Orgin[0] == bucket[0] || Orgin[0] == bucket[3] || Orgin[0] == bucket[4] ||
            Orgin[0] == bucket[5] || Orgin[0] == bucket[6] || Orgin[0] == bucket[7] ? bucket[0] : Orgin[0] == bucket[1] || Orgin[0] == bucket[9] ? bucket[1] :
                Orgin[0] == bucket[2] || Orgin[0] == bucket[8] || Orgin[0] == bucket[10] ? bucket[2] : 'noFile';

            let remove = bucket.concat('http:///').concat('Http:///')
            let prefix = sql[0].path

            if (prefix == 'http://www.ragalahari.com/images/') {
                prefix = 'gallery/' + val.imageName + '/'
            } else {
                remove.map(v => {
                    prefix = prefix.replace(v, '')
                })
            }
            console.log( bucketName, prefix)
            if (bucketName != 'noFile') {
                var params = {
                    Bucket: bucketName,
                    Prefix: prefix
                };
                const command = new ListObjectsCommand(params);
                s3.send(command).then(data => {
                // s3.listObjects(params, function (err, data) {
                    if (err) {
                        return 'There was an error viewing your album: ' + err.message
                    } else {
                        let wasabi = []
                        let prefixUrl=(prefix +'/'+val.imageName)?.replace('//','/')
                        let promises = data.Contents.map(async (obj, index) => {
                            if (obj.Key.includes('t.jpg') && obj.Key.includes(prefixUrl)) {
                                let imgNo = obj.Key.replace(prefixUrl, '').replace('t.jpg', '')
                                let url= val.nurl+`/image${imgNo}`;
                                let image = 'http://' + Orgin[0] + '/' + obj.Key.replace('t.jpg', '.jpg');
                                wasabi.push({id:0,url:url,image:image,imgNo:imgNo})
                            }

                        })
                        Promise.all(promises).then(async function (results) {
                            wasabi=wasabi.sort(function(a,b){return a.imgNo - b.imgNo})
                           let wasabiId= await wasabi.map(async (v,i)=> {
                                let sql = await mysql.query("SELECT count(*) FROM `wasabi` where `url`='" + v.url + "'")
                                if (sql[0]['count(*)'] == 0) {
                                    let sql2 = await mysql.query("INSERT INTO `wasabi`(`url`,  `image`) VALUES ('" + v.url + "','" + v.image + "')");
                                   return sql2.insertId
                                } else {
                                    let sql2 = await mysql.query("SELECT id FROM `wasabi` where `url`='" + v.url + "'")
                                    return sql2[0].id
                                }
                            })
                            Promise.all(wasabiId).then(async wasabi_id=>{
                                console.log("wasabi => UPDATE `"+table+"` SET wasabi='[" + wasabi_id + "]' where rid=" + val.rid)
                                let sql2 = await mysql.query("UPDATE `"+table+"` SET wasabi='[" + wasabi_id + "]' where rid=" + val.rid);
                                // if (wasabi.length == 0) {
                                //     console.log('not inserted ' + val.rid)
                                // } else {
                                //     console.log('inserted >> ' + val.rid)
                                // }
                                counter++
                                if (counter % delCount === 0) {
                                    console.log('new array')
                                    arr()
                                } else if (ids.length === 0) {
                                    console.log('zero array')
                                    arr()
                                } else {
                                    console.log(ids.length, counter, delCount)
                                }
                            });
                           // return
                        })
                    }
                })
            } else {
                let sql2 = await mysql.query("UPDATE `"+table+"` SET wasabi='[]' where rid=" + val.rid);
                console.log('noFile')
                arr()
            }
        } else {
            let sql2 = await mysql.query("UPDATE `"+table+"` SET wasabi='[]' where rid=" + val.rid);
            console.log('noPath')
            arr()
        }
    }
    async function arr() {
        if (ids.length === 0) {
            mailCounter++
            if (mailCounter === 1) {
                console.log('completed')
            }
            console.log(mailCounter)
            return
        }
        ids.splice(0, delCount).map((v, i) => {
            let permaLink =v.permaLink?v.permaLink:''
            console.log({rid: v.rid, nurl: nurl, imageName: v.imageName,permaLink:permaLink})
            run({rid: v.rid, nurl: nurl, imageName: v.imageName,permaLink:permaLink});
        })
    }
    arr()
}

