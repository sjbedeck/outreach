import React, { useState } from 'react';
import { 
  Key, 
  Mail, 
  Shield, 
  User, 
  Building, 
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Settings as SettingsIcon,
  Database,
  Zap
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    apollo: false,
    gemini: false
  });

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    apollo: '',
    gemini: ''
  });

  const [emailSettings, setEmailSettings] = useState({
    defaultSender: 'gmail',
    signature: '',
    trackOpens: true,
    trackClicks: true
  });

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', { apiKeys, emailSettings });
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const apiConfigs = [
    {
      id: 'openai',
      name: 'OpenAI API',
      description: 'Used for AI-powered email generation and content creation',
      docUrl: 'https://platform.openai.com/account/api-keys',
      placeholder: 'sk-...'
    },
    {
      id: 'apollo',
      name: 'Apollo.io API',
      description: 'Used for company data enrichment and contact discovery',
      docUrl: 'https://developer.apollo.io/#authentication',
      placeholder: 'Your Apollo.io API key...'
    },
    {
      id: 'gemini',
      name: 'Gemini API',
      description: 'Used for data analysis, cleaning, and formatting',
      docUrl: 'https://ai.google.dev/docs/gemini_api',
      placeholder: 'Your Gemini API key...'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-6 mr-6">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'account' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        defaultValue="Acme Corp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>UTC-05:00 (EST)</option>
                        <option>UTC-08:00 (PST)</option>
                        <option>UTC+00:00 (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">API Configuration</h2>
                <div className="space-y-6">
                  {apiConfigs.map((config) => (
                    <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {config.name}
                        </label>
                        <a
                          href={config.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <span>Get API Key</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="relative mb-2">
                        <input
                          type={showApiKeys[config.id as keyof typeof showApiKeys] ? 'text' : 'password'}
                          value={apiKeys[config.id as keyof typeof apiKeys]}
                          onChange={(e) => handleApiKeyChange(config.id, e.target.value)}
                          placeholder={config.placeholder}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => toggleApiKeyVisibility(config.id)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKeys[config.id as keyof typeof showApiKeys] ? 
                            <EyeOff className="w-4 h-4" /> : 
                            <Eye className="w-4 h-4" />
                          }
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Email Sender
                    </label>
                    <select 
                      value={emailSettings.defaultSender}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, defaultSender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="gmail">Gmail Account</option>
                      <option value="outlook">Outlook Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Signature
                    </label>
                    <textarea
                      rows={4}
                      value={emailSettings.signature}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, signature: e.target.value }))}
                      placeholder="Your email signature..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="trackOpens"
                        checked={emailSettings.trackOpens}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, trackOpens: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="trackOpens" className="text-sm text-gray-700">
                        Track email opens
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="trackClicks"
                        checked={emailSettings.trackClicks}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, trackClicks: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="trackClicks" className="text-sm text-gray-700">
                        Track email clicks
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h2>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Gmail Integration</h3>
                        <p className="text-sm text-gray-500">Connect your Gmail account to send emails</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Connect Gmail
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Outlook Integration</h3>
                        <p className="text-sm text-gray-500">Connect your Outlook account to send emails</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Connect Outlook
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">LinkedIn Integration</h3>
                        <p className="text-sm text-gray-500">Connect LinkedIn for enhanced profile scraping</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Connect LinkedIn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Session Timeout</h3>
                      <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>Never</option>
                    </select>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="loginAlerts"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="loginAlerts" className="text-sm text-gray-700">
                        Email me about unusual login activity
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;