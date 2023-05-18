const axios = require("axios") ;

let id = 123933
let loc = 'movies_function'

async function f() {
    // let selPath = table == 'movies_poster'?'`fileLocation` as path':'path'
    // let sql = await mysql.query("SELECT "+selPath+" FROM `"+table+"` where `rid`=" + val.rid)
    // console.log('started', val.rid)
    let g = [4457135,4457136,4457137,4457138,4457139,4457140,4457141,4457142,4457143,4457144,4457145,4457146,4457147,4457148,4457149,4457150,4457151,4457152,4457153,4457154,4457155,4457156,4457157,4457158,4457159,4457160,4457161,4457162,4457163,4457164,4457165,4457166,4457167]

    console.log(g.length); return
    let selPath = loc === 'movies_poster'?'fileLocation':'path'
    const response = await axios.get(`http://localhost:8055/items/${loc}?filter={"rid":${id}}&fields=wasabi`);

    let obj = JSON.parse(response.data.data[0].wasabi)
    let wasabi = [1,2,4]

    console.log([...obj,...wasabi])

}
async function fd() {

    let lastId = await axios.get(`http://localhost:8055/items/wasabi?limit=1&sort=-id`);
    console.log(lastId.data.data[0].id)


}



f()