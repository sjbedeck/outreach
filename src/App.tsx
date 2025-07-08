import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProspectProvider } from './contexts/ProspectContext';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Campaigns from './components/Campaigns';
import Contacts from './components/Contacts';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Integrations from './components/Integrations';
import IntegrationCatalog from './components/IntegrationCatalog';
import IntegrationPortal from './components/IntegrationPortal';
import WorkflowBuilder from './components/WorkflowBuilder';
import ActionKitPortal from './components/ActionKitPortal';
import EmailTemplates from './components/EmailTemplates';
import Analytics from './components/Analytics';

function App() {
  return (
    <AuthProvider>
      <ProspectProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Header />
                <main className="p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/templates" element={<EmailTemplates />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/integrations/catalog" element={<IntegrationCatalog />} />
                    <Route path="/integrations/:integrationId" element={<IntegrationPortal />} />
                    <Route path="/workflows/:workflowId" element={<WorkflowBuilder />} />
                    <Route path="/action-kit" element={<ActionKitPortal />} />
                  </Routes>
                </main>
              </div>
            </div>
          </div>
        </Router>
      </ProspectProvider>
    </AuthProvider>
  );
}

export default App;