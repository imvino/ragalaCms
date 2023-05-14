let axios = require("axios");
let urlSlug = require("url-slug");
let wasabi = require("../../../components/wasabi")
let actor = [10, 11, 12, 13, 14, 15, 17, 21, 25, 26, 27, 28, 30, 31, 33, 34, 35, 36, 37, 38, 39, 49, 55, 58, 60, 62]
let actress = [16, 20, 22, 23, 24, 29, 32, 40, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 56, 57, 59, 61, 63]
let genre = ['Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Short', 'Sport', 'Thriller', 'War', 'Western']
const mysql = require('serverless-mysql')({
    config: {
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    }
})
let ref = {
    'articles_editorial': 'edit',
    'articles_interviews': 'inter',
    'articles_news': 'news',
    'articles_press_releases': 'press',
    'local_events_events': 'events',
    'movies_function': 'func',
    'movies_names_title': 'title',
    'movies_photos': 'mphoto',
    'movies_poster': 'poster',
    'movies_reviews': 'review',
    'starzone_filmpersonal': 'person',
    'starzone_photos': 'sphoto',
}
let dbList = Object.keys(ref).concat('local_events_location')
let loc = {
    '["movies"]': ['movies_function', 'movies_photos', 'movies_poster',],
    '["articles"]': ['movies_names_title', 'movies_reviews', 'articles_editorial', 'articles_interviews', 'articles_press_releases', 'articles_news'],
    '["starzone"]': ['starzone_photos', 'starzone_filmpersonal'],
}

function getLoc(db) {
    let g = Object.keys(loc).map((v, i) => {
        console.log(loc[v].includes(db))
        return loc[v].includes(db) ? v : null
    })
    let g1 = g.filter(v => v != null)
    return g1.length == 1 ? g1[0] : '["all"]'
}

async function genreLink() {
    let data = await mysql.query(`SELECT * FROM link_movies_names_title_movie_genre where 1 ORDER BY c_date desc limit 1`)
    if (data.length != 0) {
        let rid = data[0].movies_names_title_rid;
        let data2 = await mysql.query(`SELECT * FROM link_movies_names_title_movie_genre where movies_names_title_rid='${rid}'`)
        let g = data2.length != 0 ? data2?.map(v => genre[v.movie_genre_id - 1]).toString() : null
        await mysql.query(`UPDATE movies_names_title SET genre='${g}' where rid='${rid}'`)
    }
}

async function bitly(url) {
    var config = {
        method: 'post',
        url: 'https://api-ssl.bitly.com/v4/shorten',
        headers: {
            'Authorization': 'Bearer ' + process.env.BITLY,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({"long_url": "https://www.ragalahari.com" + url, "domain": "rglhri.in"})
    };

    let data = await axios(config)
        .then(function (response) {
            return response.data.link
        })
        .catch(function (error) {
            console.log(error);
        });
    return data
}

async function updateBitly(url, db, rid) {
    let bit = await bitly(url)
    if (bit) {
        console.log(`UPDATE ${db} SET nurl = '${url}',bitly = '${bit}' where rid='${rid}'`)
        await mysql.query(`UPDATE ${db} SET nurl = '${url}',bitly = '${bit}' where rid='${rid}'`)
    }
}

async function nullify(l_tbl, l_col, tbl, col) {
    let results = await mysql.query(`SELECT distinct(${l_col}) FROM ${l_tbl}`)
    await mysql.query(`UPDATE ${tbl} SET ${col}=NULL WHERE rid not in (${results.map(v => v[l_col])})`)
}

async function linker(db, l_tbl, l_col, rid, key, catgen = false) {
    let id = await mysql.query(`SELECT * FROM ${l_tbl} where 1 ORDER BY c_date desc limit 1`)
    if (id.length != 0) {
        let r2 = await mysql.query(`SELECT * FROM ${l_tbl} where ${l_col}='${id[0][l_col]}'`)
        let array = r2.map(v => v[rid])?.toString()
        await mysql.query(`UPDATE ${db} SET ${key}='${array}' where rid='${id[0][l_col]}'`)
        if (catgen) {
            let f = await mysql.query(`SELECT * FROM starzone_photos where filmPersonalName='${id[0][l_col]}' limit 1`)
            let data = (f.map(v => v.rid))
            data.map(async (rid, i) => {
                await mysql.query(`UPDATE starzone_photos SET catgen='${array}' where rid='${rid}'`)
            })
        }
    }
}

async function highlight(db, loc, v) {
    let results = await mysql.query(`SELECT count(*) as c FROM highlights WHERE ref='${ref[db]}${v.rid}'`)
    let refId = `'${ref[db] + v.rid}'`

    if (results[0].c == 0) {
        if (v.highlight == 1) {
            let title = v.title ? `'${v.title}'` : v.heading ? `'${v.heading}'` : v.eventName ? `'${v.eventName}'` :
                v.movieName ? `'${v.movieName}'` : v.name ? `'${v.name}'` : null

            let image = v.image ? `'${v.image}'` : v.interviewImage ? `'${v.interviewImage}'` : v.newsImage ? `'${v.newsImage}'` :
                v.pressReleaseImage ? `'${v.pressReleaseImage}'` : v.path ? `'${v.path + v.imageName + '-4x.jpg'}'` :
                    v.imageLink ? `'${v.imageLink}'` : v.reviewImage ? `'${v.reviewImage}'` : v.thumbnail ? `'${v.thumbnail}'` :
                        v.fileLocation ? `'${v.fileLocation + '/' + v.imageName + '1t.jpg'}'` : null

            let url = v.nurl ? `'${v.nurl}'` : null
            console.log(loc, 'thisloc')
            loc = loc.match(/[a-z-]+/)
            loc = loc ? `'["${loc[0]}"]'` : `["all"]`
            let r = await mysql.query(`INSERT INTO highlights(title, image_url, url, active, ref, display_location) VALUES (${title},${image},${url},'1',${refId},${loc})`)
            if (r.insertId) {
                await mysql.query(`UPDATE ${db} SET ref=${r.insertId} WHERE rid=${v.rid}`)
            }
        }
    } else {
        console.log(`UPDATE highlights SET active=${v.highlight} WHERE ref=${refId}`)
        let r = await mysql.query(`UPDATE highlights SET active=${v.highlight} WHERE ref=${refId}`)
    }
}

async function newUrl(db, payload, id) {
    console.log(db, payload, id,'newor')
    let r1 = []
    if (dbList.includes(db)) {
        console.log(`SELECT * FROM ${db} where rid = ${id}`)
        r1 = await mysql.query(`SELECT * FROM ${db} where rid = ${id}`)
    }
    if (db === 'local_events_events') {
        if (payload?.permaLink) {
            r1.map(async (v, i) => {
                let url = `/events/local-events/${v.rid}/${urlSlug(v.permaLink)}`
                updateBitly(url, db, v.rid)
                if ( payload?.path && i == 0) {
                    wasabi(db, url)
                }
            })
        }else if (payload?.path && r1[0].nurl) {
            await wasabi(db, r1[0].nurl)
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
        if (payload?.film_personals) {
            await linker(db, `link_local_events_events_starzone_filmpersonal`, `local_events_events_rid`, `starzone_filmpersonal_rid`, `filmPersonals`)
        }
    }
    if (db === 'local_events_location') {
        console.log(payload?.locationName,'fdghfdgh');
        if (payload?.locationName) {
            r1.map(async (v, i) => {
                let url = `/events/info/${v.rid}/${urlSlug(v.locationName)}`
                updateBitly(url, db, v.rid)
            })
        }
    }

    if (db === 'movies_function' || db === 'movies_photos' || db === 'movies_poster') {
        let sub = {'movies_function': 'functions', 'movies_photos': 'photos', 'movies_poster': 'poster-designs'}
        if (payload?.permaLink || payload?.type) {
            r1.map((v, i) => {
                let rid = v.rid
                let gallery = v.permaLink ? urlSlug(v.permaLink) : urlSlug(v.title)
                if (db === 'movies_photos') {
                    sub[db] = v.fileLocation.includes('/includes/working/') ? 'working-stills' : 'photos'
                }
                let url = `/movies/${sub[db]}/${rid}/${gallery}`
                if (url != '') {
                    updateBitly(url, db, v.rid)
                }
                console.log(payload?.fileLocation,payload?.path,i,url,'hookspay')
                if ((payload?.fileLocation || payload?.path) && i === 0) {
                    wasabi(db, url)
                }
            });
        } else if (payload?.path && r1[0].nurl) {
            await wasabi(db, r1[0].nurl)
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
    }
    if (db === 'starzone_filmpersonal') {
        if (payload?.category_) {
            await linker(db, `link_starzone_filmpersonal_starzone_filmpersonal_category`, `starzone_filmpersonal_rid`, `starzone_filmpersonal_category_rid`, `category`, true)
        }
        if (payload?.permaLink) {
            r1.map(async (v, i) => {
                let url = `/starzone/profile/${v.rid}/${urlSlug(v.permaLink)}`
                updateBitly(url, db, v.rid)
            })
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
    }
    if (db === 'starzone_photos') {
        if (payload?.gender || payload?.permaLink) {
            r1.map(async (v, i) => {
                let gallery = urlSlug(v.permaLink)
                let d = JSON.parse('[' + v['catgen'] + ']')
                let male = actor.filter(element => d.includes(element)).length;
                let female = actress.filter(element => d.includes(element)).length;
                let url = '', gender = '0'
                if (male) url = `/starzone/actor/${v.rid}/${gallery}`, gender = 0
                if (female) url = `/starzone/actress/${v.rid}/${gallery}`, gender = 1
                if (url == '') {
                    if (v.gender == '0') url = `/starzone/actor/${v.rid}/${gallery}`
                    if (v.gender == '1') url = `/starzone/actress/${v.rid}/${gallery}`
                }
                if (url != '') {
                    updateBitly(url, db, v.rid)
                }
                if (payload?.path && i === 0) {
                    await wasabi(db, url)
                }
            })
        } else if (payload?.path && r1[0].nurl) {
            await wasabi(db, r1[0].nurl)
        }
        if (payload?.film_personal_name) {
            const data = await mysql.query(`SELECT * FROM starzone_filmpersonal where rid = ${payload.film_personal_name} LIMIT 1`)
            data.map(async (v, i) => {
                await mysql.query(`UPDATE ${db} SET catgen='${v.category}' where rid='${id}'`)
            })
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
    }
    if (db === 'movies_names_title') {
        if (payload?.movieName || payload?.permaLink) {
            r1.map(async (v, i) => {
                let gallery = v.permaLink ? urlSlug(v.permaLink) : `${urlSlug(v.movieName)}-telugucinema-cast-crew`
                let url = `/movies/${v.rid}/${gallery}`
                updateBitly(url, db, v.rid)
            })
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
        if (payload?.film_personals) {
            await linker(db, `link_movies_names_title_starzone_filmpersonal`,
                `movies_names_title_rid`, `starzone_filmpersonal_rid`, `filmPersonals`)
        }
        if (payload?.genre_) {
            if (payload.genre_.length === 0) {
                await nullify('link_movies_names_title_movie_genre', 'movies_names_title_rid', db, 'genre')
            } else {
                await genreLink()
            }
        }
    }
    if (db === 'movies_reviews' || db === 'articles_editorial' || db === 'articles_interviews' || db === 'articles_press_releases' || db === 'articles_news') {
        let sub = {
            'movies_reviews': `movie-reviews`, 'articles_editorial': `editorial`, 'articles_interviews': `interviews`,
            'articles_press_releases': 'press-releases', 'articles_news': 'news'
        }
        if (payload?.permaLink) {
            r1.map(async (v, i) => {
                let url = `/articles/${sub[db]}/${urlSlug(v.permaLink)}`
                updateBitly(url, db, v.rid)
            })
        }
        if (payload?.highlight) {
            await highlight(db, getLoc(db), r1[0])
        }
        if (db === 'articles_news' && payload.film_personals) {
            if (payload.film_personals.length === 0) {
                await nullify(`link_articles_news_starzone_filmpersonal`, 'articles_news_rid', db, 'filmPersonals')
            } else if (payload?.film_personals) {
                await linker(db, `link_articles_news_starzone_filmpersonal`, `articles_news_rid`, `starzone_filmpersonal_rid`, `filmPersonals`)
            }
        }
    }
    if (db === 'highlights' && payload?.active) {
        dbList.map(dl => {
            mysql.query(`UPDATE ${dl} set highlight='${payload.active}' WHERE ref='${id}'`)

        })
    }
}

module.exports = async function registerHook({filter, action}) {
    action('items.create', (out) => {
        console.log(out, 'funfact')
        if (dbList.includes(out.collection)) {
            newUrl(out.collection, out.payload, out.key)
        }
    });
    action('items.update', (out) => {
        console.log(out.payload.film_personals, 'film_personals')
        console.log(out, 'updater')
        if (dbList.includes(out.collection) || out.collection === 'highlights') {
            newUrl(out.collection, out.payload, out.keys[0])
        }
    });
    action('items.delete', (out) => {
        console.log(out, 'kannama')
        let delUrl = {
            'movies_poster': '/movies/poster-designs/',
            'movies_photos': '/movies/working-stills/',
            'movies_function': '/movies/functions/',
            'local_events_events': '/events/local-events/',
            'starzone_photos': '/starzone/actress/'
        }
        let db = out.collection
        if (db === 'movies_poster' || db === 'movies_photos' || db === 'movies_function' || db === 'local_events_events' || db === 'starzone_photos') {
            out.payload.map(v => {
                mysql.query(`DELETE FROM wasabi WHERE url like '${delUrl[db] + v}%'`)
                if (db === 'movies_photos') {
                    mysql.query(`DELETE FROM wasabi WHERE url like '${'/movies/photos/' + v}%'`)
                }
                if (db === 'starzone_photos') {
                    mysql.query(`DELETE FROM wasabi WHERE url like '${'/starzone/actor/' + v}%'`)
                }
            })
        }
        if (out.collection === 'highlights') {
            out.payload.map(v => {
                dbList.map(async dl => {
                    await mysql.query(`UPDATE ${dl} SET highlight='0', ref=null WHERE ref=${v}`)
                })
            })
        } else if (ref[db]) {
            out.payload.map(v => {
                mysql.query(`DELETE FROM highlights WHERE ref='${ref[db]}${v}'`)
            })
        }
    });
};
