const axios = require("axios") ;

let id = 1213
let table = 'movies_function'

async function f() {
    // let selPath = table == 'movies_poster'?'`fileLocation` as path':'path'
    // let sql = await mysql.query("SELECT "+selPath+" FROM `"+table+"` where `rid`=" + val.rid)
    // console.log('started', val.rid)

    const response = await axios.get(`http://localhost:8055/items/${table}?filter={"rid":${id}}&fields=rid,imageName`);
    console.log(JSON.stringify(response.data.data[0]))
    return
    if(response.data.data[0].wasabi.length !== 0) {

        const response2 = await axios.get(`http://localhost:8055/items/wasabi?filter={"id":{"_in":${response.data.data[0].wasabi}}}&fields=image`)
        let res = response2.data.data
        console.log(JSON.stringify(res))
    }

}
f()



