<template>
  <v-dialog v-model="modelValue" max-width="400px">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        新增章節
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="newChapterName"
          label="章節名稱"
          required
          variant="outlined"
        />
      </v-card-text>

      <v-card-actions>
        <v-btn text @click="closeDialog">取消</v-btn>
        <v-spacer />
        <v-btn color="primary" @click="confirmAddChapter">新增</v-btn>
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
    courseId: number
    nextOrderIndex: number
  }>()

  const emit = defineEmits(['update:dialog', 'success'])

  const modelValue = computed({
    get: () => props.dialog,
    set: val => emit('update:dialog', val),
  })

  const newChapterName = ref('')

  const confirmAddChapter = async () => {
    if (!newChapterName.value.trim()) {
      alert('章節名稱不能空白')
      return
    }

    try {
      const payload = {
        name: newChapterName.value,
        orderIndex: props.nextOrderIndex,
        courseId: props.courseId,
      }

      const res = await axios.post(`${config.backendUrl}/chapters`, payload)

      console.log(res)

      emit('update:dialog', false)
      emit('success', res.data)
    } catch (err) {
      console.error('新增章節失敗:', err)
    } finally {
      newChapterName.value = ''
    }
  }

  const closeDialog = () => {
    emit('update:dialog', false)
  }
</script>
