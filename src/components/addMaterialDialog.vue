<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-dialog v-model="modelValue" max-width="500px">
    <v-card>
      <!-- Header -->
      <v-card-title class="text-h6 font-weight-regular justify-space-between">
        <v-avatar class="mx-1" color="primary" size="22" v-text="step" />
        <span>{{ currentTitle }}</span>
      </v-card-title>

      <!-- Steps -->
      <v-window v-model="step">
        <!-- Step 1：輸入名稱 -->
        <v-window-item :value="1">
          <v-form ref="formRef" v-model="formValid">
            <v-card-text>
              <v-text-field
                v-model="form.name"
                counter="100"
                label="教材名稱"
                :rules="nameRules"
                variant="outlined"
              />
            </v-card-text>
          </v-form>
        </v-window-item>

        <!-- Step 2：上傳檔案 -->
        <v-window-item :value="2">
          <v-form ref="formRef" v-model="formValid">
            <v-card-text>
              <v-select
                v-model="form.category"
                class="mx-6"
                :items="materialTypes"
                label="檔案類型"
                :rules="typeRules"
                variant="outlined"
              />
              <v-file-input
                v-model="form.file"
                accept="image/png, image/jpeg, application/pdf, .docx, .pptx"
                class="mx-6 mt-5 truncate-filename"
                placeholder="選擇檔案"
                :rules="fileRules"
                variant="outlined"
                @update:model-value="handleFileUpload"
              />
            </v-card-text>
          </v-form>
        </v-window-item>

        <!-- Step 3：預覽 -->
        <v-window-item :value="3">
          <div class="pa-4 text-center">
            <h2 class="text-h6 font-weight-light mb-2">
              <a href="{{ form.path }}">
                {{ form.name }}
              </a>
            </h2>
            <div class="text-caption mt-2">{{ form.category }}</div>
            <div class="text-caption text-grey mt-2">{{ form.file ? form.file.name : '尚未選擇檔案' }}</div>
          </div>
        </v-window-item>
      </v-window>

      <v-divider />

      <!-- Footer 按鈕 -->
      <v-card-actions>
        <v-btn v-if="step > 1" variant="text" @click="step--">上一步</v-btn>

        <v-btn
          v-if="step === 1"
          color="grey"
          variant="text"
          @click="closeDialog"
        >
          取消
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="step < 3"
          color="secondary"
          variant="flat"
          @click="nextStep"
        >
          下一步
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          @click="submitForm"
        >
          新增教材
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, defineEmits, defineProps, ref } from 'vue'
  import axios from 'axios'
  import config from '@/config';

  const props = defineProps<{
    dialog: boolean
    chapterId: number
    nextOrderIndex: number
  }>()
  const emit = defineEmits(['update:dialog', 'success'])

  const modelValue = computed({
    get: () => props.dialog,
    set: val => emit('update:dialog', val),
  })

  const step = ref(1)
  const formValid = ref(true)
  const formRef = ref()

  const form = ref<{
    name: string
    category: '圖片' | 'PDF' | 'Word文件' | 'PPT' | ''
    file: File | null
    path:string
    orderIndex: number
    chapterId: number
    createdTime: string
  }>({
    name: '',
    category: '',
    file: null as File | null,
    path: '',
    orderIndex: props.nextOrderIndex,
    chapterId: props.chapterId,
    createdTime: '',
  })

  const materialTypes = ['圖片', 'PDF', 'Word文件', 'PPT']
  const currentTitle = computed(() => ['教材名稱', '上傳檔案', '教材預覽'][step.value - 1])

  const nextStep = async () => {
    if (step.value === 1 && formRef.value) {
      const result = await formRef.value.validate()
      if (!result.valid) return
    }
    if (step.value === 2 && !form.value.file) {
      alert('請選擇檔案')
      return
    }
    step.value++
  }

  const closeDialog = () => {
    emit('update:dialog', false)
    resetForm()
  }

  const handleFileUpload = async (files: File | File[]) => {
    const file = Array.isArray(files) ? files[0] : files
    if (!file) return

    const data = new FormData()
    data.append('file', file)

    try {
      const res = await axios.post(`${config.backendUrl}/upload/material`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      form.value.path = res.data.material_url
    } catch (err) {
      console.error('教材上傳失敗', err)
    }
  }

  const submitForm = async () => {

    const formData = new FormData()

    formData.append('name', form.value.name)
    formData.append('category', form.value.category)
    formData.append('path', form.value.path!)
    formData.append('orderIndex', form.value.orderIndex.toString())
    formData.append('chapterId', form.value.chapterId.toString())

    try {
      const res = await axios.post(`${config.backendUrl}/materials`, formData, {
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('成功新增教材:', res.data)

      emit('update:dialog', false)
      emit('success')
      resetForm()
    } catch (err) {
      console.error('新增教材失敗:', err)
    }
  }

  const resetForm = () => {
    form.value = {
      name: '',
      category: '',
      file: null,
      path: '',
      orderIndex: props.nextOrderIndex,
      chapterId: props.chapterId,
      createdTime: '',
    }
    step.value = 1
    formRef.value?.reset()
  }

  // 驗證規則
  const nameRules = [
    (v: string) => !!v || '教材名稱為必填',
    (v: string) => v.length <= 100 || '最多 100 字',
  ]
  const typeRules = [(v: string) => !!v || '請選擇檔案類型']
  const fileRules = [
    (v: File | null) => !!v || '請選擇檔案',
    (v: File | null) => {
      if (!v) return true

      const allowedTypes: Record<string, string[]> = {
        '圖片': ['image/png', 'image/jpeg'],
        'PDF': ['application/pdf'],
        'Word文件': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'PPT': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      }

      const selectedType = form.value.category
      if (selectedType && allowedTypes[selectedType]) {
        const validMimes = allowedTypes[selectedType]
        return validMimes.includes(v.type) || `請上傳正確格式的 ${selectedType} 檔案`
      }
      return '請先選擇檔案類型'
    },
  ]


</script>
