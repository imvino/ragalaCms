const axios = require("axios") ;

let id = 53258
let loc = 'movies_poster'

async function f() {
    // let selPath = table == 'movies_poster'?'`fileLocation` as path':'path'
    // let sql = await mysql.query("SELECT "+selPath+" FROM `"+table+"` where `rid`=" + val.rid)
    // console.log('started', val.rid)

    let selPath = loc === 'movies_poster'?'fileLocation':'path'
    const response2 = await axios.get(`http://localhost:8055/items/${loc}?filter={"rid":${id}}&fields=${selPath}`);
    let obj = response2.data.data[0]
    if (obj.hasOwnProperty('fileLocation')) {
        obj['path'] = obj['fileLocation']
        delete obj['fileLocation'];

    }
    console.log(obj)

}
f()


