import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { MediaItem } from '../../services/wordpress/types'

interface CSVLoadConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedFile: MediaItem) => void
  csvFiles: MediaItem[]
}

export default function CSVLoadConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  csvFiles,
}: CSVLoadConfirmDialogProps) {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)

  // Auto-select the most recent file when dialog opens or files change
  useEffect(() => {
    if (isOpen && csvFiles.length > 0) {
      setSelectedFileId(csvFiles[0].id)
    }
  }, [isOpen, csvFiles])

  if (csvFiles.length === 0) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleConfirm = () => {
    const selectedFile = csvFiles.find(f => f.id === selectedFileId)
    if (selectedFile) {
      onConfirm(selectedFile)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Load Race Data?">
      <div className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Select race data to load:
        </p>

        <div className="space-y-2">
          {csvFiles.map((file) => (
            <label
              key={file.id}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedFileId === file.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <input
                type="radio"
                name="csv-file"
                value={file.id}
                checked={selectedFileId === file.id}
                onChange={() => setSelectedFileId(file.id)}
                className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                  {file.title.rendered}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploaded: {formatDate(file.date)}
                </p>
              </div>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          Or cancel to upload manually
        </p>
      </div>

      {/* Modal footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedFileId}
          className="w-full sm:w-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Load Data
        </button>
      </div>
    </Modal>
  )
}
