import ModuleComponent from './module.vue';

export default {
    id: 'home',
    name: 'Dashboard',
    icon: 'home',
    routes: [
        {
            path: '',
            component: ModuleComponent,
        },
    ],
};


// import { ref } from 'vue';
// import LayoutComponent from './layout.vue';
//
// export default {
//     id: 'home',
//     name: 'Dashboard',
//     icon: 'home',
//     component: LayoutComponent,
//     slots: {
//         options: () => null,
//         sidebar: () => null,
//         actions: () => null,
//     },
//     setup() {
//         const name = ref('Custom Layout');
//
//         return { name };
//     },
// };

// import InterfaceComponent from './interface.vue';
//
// export default {
//     id: 'home',
//     name: 'Dashboard',
//     icon: 'home',
//     description: 'This is my custom interface!',
//     component: InterfaceComponent,
//     types: ['string'],
// };
