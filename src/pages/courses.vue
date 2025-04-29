<template>
  <v-toolbar
    border
    class="mb-4 px-3"
    color="white"
    density="comfortable"
  >
    <v-spacer />
    <template v-if="!editMode">
      <v-autocomplete
        v-model="sortOrder"
        bg-color="white"
        density="compact"
        hide-details
        :items="['日期由新到舊', '日期由舊到新']"
        label="排序依據"
        single-line
        variant="outlined"
      />
    </template>
    <v-btn
      :color="editMode ? 'success' : 'grey'"
      icon
      :title="editMode ? '結束編輯' : '編輯課程'"
      @click="editMode = !editMode"
    >
      <v-icon>{{ editMode ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
    </v-btn>

    <template v-if="editMode">
      <v-btn
        class="ml-2"
        :title="isAllSelected ? '取消全選' : '全選'"
        variant="text"
        @click="toggleSelectAll"
      >
        <v-icon>{{ isAllSelected ? 'mdi-checkbox-multiple-marked-outline' : 'mdi-checkbox-multiple-blank-outline' }}</v-icon>
      </v-btn>
      <template v-if="selected.length > 0">
        <span class="ml-4 mr-2">已選 {{ selected.length }} 筆</span>
        <v-btn color="red" icon @click="confirmDeleteDialog = true">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </template>
  </v-toolbar>
  <div class="pa-4">
    <template v-if="!pageLoading && (!courses || courses.length === 0)">
      <v-alert
        border="start"
        elevation="2"
        type="info"
      >
        找不到課程
      </v-alert>
    </template>
    <template v-else>
      <v-container fluid grid-list-md>
        <v-row>
          <v-col
            v-for="course in courses"
            :key="course.id"
            cols="12"
            lg="3"
            md="4"
            sm="6"
          >
            <v-card
              class="ma-2"
              :elevation="selected.includes(course.id) ? 8 : 2"
              max-width="300"
              @click="handleCardClick(course)"
            >
              <v-img
                cover
                height="180px"
                :src="course.imgPath || 'https://fakeimg.pl/300x180/?text=No+Image&font=noto'"
              >
                <template #placeholder>
                  <v-skeleton-loader type="image" />
                </template>

                <template #default>
                  <div class="d-flex w-100 justify-end rounded">
                    <v-checkbox
                      v-if="editMode"
                      v-model="selected"
                      class="bg-grey-lighten-4 "
                      color="primary"
                      density="compact"
                      hide-details
                      :value="course.id"
                      @click.stop
                    />
                  </div>
                </template>
              </v-img>

              <v-card-title>{{ course.name }}</v-card-title>
              <v-card-subtitle class="text-grey">{{ course.category }}</v-card-subtitle>
              <v-card-text class="text-grey-darken-1">
                {{ formatDate(course.createdTime) }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div ref="scrollObserver" />
      </v-container>
    </template>

    <v-fab
      class="position-fixed"
      color="primary"
      icon="mdi-plus"
      style="bottom: 64px; right: 64px;"
      @click="dialog = true"
    />

    <addCourseDialog v-model:dialog="dialog" @success="handleSuccess" />

    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">確認刪除</v-card-title>
        <v-card-text>
          確定要刪除 {{ selected.length }} 筆課程嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDeleteDialog = false">取消</v-btn>
          <v-btn color="red" text @click="confirmDelete">確認</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      timeout="3000"
    >
      {{ snackbarText }}
    </v-snackbar>

    <v-overlay class="d-flex align-center justify-center" :model-value="globalLoading" persistent>
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>

    <div v-if="pageLoading && courses.length > 0" class="text-center my-4">
      <v-progress-circular color="primary" indeterminate />
    </div>
  </div>


</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  import addCourseDialog from '@/components/addCourseDialog.vue'
  import config from '@/config'

  interface CourseDTO {
    id: number
    name: string
    category: string
    description: string
    imgPath: string
    createdTime: string
  }

  interface PageResponse<T> {
    content: T[];
    totalElements: number;
  }

  const dialog = ref(false)
  const globalLoading = ref(false)
  const pageLoading = ref(false)
  const route = useRoute()
  const router = useRouter()
  const courses = ref<CourseDTO[]>([])
  const totalCourses = ref(0)
  const currentPage = ref(1)
  const pageSize = 12
  const scrollObserver = ref<HTMLDivElement | null>(null)

  const fetchCourses = async () => {
    pageLoading.value = true
    const hasMore = ref(true)
    const name = (route.query.name as string) || ''
    const category = (route.query.category as string) || ''
    const sortDirection = sortOrder.value === '日期由新到舊' ? 'desc' : 'asc'

    const params: Record<string, string> = {
      page: (currentPage.value - 1).toString(),
      size: pageSize.toString(),
      sort: `${sortDirection}`,
    }
    if (name) params.name = name
    if (category) params.category = category

    try {
      const res = await axios.get<PageResponse<CourseDTO>>(
        `${config.backendUrl}/courses`,
        { params }
      )
      const pageData = res.data

      if (currentPage.value === 1) {
        courses.value = pageData.content
      } else {
        courses.value.push(...pageData.content)
      }

      totalCourses.value = pageData.totalElements

      if (courses.value.length >= totalCourses.value) {
        hasMore.value = false
      }
    } catch (err) {
      console.error('載入課程失敗:', err)
    } finally {
      pageLoading.value = false
    }
  }

  const sortOrder = ref('日期由新到舊')

  const loadMoreCourses = () => {
    if (globalLoading.value || courses.value.length >= totalCourses.value) return
    currentPage.value += 1
    fetchCourses()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  onMounted(() => {
    fetchCourses()

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMoreCourses()
      }
    }, {
      rootMargin: '100px',
    })

    if (scrollObserver.value) {
      observer.observe(scrollObserver.value)
    }
  })

  watch(
    () => [route.query.name, route.query.category, sortOrder.value],
    () => {
      currentPage.value = 1
      courses.value = []
      fetchCourses()
    },
    { immediate: true }
  )

  const selected = ref<number[]>([])
  const editMode = ref(false)

  const toggleSelect = (id: number) => {
    const index = selected.value.indexOf(id)
    if (index > -1) {
      selected.value.splice(index, 1)
    } else {
      selected.value.push(id)
    }
  }

  const query: Record<string, number> = {}

  function handleCardClick (course: CourseDTO) {
    if (editMode.value) {
      toggleSelect(course.id)
    } else {
      query.courseId = course.id
      router.push({ path: '/chapters', query })
    }
  }

  const isAllSelected = computed(() =>
    courses.value.length > 0 && selected.value.length === courses.value.length
  )

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      selected.value = []
    } else {
      selected.value = courses.value.map(course => course.id)
    }
  }

  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('')

  const showSnackbar = (text: string, color: string) => {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  const confirmDeleteDialog = ref(false)

  const confirmDelete = async () => {
    confirmDeleteDialog.value = false
    globalLoading.value = true
    try {
      await Promise.all(
        selected.value.map(id =>
          axios.delete(`${config.backendUrl}/courses/${id}`)
        )
      )
      courses.value = courses.value.filter(course => !selected.value.includes(course.id))
      snackbarText.value = '刪除成功'
      snackbarColor.value = 'success'
      selected.value = []
    } catch (err) {
      console.error('刪除失敗:', err)
      snackbarText.value = '刪除失敗'
      snackbarColor.value = 'error'
    } finally {
      snackbar.value = true
      globalLoading.value = false
    }
  }

  const handleSuccess = () => {
    showSnackbar('課程建立成功！', 'success')
    fetchCourses()
  }
</script>
