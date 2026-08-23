<template>
  <div class="card p-6">
    <div class="flex items-center">
      <div class="p-3 rounded-lg" :class="iconBgClass">
        <UsersIcon v-if="icon === 'users'" class="w-6 h-6" :class="iconClass" />
        <FolderIcon v-else-if="icon === 'folder'" class="w-6 h-6" :class="iconClass" />
        <InboxIcon v-else-if="icon === 'inbox'" class="w-6 h-6" :class="iconClass" />
        <CurrencyDollarIcon v-else-if="icon === 'currency'" class="w-6 h-6" :class="iconClass" />
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ displayValue }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  UsersIcon,
  FolderIcon,
  InboxIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  color: {
    type: String,
    default: 'blue'
  },
  isCurrency: {
    type: Boolean,
    default: false
  }
})

const displayValue = computed(() => {
  if (props.isCurrency) {
    return props.value
  }
  return typeof props.value === 'number' ? props.value.toLocaleString() : props.value
})

const iconBgClass = computed(() => {
  const classes = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100'
  }
  return classes[props.color] || classes.blue
})

const iconClass = computed(() => {
  const classes = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  }
  return classes[props.color] || classes.blue
})
</script>
