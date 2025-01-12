import { useState, useEffect } from 'react'
import AddWorkerModal from './AddWorkerModal'
import { MoreVertical } from 'lucide-react'

function WorkerList({ onSelectWorker, selectedWorker }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/workers')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch workers')
      }
      const data = await response.json()
      setWorkers(data)
      setError(null)
    } catch (err) {
      setError(`Failed to load workers: ${err.message}`)
      console.error('Error details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = async (newWorker) => {
    try {
      const response = await fetch('http://localhost:3000/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorker)
      })
      
      if (!response.ok) throw new Error('Failed to add worker')
      
      await fetchWorkers()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error adding worker:', err)
      setError('Failed to add worker')
    }
  }

  const handleStatusChange = async (workerId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/workers/${workerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      await fetchWorkers()
      setActiveDropdown(null)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status')
    }
  }

  const handleDeleteWorker = async (workerId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/workers/${workerId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete worker')
      }
      
      if (selectedWorker?.id === workerId) {
        onSelectWorker(null)
      }
      
      await fetchWorkers()
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting worker:', err)
      setError(err.message || 'Failed to delete worker')
    }
  }

  if (loading) return <p className="text-gray-400">Loading workers...</p>
  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg mb-4 transition-colors"
      >
        Add Worker
      </button>
      
      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddWorker}
      />

      <h2 className="text-lg font-semibold mb-4 text-white">Worker List</h2>
      {workers.map(worker => (
        <div
          key={worker.id}
          className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
            selectedWorker?.id === worker.id
              ? 'bg-blue-900 border-blue-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <div className="flex justify-between items-start">
            <div onClick={() => onSelectWorker(worker)} className="flex-1">
              <p className="font-medium text-white">{worker.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{worker.designation}</span>
                <span>•</span>
                <span>₹{worker.daily_wage}/day</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                worker.status === 'Active' 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {worker.status}
              </span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === worker.id ? null : worker.id)}
                className="p-1 hover:bg-gray-600 rounded"
              >
                <MoreVertical className="h-5 w-5 text-gray-300" />
              </button>

              {activeDropdown === worker.id && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => handleStatusChange(worker.id, 'Active')}
                      className={`block px-4 py-2 text-sm text-left w-full ${
                        worker.status === 'Active'
                          ? 'text-green-400 bg-gray-700'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Set as Active
                    </button>
                    <button
                      onClick={() => handleStatusChange(worker.id, 'Inactive')}
                      className={`block px-4 py-2 text-sm text-left w-full ${
                        worker.status === 'Inactive'
                          ? 'text-red-400 bg-gray-700'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Set as Inactive
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(worker.id)
                        setActiveDropdown(null)
                      }}
                      className="block px-4 py-2 text-sm text-left w-full text-red-400 hover:bg-gray-700"
                    >
                      Delete Worker
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this worker? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteWorker(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkerList 