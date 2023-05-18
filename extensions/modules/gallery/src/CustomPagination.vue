<template>
    <nav v-if="totalPages > 1" aria-label="Pagination">
        <ul class="pagination">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="goToPage(currentPage - 1)">Previous</a>
            </li>
            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
                <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="goToPage(currentPage + 1)">Next</a>
            </li>
        </ul>
    </nav>
</template>

<script>
    export default {
        props: {
            total: {
                type: Number,
                required: true,
            },
            limit: {
                type: Number,
                required: true,
            },
            page: {
                type: Number,
                required: true,
            },
        },
        computed: {
            totalPages() {
              return Math.ceil(this.total / this.limit);
            },
            currentPage: {
                get() {
                    return this.page;
                },
                set(value) {
                    this.$emit('update:page', value);
                },
            },
        },
        methods: {
            goToPage(page) {
                if (page > 0 && page <= this.totalPages) {
                    this.currentPage = page;
                    this.$emit('pagination', page);
                }
            },
        },
    };
</script>

<style>
    .pagination {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 1em 0;
    }

    .page-item {
        margin-right: 5px;
    }

    .page-link {
        display: block;
        padding: 5px 10px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        text-decoration: none;
        color: #495057;
        cursor: pointer;
    }

    .page-item.disabled .page-link,
    .page-item.active .page-link {
        background: #495057;
        border-color: #495057;
        color: #fff;
        cursor: default;
    }

    .page-item.disabled .page-link:hover {
        background: #495057;
        border-color: #495057;
        color: #fff;
    }
</style>
