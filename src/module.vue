<template>
    <private-view title="Dashboard">
        <div class="dash_c">
            <table class="dash">
                <thead>
                <tr>
                    <th scope="col" colspan="2">Upcoming Birthdays</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="col in birthdays" v-bind:key="col.name">
                    <td><a v-bind:href="'/admin/content/starzone_filmpersonal/'+ col.rid "> {{ col.name }} </a></td>
                    <td><a v-bind:href="'/admin/content/starzone_filmpersonal/'+ col.rid "> {{ col.birthday }} </a></td>
                </tr>
                </tbody>
            </table>
            <table class="dash">
                <thead>
                <tr>
                    <th scope="col" colspan="2">Upcoming Death Anniversary</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="col in expired" v-bind:key="col.name">
                    <td><a v-bind:href="'/admin/content/starzone_filmpersonal/'+ col.rid "> {{ col.name }} </a></td>
                    <td><a v-bind:href="'/admin/content/starzone_filmpersonal/'+ col.rid "> {{ col.expiredDate }} </a></td>
                </tr>
                </tbody>
            </table>
            <table class="dash">
                <thead>
                <tr>
                    <th scope="col" colspan="2">Upcoming Movie Releases</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="col in upComingMovie" v-bind:key="col.movieName">
                    <td><a v-bind:href="'/admin/content/movies_names_title/'+ col.rid "> {{ col.movieName }} </a></td>
                    <td><a v-bind:href="'/admin/content/movies_names_title/'+ col.rid "> {{ col.releaseDate }} </a></td>
                </tr>
                </tbody>
            </table>
        </div>
    </private-view>
</template>

<script>
    const d = new Date();
    let day = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear()
    export default {
        data() {
            return {
                birthdays: null,
                upComingMovie: null,
                expired: null,
            };
        },
        methods: {
            // logToConsole: function () {
            //     console.log(this.collections);
            // },
        },
        inject: ['api'],
        mounted() {
            // log the system field so you can see what attributes are available under it
            // remove this line when you're done.
           // console.log(this.api);
            // Get a list of all available collections to use with this module
            this.api.get( `/items/starzone_filmpersonal?sort=month(birthday),day(birthday)&fields=rid,name,birthday&filter={"_or":[{"month(birthday)":{"_eq":"${month}"}},{"month(birthday)":{"_eq":"${month+1}"}}]}`).then((res) => {
                this.birthdays = res.data.data;
            });
            this.api.get( `/items/movies_names_title?fields=rid,movieName,releaseDate&sort=releaseDate&filter={"_and":[{"active": { "_eq": "1" },"releaseDate": { "_gt": "${year}-${month}-${day}"  }}],"releaseDate": { "_nstarts_with": "2099"  }}`).then((res) => {
                this.upComingMovie = res.data.data;
            });
            this.api.get( `/items/starzone_filmpersonal?sort=month(expiredDate),day(expiredDate)&fields=rid,name,expiredDate&filter={"_or":[{"month(expiredDate)":{"_eq":"${month}"}},{"month(expiredDate)":{"_eq":"${month+1}"}}]}`).then((res) => {
                this.expired = res.data.data;
            });
        },
    };
</script>
