<template>
  <v-container>
    <template v-if="!editCourseMode">
      <v-card v-if="course" class="mb-6 pa-4">
        <v-img
          color="surface-variant"
          cover
          height="200"
          :src="course.imgPath"
        />
        <h2 class="text-h5 font-weight-bold mt-5">{{ course.name }}</h2>
        <p class="text-body-2 text-grey-darken-1 mb-2">{{ course.category }}</p>
        <p class="text-body-2">{{ course.description }}</p>
        <v-card-text class="text-grey-darken-1 float-end">
          {{ formatDate(course.createdTime) }}
        </v-card-text>
      </v-card>

      <v-skeleton-loader v-else class="mb-6 pa-4" type="card" />
    </template>
    <template v-else>
      <v-card v-if="course" class="mb-6 pa-4">
        <v-img
          color="surface-variant"
          cover
          height="200"
          :src="course.imgPath"
          @click="imageDialog=true"
        />
        <h2 class="text-h5 font-weight-bold mt-5">
          <input v-model="course.name" class="text-h5 font-weight-bold" type="text">
        </h2>
        <v-autocomplete
          v-model="course.category"
          class="w-50 mt-2"
          density="compact"
          :items="categories"
          label="類別"
          single-line
          variant="outlined"
        />
        <v-textarea
          v-model="course.description"
          auto-grow
          label="課程描述"
          variant="outlined"
        />
      </v-card>

      <v-skeleton-loader v-else class="mb-6 pa-4" type="card" />
    </template>
    <div class="d-flex justify-end mb-4">
      <v-btn v-if="!editChapterMode" class="mr-2" color="primary" @click="toggleCourseEdit">
        {{ editCourseMode ? '完成' : '編輯課程' }}
      </v-btn>

      <v-btn v-if="editChapterMode" color="success" @click="dialog = true">
        新增章節
      </v-btn>

      <v-btn v-if="!editCourseMode" class="ml-2" color="primary" @click="toggleChapterEdit">
        {{ editChapterMode ? '完成' : '編輯章節' }}
      </v-btn>

      <v-btn v-if="editChapterMode" class="ml-2" color="grey" @click="cancelChapterEdit">
        取消
      </v-btn>

      <v-btn v-if="editCourseMode" class="ml-2" color="grey" @click="cancelCourseEdit">
        取消
      </v-btn>
    </div>

    <v-card>
      <v-container>
        <div v-if="chapters.length < 1 && !globalLoading" class="text-end">
          暫無章節
        </div>
        <draggable
          v-model="chapters"
          :disabled="!editChapterMode"
          handle=".drag-handle"
          item-key="id"
          @end="onDragEnd"
        >

          <template #item="{ element, index }">
            <div>
              <v-card
                class="mb-3 pa-3 d-flex align-center justify-space-between"
                elevation="2"
                @click="handleChapterClick(element.id)"
              >
                <div class="d-flex align-center">
                  <v-icon
                    v-if="editChapterMode"
                    class="drag-handle mr-3"
                    color="grey"
                  >
                    mdi-drag
                  </v-icon>
                  <div class="d-flex align-center">
                    <h4 class="mr-3">第 {{ index + 1 }} 章</h4>
                    <div v-if="editChapterMode">
                      <v-text-field
                        v-model="element.name"
                        density="compact"
                        hide-details
                        single-line
                        style="max-width: 300px; width: 30vw;"
                        variant="outlined"
                        @input="onInputChange"
                      />
                    </div>
                    <div v-else>
                      {{ element.name }}
                    </div>
                  </div>
                </div>
                <div v-if="editChapterMode">
                  <v-btn
                    v-if="editMaterialMode && currentChapterId==element.id"
                    class="ml-2"
                    color="success"
                    icon="mdi-check"
                    variant="text"
                    @click="toggleChapterEditMaterialMode(element.id)"
                  />
                  <v-btn
                    v-else-if="currentChapterId!=null"
                    class="ml-2"
                    disabled
                    icon="mdi-pencil"
                    variant="text"
                  />
                  <v-btn
                    v-else
                    class="ml-2"
                    color="primary"
                    icon="mdi-pencil"
                    variant="text"
                    @click="toggleChapterEditMaterialMode(element.id)"
                  />
                </div>
              </v-card>
              <v-expansion-panels>
                <v-expansion-panel>
                  <v-toolbar
                    v-if="editMaterialMode && currentChapterId == element.id"
                    border
                    class="mb-4 px-3"
                    density="compact"
                  >
                    <v-spacer />
                    <v-btn
                      icon="mdi-plus"
                      variant="text"
                      @click="openMaterialDialog(element.id)"
                    />
                    <v-btn
                      color="error"
                      icon="mdi-delete"
                      variant="text"
                      @click.stop="removeChapter(index)"
                    />
                    <v-btn
                      color="error"
                      icon="mdi-cancel"
                      variant="text"
                      @click="cancelMaterialEdit(element.id)"
                    />
                  </v-toolbar>

                  <div v-if="expandedChapters.includes(element.id)" class="pl-8 pr-4">
                    <draggable
                      v-if="currentChapterId === element.id"
                      v-model="materials[element.id]"
                      handle=".drag-handle-material"
                      item-key="id"
                      @end="onMaterialDragEnd"
                    >
                      <template #item="{ element: material, index: materialIndex }">
                        <v-list-item>
                          <div class="d-flex mb-5 justify-end">
                            <v-icon class="drag-handle-material mr-2" color="grey" size="20">mdi-drag</v-icon>
                            <v-text-field
                              v-model="material.name"
                              density="compact"
                              hide-details
                              style="max-width: 300px"
                              variant="outlined"
                              @input="onMaterialNameChange"
                            />
                            <v-btn
                              color="error"
                              icon="mdi-delete"
                              size="small"
                              variant="text"
                              @click.stop="removeMaterial(element.id, materialIndex)"
                            />
                          </div>
                        </v-list-item>
                      </template>
                    </draggable>

                    <v-list v-else density="compact">
                      <v-list-item
                        v-for="material in materials[element.id]"
                        :key="material.id"
                        @click="handleMaterialClick(material)"
                      >
                        <v-list-item-title v-if="material.category == 'PDF'">
                          <div class="d-flex justify-space-between">
                            <p>{{ material.name }}</p>
                            <p class="text-grey text-body-2"> {{ material.createdTime }}</p>
                          </div>
                        </v-list-item-title>
                        <v-list-item-title v-else>
                          <div class="d-flex justify-space-between">
                            <p class="text-primary">{{ material.name }}</p>
                            <p class="text-grey text-body-2">
                              <span class="mx-5 text-primary"> 下載 </span>
                              {{ material.createdTime }}
                            </p>
                          </div>
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </template>
        </draggable>
      </v-container>
    </v-card>
  </v-container>

  <addChapterDialog
    v-if="course"
    v-model:dialog="dialog"
    :course-id="course.id"
    :next-order-index="chapters.length + 1"
    @success="handleSuccess"
  />

  <addMaterialDialog
    v-if="showMaterialDialog"
    v-model:dialog="showMaterialDialog"
    :chapter-id="currentChapterId"
    :next-order-index="length"
    @success="handleMaterialSuccess"
  />

  <v-dialog v-model="imageDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">上傳課程圖片</span>
      </v-card-title>

      <v-card-text>
        <v-file-input
          v-model="imageFile"
          accept="image/png, image/jpeg"
          dense
          label="選擇圖片"
          prepend-icon="mdi-camera"
          variant="outlined"
        />
      </v-card-text>

      <v-card-actions>
        <v-btn text @click="imageDialog = false">取消</v-btn>
        <v-btn color="primary" @click="uploadImage">上傳</v-btn>
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

  <v-overlay
    class="d-flex align-center justify-center"
    :model-value="globalLoading"
    persistent
  >
    <v-progress-circular color="primary" indeterminate size="64" />
  </v-overlay>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  import draggable from 'vuedraggable'
  import addChapterDialog from '@/components/addChapterDialog.vue'
  import config from '@/config';

  interface CourseDTO {
    id: number
    name: string
    category: string
    description: string
    imgPath: string
    createdTime: string
  }

  interface ChapterDTO {
    id: number
    name: string
    orderIndex: number
    course_id: number
  }

  interface MaterialDTO {
    id: number
    name: string
    category: '圖片' | 'PDF' | 'Word文件' | 'PPT' | ''
    file: File | null
    path:string
    orderIndex: number
    chapterId: number
    createdTime: string
  }

  const route = useRoute()
  const router = useRouter()
  const courseId = Number(route.query.courseId)

  const course = ref<CourseDTO | null>(null)
  const chapters = ref<ChapterDTO[]>([])
  const expandedChapters = ref<number[]>([])
  const materials = ref<Record<number, MaterialDTO[]>>({})
  const currentChapterId = ref<number | null>(null)

  const editCourseMode = ref(false)
  const editChapterMode = ref(false)
  const editMaterialMode = ref(false)
  const hasChapterChanges = ref(false)
  const hasMaterialChanges = ref(false)
  const dialog = ref(false)
  const showMaterialDialog = ref(false)
  const imageDialog = ref(false)
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('')
  const globalLoading = ref(false)
  const length = ref<number>()
  const imageFile = ref<File | null>(null);
  const categories = ['程式語言', '商業管理', '設計', '語言學習']
  const downloadLink = ref('')
  onMounted(() => {
    fetchCourse()
  })

  const fetchCourse = async () => {
    globalLoading.value = true
    try {
      const res = await axios.get<CourseDTO>(`${config.backendUrl}/courses/${courseId}`)
      course.value = res.data
      fetchChapter()
    } catch (err) {
      console.error('載入課程失敗:', err)
      globalLoading.value = false
    }
  }

  const fetchChapter = async () => {
    try {
      const res = await axios.get<ChapterDTO[]>(`${config.backendUrl}/chapters/course/${courseId}`)
      chapters.value = res.data.sort((a, b) => a.orderIndex - b.orderIndex)
    } catch (err) {
      console.error('載入章節失敗:', err)
    } finally {
      globalLoading.value = false
    }
  }

  const fetchMaterials = async (chapterId: number) => {
    try {
      const res = await axios.get<MaterialDTO[]>(`${config.backendUrl}/materials/chapter/${chapterId}`)
      materials.value[chapterId] = res.data

    } catch (err) {
      console.error('暫無教材:', err)
      showSnackbar('暫無教材', 'error')
    }
  }

  const openMaterialDialog = (chapterId: number) => {
    currentChapterId.value = chapterId

    if(materials.value[chapterId]==null ){
      length.value = 1
    } else {
      length.value = materials.value[chapterId].length + 1
    }
    showMaterialDialog.value = true
  }

  const toggleCourseEdit = async () => {
    if (editCourseMode.value) {
      const confirmUpdate = window.confirm('確定要更新課程內容嗎？')
      if (!confirmUpdate) return
      await saveCourse()
    }

    editCourseMode.value = !editCourseMode.value
  }

  const toggleChapterEdit = async () => {
    if (editChapterMode.value && hasChapterChanges.value) {
      const confirmUpdate = window.confirm('確定要更新章節名稱或排序嗎？')
      if (!confirmUpdate) return
      await saveChapters()
    }
    editMaterialMode.value = false
    expandedChapters.value = []
    currentChapterId.value = null
    editChapterMode.value = !editChapterMode.value
  }

  const toggleChapterEditMaterialMode = async (chapterId: number) => {
    if (editMaterialMode.value && hasMaterialChanges.value) {
      const confirmUpdate = window.confirm('確定要更新教材名稱或排序嗎？')
      if (!confirmUpdate) return
      await saveMaterials(chapterId)
      hasMaterialChanges.value=false
    }

    if (!editMaterialMode.value) {
      currentChapterId.value = chapterId
      if (!expandedChapters.value.includes(chapterId)) {
        expandedChapters.value.push(chapterId)
      }
      if (!materials.value[chapterId]) {
        await fetchMaterials(chapterId)
      }
    } else {
      currentChapterId.value = null
      expandedChapters.value = []
    }

    editMaterialMode.value = !editMaterialMode.value
  }


  const onDragEnd = () => {
    hasChapterChanges.value = true
  }

  const onInputChange = () => {
    hasChapterChanges.value = true
  }

  const onMaterialNameChange = () => {
    hasMaterialChanges.value = true
  }

  const onMaterialDragEnd = () => {
    hasMaterialChanges.value = true
  }

  const cancelCourseEdit = async () => {
    const confirmCancel = window.confirm('確定要取消編輯嗎？未儲存的變更將會消失！')
    if (confirmCancel) {
      editCourseMode.value = false
      fetchCourse()
    }
  }

  const cancelChapterEdit = async () => {
    const confirmCancel = window.confirm('確定要取消編輯嗎？未儲存的變更將會消失！')
    if (confirmCancel) {
      editChapterMode.value = false
      fetchChapter()
    }
  }

  const cancelMaterialEdit = async (id:number) => {
    const confirmCancel = window.confirm('確定要取消編輯嗎？未儲存的變更將會消失！')
    if (confirmCancel) {
      editMaterialMode.value = false
      fetchMaterials(id)
      currentChapterId.value=null
      expandedChapters.value = []
    }
  }

  const uploadImage = async () => {
    if (!imageFile.value || !course.value){
      alert('請上傳圖片')
      return
    }

    globalLoading.value = true

    const data = new FormData()
    data.append('file', imageFile.value)

    try {
      const res = await axios.post(`${config.backendUrl}/upload/image`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      course.value.imgPath = res.data.img_url
      imageDialog.value = false
    } catch (err) {
      console.error('圖片上傳失敗', err)
    } finally {
      globalLoading.value = false
    }
  }

  const saveCourse = async () => {
    globalLoading.value = true

    try {
      await axios.put(`${config.backendUrl}/courses/${courseId}` , course.value)
      showSnackbar('課程更新成功！', 'success')
    } catch (err) {
      console.error('更新課程失敗:', err)
      showSnackbar('更新課程失敗', 'error')
    } finally {
      globalLoading.value = false
    }
  }

  const saveChapters = async () => {
    globalLoading.value = true
    chapters.value.forEach((chapter, index) => {
      chapter.orderIndex = index + 1
    })

    try {
      await axios.put(`${config.backendUrl}/chapters/`, chapters.value)
      showSnackbar('章節更新成功！', 'success')
    } catch (err) {
      console.error('更新章節失敗:', err)
      showSnackbar('更新章節失敗', 'error')
    } finally {
      hasChapterChanges.value = false
      globalLoading.value = false
    }
  }

  const saveMaterials = async (id: number) => {
    globalLoading.value = true
    materials.value[id].forEach((material, index) => {
      material.orderIndex = index + 1
    })

    try {
      await axios.put(`${config.backendUrl}/materials/`, materials.value[id])
      showSnackbar('教材更新成功！', 'success')
    } catch (err) {
      console.error('更新教材失敗:', err)
      showSnackbar('更新教材失敗', 'error')
    } finally {
      hasMaterialChanges.value = false
      globalLoading.value = false
    }
  }

  const removeChapter = async (index: number) => {
    const confirmDelete = window.confirm('確定要刪除這個章節嗎？')
    if (!confirmDelete) return

    globalLoading.value = true
    try {
      const chapterId = chapters.value[index].id
      await axios.delete(`${config.backendUrl}/chapters/${chapterId}`)
      chapters.value.splice(index, 1)
      showSnackbar('章節刪除成功！', 'success')
    } catch (err) {
      console.error('刪除章節失敗:', err)
      showSnackbar('刪除章節失敗', 'error')
    } finally {
      globalLoading.value = false
    }
  }

  const removeMaterial = async (chapterId: number, id: number) => {
    const confirmDelete = window.confirm('確定要刪除這個教材嗎？')
    if (!confirmDelete || !currentChapterId.value) return

    globalLoading.value = true

    try {
      const materialId = materials.value[chapterId][id].id
      await axios.delete(`${config.backendUrl}/materials/${materialId}`)
      materials.value[currentChapterId.value].splice(id, 1)
      showSnackbar('教材刪除成功！', 'success')
    } catch (err) {
      console.error('刪除教材失敗:', err)
      showSnackbar('刪除教材失敗', 'error')
    } finally {
      globalLoading.value = false
    }
  }

  const handleSuccess = (newChapter: ChapterDTO) => {
    chapters.value.push(newChapter)
    showSnackbar('章節新增成功！', 'success')
    fetchChapter()
  }

  const handleMaterialSuccess = async () => {
    if (currentChapterId.value != null) {
      showSnackbar('教材新增成功！', 'success')
      await fetchMaterials(currentChapterId.value)
    }
  }

  const handleChapterClick = (chapterId: number) => {
    if (editChapterMode.value) return

    const index = expandedChapters.value.indexOf(chapterId)
    if (index > -1) {
      expandedChapters.value.splice(index, 1)
    } else {
      expandedChapters.value.push(chapterId)
      if (!materials.value[chapterId]) {
        fetchMaterials(chapterId)
      }
    }
  }

  const handleMaterialClick = (dto: MaterialDTO) => {
    const materialType = dto.category;
    const materialId = dto.id;

    if (!materialType) {
      console.warn('找不到教材類型');
      return;
    }
    downloadLink.value = ''
    switch (materialType){
      case 'PDF':
        router.push(`/pdfReader?id=${materialId}`);
        break;
      default:
        window.open(dto.path, '_blank')
        break;
    }
  }

  const showSnackbar = (text: string, color: string) => {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

</script>
