import React, { useState } from 'react';
import { X, Clipboard, ExternalLink } from 'lucide-react';

interface OAuthConfigModalProps {
  provider: any;
  existingToken: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

const OAuthConfigModal: React.FC<OAuthConfigModalProps> = ({ 
  provider, 
  existingToken,
  onSave,
  onCancel 
}) => {
  const [clientId, setClientId] = useState(existingToken?.client_id || '');
  const [clientSecret, setClientSecret] = useState(existingToken?.client_secret || '');
  const [redirectUrl, setRedirectUrl] = useState(window.location.origin + '/oauth/callback');
  const [accessToken, setAccessToken] = useState(existingToken?.access_token || '');
  const [refreshToken, setRefreshToken] = useState(existingToken?.refresh_token || '');
  const [expiresAt, setExpiresAt] = useState<string>(
    existingToken?.expires_at ? 
    new Date(existingToken.expires_at).toISOString().slice(0, 16) : 
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  
  const [testAccount, setTestAccount] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const handleSave = () => {
    onSave({
      clientId,
      clientSecret,
      redirectUrl,
      accessToken,
      refreshToken,
      expiresAt: new Date(expiresAt).toISOString(),
      testAccount
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Configure {provider.name} Connection
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* OAuth Information */}
          <div>
            <p className="text-sm text-gray-600 mb-4">
              To connect with {provider.name}, you'll need to set up OAuth credentials.
              {provider.authConfig?.instructionsUrl && (
                <a 
                  href={provider.authConfig.instructionsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-1 inline-flex items-center"
                >
                  <span>Learn how to obtain these credentials</span>
                  <ExternalLink size={14} className="ml-1" />
                </a>
              )}
            </p>
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input 
              type="text" 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder={`${provider.name} Client ID`}
            />
          </div>
          
          {/* Client Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <div className="relative">
              <input 
                type={showClientSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder={`${provider.name} Client Secret`}
              />
              <button
                type="button"
                onClick={() => setShowClientSecret(!showClientSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showClientSecret ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          {/* Redirect URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redirect URL
            </label>
            <div className="flex">
              <input 
                type="text" 
                value={redirectUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(redirectUrl)}
                className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-lg hover:bg-gray-200"
              >
                <Clipboard size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use this URL in your {provider.name} developer console as the redirect URL
            </p>
          </div>
          
          {/* Advanced Settings - for manual token entry */}
          <div className="pt-4 border-t border-gray-200">
            <details>
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Advanced Settings
              </summary>
              
              <div className="mt-4 space-y-4">
                {/* Access Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token (Optional)
                  </label>
                  <div className="relative">
                    <input 
                      type={showAccessToken ? "text" : "password"}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Manually enter access token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showAccessToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: For manual token configuration
                  </p>
                </div>
                
                {/* Refresh Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refresh Token (Optional)
                  </label>
                  <div className="relative">
                    <input 
                      type={showRefreshToken ? "text" : "password"}
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                      className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Manually enter refresh token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRefreshToken(!showRefreshToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showRefreshToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                {/* Token Expiry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Expiry (Optional)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </details>
          </div>
          
          {/* Required Permissions */}
          {provider.authConfig?.oauthScopes && provider.authConfig.oauthScopes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Required Permissions</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <ul className="text-sm text-gray-600 space-y-1">
                  {provider.authConfig.oauthScopes.map((scope: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Ensure these permissions are enabled in your {provider.name} developer console
              </p>
            </div>
          )}
          
          {/* Test Account Option */}
          <div className="pt-4 border-t border-gray-200 flex items-center">
            <input
              type="checkbox"
              id="testAccount"
              checked={testAccount}
              onChange={(e) => setTestAccount(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="testAccount" className="ml-2 block text-sm text-gray-700">
              This is a test account (won't affect production data)
            </label>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!clientId || !clientSecret}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthConfigModal;