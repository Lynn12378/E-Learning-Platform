<template>
  <iframe
    v-if="pdfUrl"
    height="800px"
    :src="pdfUrl"
    style="border: none;"
    width="100%"
  />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import config from '@/config';

  const route = useRoute();
  const pdfUrl = ref<string>('');

  onMounted(async () => {
    const id = route.query.id;
    if (typeof id === 'string') {
      try {
        const res = await axios.get(`${config.backendUrl}/materials/${id}`);
        const material = res.data;
        if (material.category === 'PDF') {
          pdfUrl.value = material.path;
        }
      } catch (err) {
        console.error('讀取 PDF 失敗', err);
      }
    }
  });
</script>
