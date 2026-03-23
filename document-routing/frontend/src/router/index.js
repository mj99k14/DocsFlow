import { createRouter, createWebHistory } from 'vue-router'
import DocumentList from '../views/DocumentList.vue'
import DocumentDetail from '../views/DocumentDetail.vue'

const routes = [
  {
    path: '/',
    name: 'DocumentList',
    component: DocumentList
  },
  {
    path: '/documents/:id',
    name: 'DocumentDetail',
    component: DocumentDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
