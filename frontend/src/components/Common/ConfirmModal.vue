<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" @click="$emit('cancel')"></div>
          
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <!-- Icon Header -->
            <div class="pt-6 pb-2 flex justify-center">
              <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <!-- Content -->
            <div class="px-6 pb-6 text-center">
              <h2 class="text-xl font-bold text-slate-900 mb-2">{{ title }}</h2>
              <p class="text-slate-600">{{ message }}</p>
            </div>
            
            <!-- Actions -->
            <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
              <button @click="$emit('confirm')" class="btn btn-danger">
                <TrashIcon class="w-4 h-4 mr-1.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/vue/24/outline'

defineProps({
  title: String,
  message: String
})

defineEmits(['confirm', 'cancel'])
</script>
