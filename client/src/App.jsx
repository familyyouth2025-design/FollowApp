import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Admins from './pages/Admins'
import Events from './pages/Events'
import Contributions from './pages/Contributions'
import Compose from './pages/Compose'
import MessageLog from './pages/MessageLog'
import Churches from './pages/Churches'
import Vault from './pages/Vault'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/admins" element={<Admins />} />
              <Route path="/events" element={<Events />} />
              <Route path="/contributions" element={<Contributions />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/msglog" element={<MessageLog />} />
              <Route path="/churches" element={<Churches />} />
              <Route path="/vault" element={<Vault />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
