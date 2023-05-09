import ModuleComponent from './module.vue';

export default {
    id: 'gallery',
    name: 'Gallery',
    icon: 'gallery',
    routes: [
        {
            path: '',
            component: ModuleComponent,
        },
    ],
};

