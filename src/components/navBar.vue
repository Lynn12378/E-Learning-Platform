<template>
  <v-app-bar
    app
    density="compact"
    elevation="2"
  >
    <v-app-bar-nav-icon class="ml-5" readonly>
      <v-img
        alt="Logo"
        height="32"
        src="../assets/logo.png"
        width="32"
      />
    </v-app-bar-nav-icon>

    <v-app-bar-title class="mx-1">
      <router-link class="text-decoration-none text-black" to="/">數位學習平台</router-link>
    </v-app-bar-title>

    <v-spacer class="d-none d-md-flex" />
    <v-toolbar-items class="d-none d-md-flex align-center">
      <v-select
        v-model="selectedCategory"
        class="mr-4"
        clearable
        dense
        density="compact"
        hide-details
        :items="categories"
        label="分類"
        single-line
        style="width: 180px"
        variant="outlined"
      />
      <v-text-field
        v-model="searchText"
        append-inner-icon="mdi-magnify"
        class="mr-4"
        clearable
        density="compact"
        hide-details
        label="搜尋課程"
        :loading="globalLoading"
        single-line
        style="width: 300px"
        variant="outlined"

        @keyup.enter="searchCourse"
      />
      <v-btn class="mr-5" color="primary" @click="searchCourse">查詢</v-btn>
    </v-toolbar-items>

    <v-app-bar-nav-icon class="d-md-none mx-5" @click="drawer = !drawer" />
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    class="d-md-none"
    location="right"
    temporary
  >
    <v-list>
      <v-list-item>
        <v-select
          v-model="selectedCategory"
          class="mt-3"
          clearable
          hide-details
          :items="categories"
          label="分類"
          variant="outlined"
        />
      </v-list-item>
      <v-list-item>
        <v-text-field
          v-model="searchText"
          class="mt-3"
          clearable
          hide-details
          label="搜尋課程"
          variant="outlined"
          @keyup.enter="searchCourse"
        />
      </v-list-item>
      <v-list-item>
        <v-btn block color="primary" @click="searchCourse">查詢</v-btn>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const drawer = ref(false)
  const searchText = ref('')
  const selectedCategory = ref('')
  const router = useRouter()
  const globalLoading = ref(false)

  const categories = ['程式語言', '商業管理', '設計', '語言學習']

  const searchCourse = () => {
    globalLoading.value = true
    drawer.value = false
    const query: Record<string, string> = {}

    if (searchText.value && searchText.value.trim()) {
      query.name = searchText.value.trim()
    }
    if (selectedCategory.value) {
      query.category = selectedCategory.value
    }
    globalLoading.value = false
    router.push({ path: '/courses', query })
  }
</script>
