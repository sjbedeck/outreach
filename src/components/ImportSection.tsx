import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, X } from 'lucide-react';
import { useProspects } from '../contexts/ProspectContext';

const ImportSection: React.FC = () => {
  const { importCompanies } = useProspects();
  const [importing, setImporting] = useState(false);
  const [companyData, setCompanyData] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        setCompanyData(csvData);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        setCompanyData(csvData);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleImport = async () => {
    if (!companyData.trim()) return;
    setImporting(true);
    try {
      await importCompanies(companyData);
      setCompanyData('');
      setShowImport(false);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
     setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Company Name,Website URL,LinkedIn URL\nExample Corp,https://example.com,https://linkedin.com/company/example\nTech Startup,https://techstartup.com,https://linkedin.com/company/techstartup';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Import Companies</h3>
        {!showImport && (
          <button 
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Companies
          </button>
        )}
      </div>

      {showImport ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Import Companies</h3>
            <div className="flex space-x-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Template</span>
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop your CSV file
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV files only
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Paste Company Data
                </label>
                <textarea
                  value={companyData}
                  onChange={(e) => setCompanyData(e.target.value)}
                  rows={8}
                  placeholder="Company Name,Website URL,LinkedIn URL&#10;Example Corp,https://example.com,https://linkedin.com/company/example&#10;Tech Startup,https://techstartup.com,https://linkedin.com/company/techstartup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

          </div>
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Supported format: CSV with headers (Company Name, Website URL, LinkedIn URL)</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!companyData.trim() || importing}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Companies</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ImportSection;