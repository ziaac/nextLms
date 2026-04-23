'use client'

import { ListTodo } from 'lucide-react'

export default function TodoPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <ListTodo className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">ToDo</p>
        <p className="text-sm text-gray-400 mt-1">Fitur ini sedang dalam pengembangan.</p>
      </div>
    </div>
  )
}
