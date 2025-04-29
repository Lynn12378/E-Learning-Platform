<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-dialog v-model="modelValue" max-width="800px">
    <v-card>
      <!-- Header -->
      <v-card-title class="text-h6 font-weight-regular justify-space-between">
        <v-avatar class="mx-1" color="primary" size="22" v-text="step" />
        <span>{{ currentTitle }}</span>
      </v-card-title>

      <!-- Steps -->
      <v-window v-model="step">
        <!-- Step 1：課程資訊 -->
        <v-window-item :value="1">
          <v-form ref="formRef" v-model="formValid">
            <v-card-text>
              <v-autocomplete
                v-model="form.category"
                :items="categories"
                label="類別"
                :rules="categoryRules"
                variant="solo"
              />
              <v-text-field
                v-model="form.name"
                counter="100"
                label="課程名稱"
                :rules="nameRules"
                variant="outlined"
              />
              <v-textarea
                v-model="form.description"
                auto-grow
                label="課程描述"
                variant="outlined"
              />
              <span class="text-caption text-grey-darken-1">
                輸入課程名稱，長度不得超過100字
              </span>
            </v-card-text>
          </v-form>
        </v-window-item>

        <!-- Step 2：上傳圖片 -->
        <v-window-item :value="2">
          <v-form ref="formRef" v-model="formValid">
            <v-file-input
              v-model="form.image"
              accept="image/png, image/jpeg"
              class="mx-6 mt-5"
              label="只接受 .png、.jpg 檔案"
              placeholder="上傳課程圖片"
              prepend-icon="mdi-camera"
              :rules="imgRules"
              variant="outlined"
              @update:model-value="handleImageUpload"
            />
          </v-form>
        </v-window-item>

        <!-- Step 3：預覽 -->
        <v-window-item :value="3">
          <div class="pa-4 text-center">
            <v-img class="mb-4" height="128" :src="imageUrl || ''" />
            <h2 class="text-h6 font-weight-light mb-2">{{ form.name }}</h2>
            <div class="text-caption mt-2">{{ form.category }}</div>
            <div class="text-caption text-grey mt-2">{{ form.description }}</div>
          </div>
        </v-window-item>
      </v-window>

      <v-divider />

      <!-- Footer 按鈕 -->
      <v-card-actions>
        <v-btn v-if="step > 1" variant="text" @click="step--">上一步</v-btn>

        <v-btn v-if="step === 1" color="grey" variant="text" @click="closeDialog">
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
          建立課程
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, defineEmits, defineProps, ref } from 'vue'
  import axios from 'axios'
  import config from '@/config';

  const props = defineProps<{ dialog: boolean }>()
  const emit = defineEmits(['update:dialog', 'success'])

  const modelValue = computed({
    get: () => props.dialog,
    set: val => emit('update:dialog', val),
  })

  const step = ref(1)
  const formValid = ref(true)
  const formRef = ref()

  const form = ref({
    name: '',
    category: '',
    description: '',
    image: null as File | null,
  })

  const imageUrl = ref('')
  const categories = ['程式語言', '商業管理', '設計', '語言學習']

  const currentTitle = computed(() =>
    ['創建課程', '上傳課程圖片', '課程預覽'][step.value - 1]
  )

  const nextStep = async () => {
    if (step.value === 1 && formRef.value) {
      const result = await formRef.value.validate()
      if (!result.valid) return
    }
    if (step.value === 2 && !form.value.image) {
      alert('請上傳課程圖片')
      return
    }
    step.value++
  }

  const closeDialog = () => {
    emit('update:dialog', false)
    resetForm()
  }

  const handleImageUpload = async (files: File | File[]) => {
    const file = Array.isArray(files) ? files[0] : files
    if (!file) return

    const data = new FormData()
    data.append('file', file)

    try {
      const res = await axios.post(`${config.backendUrl}/upload/image`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      imageUrl.value = res.data.img_url
    } catch (err) {
      console.error('圖片上傳失敗', err)
    }
  }

  const submitForm = async () => {
    const formData = {
      name: form.value.name,
      category: form.value.category,
      description: form.value.description,
      imgPath: imageUrl.value,
      createdTime: null,
    }

    try {
      const res = await axios.post(`${config.backendUrl}/courses`, formData, {
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.data
      console.log('成功新增課程:', data)

      emit('update:dialog', false)
      emit('success')
      resetForm()
    } catch (err) {
      console.error('新增失敗:', err)
    }
  }

  const resetForm = () => {
    form.value = {
      name: '',
      category: '',
      description: '',
      image: null,
    }
    imageUrl.value = ''
    step.value = 1
    formRef.value?.reset()
  }

  // 驗證規則
  const categoryRules = [(v: string) => !!v || '請選擇類別']
  const nameRules = [
    (v: string) => !!v || '課程名稱為必填',
    (v: string) => v.length <= 100 || '最多 100 字',
  ]
  const imgRules = [
    (v: File | null) => !!v || '請選擇一個圖片檔案',
    (v: File | null) => {
      if (!v) return '請選擇一個圖片檔案'
      const type = v.type
      return (type === 'image/png' || type === 'image/jpeg') || '只接受 .png、.jpg 檔案'
    },
  ]
</script>
