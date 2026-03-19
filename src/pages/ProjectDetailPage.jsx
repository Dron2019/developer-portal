import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  ServerIcon,
  DocumentTextIcon,
  LinkIcon,
  ClipboardDocumentListIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import {
  getProject,
  deleteProject,
  getProjectMembers,
  removeProjectMember,
  getProjectServers,
  deleteProjectServer,
  getServerPassword,
  getProjectFiles,
  uploadProjectFile,
  deleteProjectFile,
  downloadProjectFile,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  getProjectActivity,
  linkProjectRepository,
  unlinkProjectRepository,
} from '../api/projects'
import ProjectStatusBadge from '../components/ProjectStatusBadge'
import TechStackChips from '../components/TechStackChips'
import ActivityTimeline from '../components/ActivityTimeline'
import EditProjectModal from '../components/modals/EditProjectModal'
import AddMemberModal from '../components/modals/AddMemberModal'
import AddServerModal from '../components/modals/AddServerModal'
import LinkRepositoryModal from '../components/modals/LinkRepositoryModal'
import useAuthStore from '../store/authStore'

const TABS = ['Overview', 'Team', 'Repositories', 'Servers', 'Files', 'Notes', 'Activity']

const ROLE_COLORS = {
  owner: 'bg-red-100 text-red-800',
  tech_lead: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  developer: 'bg-green-100 text-green-800',
  designer: 'bg-pink-100 text-pink-800',
  qa: 'bg-yellow-100 text-yellow-800',
  guest: 'bg-gray-100 text-gray-700',
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddServer, setShowAddServer] = useState(false)
  const [showLinkRepo, setShowLinkRepo] = useState(false)

  // Tab data
  const [members, setMembers] = useState([])
  const [servers, setServers] = useState([])
  const [files, setFiles] = useState([])
  const [notes, setNotes] = useState([])
  const [activity, setActivity] = useState([])

  // Server passwords visibility
  const [serverPasswords, setServerPasswords] = useState({})
  const [showPasswords, setShowPasswords] = useState({})

  // Note editor
  const [editingNote, setEditingNote] = useState(null)
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  // File upload
  const [uploading, setUploading] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const myMembership = members.find((m) => m.id === user?.id)
  const myRole = myMembership?.role
  const isOwner = myRole === 'owner'
  const canEdit = isAdmin || isManager || isOwner
  const canManageServers = isAdmin || isManager || myRole === 'tech_lead' || isOwner
  const canManageMembers = isAdmin || isManager || isOwner

  useEffect(() => {
    fetchProject()
  }, [id])

  useEffect(() => {
    if (!project) return
    if (activeTab === 'Team') fetchMembers()
    if (activeTab === 'Servers') fetchServers()
    if (activeTab === 'Files') fetchFiles()
    if (activeTab === 'Notes') fetchNotes()
    if (activeTab === 'Activity') fetchActivity()
  }, [activeTab, project])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const { data } = await getProject(id)
      setProject(data.data ?? data)
      // pre-populate overview data
      if ((data.data ?? data).members) setMembers((data.data ?? data).members)
      if ((data.data ?? data).servers) setServers((data.data ?? data).servers)
      if ((data.data ?? data).notes) setNotes((data.data ?? data).notes)
      if ((data.data ?? data).recent_activity) setActivity((data.data ?? data).recent_activity)
    } catch {
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data } = await getProjectMembers(id)
      setMembers(data.data ?? [])
    } catch {}
  }

  const fetchServers = async () => {
    try {
      const { data } = await getProjectServers(id)
      setServers(data.data ?? [])
    } catch {}
  }

  const fetchFiles = async () => {
    try {
      const { data } = await getProjectFiles(id)
      setFiles(data.data ?? [])
    } catch {}
  }

  const fetchNotes = async () => {
    try {
      const { data } = await getProjectNotes(id)
      setNotes(data.data ?? [])
    } catch {}
  }

  const fetchActivity = async () => {
    try {
      const { data } = await getProjectActivity(id)
      setActivity(data.data ?? [])
    } catch {}
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch {}
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await removeProjectMember(id, userId)
      fetchMembers()
    } catch {}
  }

  const handleDeleteServer = async (serverId) => {
    if (!window.confirm('Delete this server?')) return
    try {
      await deleteProjectServer(id, serverId)
      fetchServers()
    } catch {}
  }

  const handleUnlinkRepo = async (repoId, repoName) => {
    if (!window.confirm(`Unlink "${repoName}" from this project?`)) return
    try {
      await unlinkProjectRepository(id, repoId)
      setProject(prev => ({ ...prev, repositories: prev.repositories.filter(r => r.id !== repoId) }))
    } catch {}
  }

  const handleRepoLinked = () => {
    // Refetch the project to get updated repositories
    fetchProject()
    setShowLinkRepo(false)
  }

  const generateFileZillaXML = (servers, projectName) => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
    const root = `<FileZilla3 version="3.67.0" platform="web">`
    
    let serversXML = '<Servers>\n'
    
    servers.forEach(server => {
      // Convert password to base64 if it exists
      const encodedPassword = server.password ? btoa(server.password) : ''
      
      // Map server types to FileZilla protocol numbers
      const protocolMap = {
        'ftp': '0',
        'sftp': '1', 
        'ftps': '4'
      }
      
      const protocol = protocolMap[server.type?.toLowerCase()] || '0'
      const port = server.port || (server.type?.toLowerCase() === 'sftp' ? '22' : '21')
      
      serversXML += `    <Server>
`
      serversXML += `        <Host>${server.host || ''}</Host>
`
      serversXML += `        <Port>${port}</Port>
`
      serversXML += `        <Protocol>${protocol}</Protocol>
`
      serversXML += `        <Type>0</Type>
`
      serversXML += `        <User>${server.username || ''}</User>
`
      serversXML += `        <Pass encoding="base64">${encodedPassword}</Pass>
`
      serversXML += `        <Logontype>1</Logontype>
`
      serversXML += `        <PasvMode>MODE_DEFAULT</PasvMode>
`
      serversXML += `        <EncodingType>Auto</EncodingType>
`
      serversXML += `        <BypassProxy>0</BypassProxy>
`
      serversXML += `        <Name>${server.name || server.host || 'Unnamed Server'}</Name>
`
      serversXML += `        <SyncBrowsing>0</SyncBrowsing>
`
      serversXML += `        <DirectoryComparison>0</DirectoryComparison>
`
      serversXML += `    </Server>
`
    })
    
    serversXML += '</Servers>\n'
    
    return xmlHeader + root + '\n' + serversXML + '</FileZilla3>'
  }

  const handleExportFileZilla = async () => {
    if (servers.length === 0) {
      alert('No servers to export.')
      return
    }

    try {
      // Get server passwords for export (only if user has permission)
      const serversWithPasswords = []
      
      for (const server of servers) {
        let serverData = { ...server }
        
        // Try to get password if user has access
        if (isAdmin || myRole === 'tech_lead') {
          try {
            const { data } = await getServerPassword(id, server.id)
            serverData.password = data.password || ''
          } catch {
            // If password fetch fails, continue without it
            serverData.password = ''
          }
        }
        
        serversWithPasswords.push(serverData)
      }
      
      const xml = generateFileZillaXML(serversWithPasswords, project?.name)
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${project?.name || 'project'}_servers_filezilla.xml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export servers. Please try again.')
    }
  }

  const handleShowPassword = async (server) => {
    try {
      const { data } = await getServerPassword(id, server.id)
      setServerPasswords(prev => ({ ...prev, [server.id]: data.password ?? '' }))
    } catch {
      alert('Access denied or no password set.')
    }
  }

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      // Simple feedback - you could enhance this with a toast library
      const button = event.target.closest('button')
      const originalTitle = button.title
      button.title = 'Copied!'
      button.style.color = '#16a34a' // green-600
      setTimeout(() => {
        button.title = originalTitle
        button.style.color = ''
      }, 1000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Same feedback for fallback
      const button = event.target.closest('button')
      const originalTitle = button.title
      button.title = 'Copied!'
      button.style.color = '#16a34a'
      setTimeout(() => {
        button.title = originalTitle
        button.style.color = ''
      }, 1000)
    }
  }

  const togglePasswordVisibility = (serverId) => {
    setShowPasswords(prev => ({ ...prev, [serverId]: !prev[serverId] }))
  }

  const CopyableField = ({ label, value, type = 'text', serverId = null }) => {
    if (!value && value !== 0) return null
    
    const displayValue = type === 'password' && serverId && !showPasswords[serverId] 
      ? '••••••••' 
      : value

    const isPassword = type === 'password'
    const passwordValue = isPassword && serverId ? serverPasswords[serverId] : value
    const copyValue = isPassword ? passwordValue : value

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 min-w-0 w-16 shrink-0">{label}:</span>
        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded flex-1 min-w-0 truncate">
          {displayValue}
        </span>
        {isPassword && serverId && (
          <button
            onClick={() => togglePasswordVisibility(serverId)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            title={showPasswords[serverId] ? 'Hide password' : 'Show password'}
          >
            {showPasswords[serverId] ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          onClick={() => copyToClipboard(copyValue || '', label)}
          className="text-gray-400 hover:text-blue-600 shrink-0"
          title={`Copy ${label.toLowerCase()}`}
        >
          <ClipboardIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await uploadProjectFile(id, formData)
      fetchFiles()
    } catch {}
    finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return
    try {
      await deleteProjectFile(id, fileId)
      fetchFiles()
    } catch {}
  }

  const handleDownloadFile = async (file) => {
    try {
      const response = await downloadProjectFile(id, file.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {}
  }

  const handleSaveNote = async (e) => {
    e.preventDefault()
    setNoteLoading(true)
    try {
      if (editingNote?.id) {
        await updateProjectNote(id, editingNote.id, noteForm)
      } else {
        await createProjectNote(id, noteForm)
      }
      setEditingNote(null)
      setNoteForm({ title: '', content: '' })
      fetchNotes()
    } catch {}
    finally {
      setNoteLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await deleteProjectNote(id, noteId)
      fetchNotes()
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {project.logo_url && (
              <img src={project.logo_url} alt={project.name} className="h-10 w-10 rounded-lg object-cover" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-gray-600 text-sm max-w-2xl">{project.description}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tech Stack</h3>
                <TechStackChips stack={project.tech_stack} />
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Links</h3>
              <div className="space-y-1">
                {[
                  { label: 'Test', url: project.test_url },
                  { label: 'Staging', url: project.staging_url },
                  { label: 'Production', url: project.production_url },
                ].map(({ label, url }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-4 w-4 shrink-0" />
                      <span className="font-medium w-20">{label}:</span>
                      <span className="truncate">{url}</span>
                    </a>
                  ) : null
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Team</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {project.owner && (
                  <p><span className="font-medium">Owner:</span> {project.owner.name}</p>
                )}
                {project.tech_lead && (
                  <p><span className="font-medium">Tech Lead:</span> {project.tech_lead.name}</p>
                )}
                {project.manager && (
                  <p><span className="font-medium">Manager:</span> {project.manager.name}</p>
                )}
              </div>
            </div>

            {(project.started_at || project.finished_at) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {project.started_at && <p><span className="font-medium">Started:</span> {project.started_at}</p>}
                  {project.finished_at && <p><span className="font-medium">Finished:</span> {project.finished_at}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Team' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">{members.length} member{members.length !== 1 ? 's' : ''}</h3>
            {canManageMembers && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Member
              </button>
            )}
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {member.role?.replace('_', ' ')}
                  </span>
                  {canManageMembers && member.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Repositories' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Linked Repositories</h3>
            {canEdit && (
              <button
                onClick={() => setShowLinkRepo(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Link Repository
              </button>
            )}
          </div>
          {project.repositories && project.repositories.length > 0 ? (
            <div className="space-y-2">
              {project.repositories.map((repo) => (
                <div key={repo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{repo.full_name || repo.name}</p>
                    {repo.description && <p className="text-xs text-gray-500 truncate">{repo.description}</p>}
                  </div>
                  {repo.html_url && (
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline shrink-0"
                    >
                      View on GitHub
                    </a>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleUnlinkRepo(repo.id, repo.full_name || repo.name)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Unlink repository"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No repositories linked.</p>
          )}
        </div>
      )}

      {activeTab === 'Servers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">{servers.length} server{servers.length !== 1 ? 's' : ''}</h3>
            <div className="flex items-center gap-2">
              {servers.length > 0 && (isAdmin || myRole === 'tech_lead' || canManageServers) && (
                <button
                  onClick={handleExportFileZilla}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Export servers to FileZilla XML"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export FileZilla
                </button>
              )}
              {canManageServers && (
                <button
                  onClick={() => setShowAddServer(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Server
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {servers.map((server) => (
              <div key={server.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                {/* Server Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ServerIcon className="h-8 w-8 text-gray-400 mt-1" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{server.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        server.type === 'sftp' ? 'bg-green-100 text-green-800' :
                        server.type === 'ftps' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {server.type?.toUpperCase() || 'FTP'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin || myRole === 'tech_lead') && (
                      <button
                        onClick={() => handleShowPassword(server)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        title="Load password"
                      >
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Load Password
                      </button>
                    )}
                    {canManageServers && (
                      <button
                        onClick={() => handleDeleteServer(server.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete server"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Server Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CopyableField label="Host" value={server.host} />
                  <CopyableField label="Port" value={server.port} />
                  <CopyableField label="Username" value={server.username} />
                  {(isAdmin || myRole === 'tech_lead') && serverPasswords[server.id] !== undefined && (
                    <CopyableField 
                      label="Password" 
                      value={serverPasswords[server.id]} 
                      type="password"
                      serverId={server.id}
                    />
                  )}
                </div>

                {/* Connection String */}
                {server.host && (
                  <div className="pt-2 border-t border-gray-100">
                    <CopyableField 
                      label="URL" 
                      value={`${server.type || 'ftp'}://${server.username ? `${server.username}@` : ''}${server.host}${server.port ? `:${server.port}` : ''}`} 
                    />
                  </div>
                )}

                {/* Description */}
                {server.description && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-600">{server.description}</p>
                  </div>
                )}
              </div>
            ))}
            {servers.length === 0 && <p className="text-sm text-gray-500">No servers configured.</p>}
          </div>
        </div>
      )}

      {activeTab === 'Files' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">{files.length} file{files.length !== 1 ? 's' : ''}</h3>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <PlusIcon className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_name}</p>
                    <p className="text-xs text-gray-500">
                      {file.type} — {formatBytes(file.size)}
                      {file.uploader ? ` — by ${file.uploader.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  {(isAdmin || isManager || file.uploader?.id === user?.id) && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {files.length === 0 && <p className="text-sm text-gray-500">No files uploaded.</p>}
          </div>
        </div>
      )}

      {activeTab === 'Notes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Notes</h3>
            {!editingNote && (
              <button
                onClick={() => { setEditingNote({}); setNoteForm({ title: '', content: '' }) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                New Note
              </button>
            )}
          </div>

          {editingNote !== null && (
            <form onSubmit={handleSaveNote} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <input
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                required
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your note (markdown supported)..."
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditingNote(null); setNoteForm({ title: '', content: '' }) }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={noteLoading}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {noteLoading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{note.title}</h4>
                  <div className="flex gap-1 shrink-0">
                    {(isAdmin || note.author?.id === user?.id) && (
                      <>
                        <button
                          onClick={() => { setEditingNote(note); setNoteForm({ title: note.title, content: note.content }) }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{note.content}</pre>
                {note.author && (
                  <p className="text-xs text-gray-400 mt-2">by {note.author.name}</p>
                )}
              </div>
            ))}
            {notes.length === 0 && !editingNote && (
              <p className="text-sm text-gray-500">No notes yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Activity' && (
        <ActivityTimeline activities={activity} />
      )}

      {/* Modals */}
      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setProject((prev) => ({ ...prev, ...updated }))
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={fetchMembers}
        />
      )}

      {showAddServer && (
        <AddServerModal
          projectId={id}
          onClose={() => setShowAddServer(false)}
          onAdded={fetchServers}
        />
      )}

      {showLinkRepo && (
        <LinkRepositoryModal
          projectId={id}
          onClose={() => setShowLinkRepo(false)}
          onLinked={handleRepoLinked}
        />
      )}
    </div>
  )
}

