<template>
    <div>
        <label>Custom ID Field</label>
        <div>{{ customValue }}</div>
    </div>
</template>

<script>
    export default {
        props: {
            value: {
                type: String,
                default: '',
            },
        },
        computed: {
            customValue() {
                // You can use any transformation based on the value prop
                return `/9/${this.value}`;
            },
        },
    };
</script>

<style scoped>
    /* Add custom styles if needed */
</style>
