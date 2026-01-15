import { Dashboard } from './components/Dashboard'
import { DashboardV2 } from './components/DashboardV2'
import { DashboardV3 } from './components/DashboardV3'

function App() {
  // Switch between dashboards by changing which one is returned:
  return <Dashboard />     // V1: Light theme with gradient cards, vertical layout
  // return <DashboardV2 />   // V2: Dark theme with sidebar layout
  // return <DashboardV3 />   // V3: Glassmorphism with teal/emerald palette
}

export default App
