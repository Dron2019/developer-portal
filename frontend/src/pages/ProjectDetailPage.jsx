import { useParams } from 'react-router-dom'

export default function ProjectDetailPage() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Project #{id}</h1>
    </div>
  )
}
