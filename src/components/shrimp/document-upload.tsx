'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Upload, X, AlertCircle, CheckCircle2, FileText, Eye } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'soil-testing' | 'water-testing' | 'feed-analysis' | 'health-report' | 'unknown';
  uploadDate: string;
  confidence: number;
  fileSize: string;
  url?: string;
}

interface DocumentUploadProps {
  pondName: string;
  pondId: string;
}

const documentTypes = {
  'soil-testing': { label: '🧪 Soil Testing Report', color: 'bg-orange-100 border-orange-500 text-orange-900' },
  'water-testing': { label: '💧 Water Testing Report', color: 'bg-blue-100 border-blue-500 text-blue-900' },
  'feed-analysis': { label: '🌾 Feed Analysis', color: 'bg-green-100 border-green-500 text-green-900' },
  'health-report': { label: '🏥 Health Report', color: 'bg-red-100 border-red-500 text-red-900' },
  'unknown': { label: '📄 Document', color: 'bg-gray-100 border-gray-500 text-gray-900' },
};

export function DocumentUploadComponent({ pondName, pondId }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Soil Testing Report - January 2026',
      type: 'soil-testing',
      uploadDate: '2026-01-11',
      confidence: 0.95,
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      name: 'Water Quality Analysis',
      type: 'water-testing',
      uploadDate: '2026-01-10',
      confidence: 0.98,
      fileSize: '1.8 MB',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pondId', pondId);

      const response = await fetch('/api/ai/detect-document-type', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process document');

      const data = await response.json();

      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: data.documentType || 'unknown',
        uploadDate: new Date().toISOString().split('T')[0],
        confidence: data.confidence || 0.75,
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      };

      setDocuments(prev => [newDoc, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="text-center space-y-4 p-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Drop your documents here</p>
              <p className="text-sm text-gray-500">or click to browse (PDF, images supported)</p>
              <p className="text-xs text-gray-400 mt-2">Auto-detects: Soil Testing, Water Testing, Feed Analysis, Health Reports</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
            {!loading && <Button variant="outline">Select File</Button>}
            {loading && (
              <Button disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 ml-2">{error}</AlertDescription>
        </Alert>
      )}

      {/* Documents Table */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document History - {pondName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-200">
                  <tr className="text-left text-gray-600 font-semibold">
                    <th className="pb-3 px-2">Document</th>
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Size</th>
                    <th className="pb-3 px-2">Confidence</th>
                    <th className="pb-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={documentTypes[doc.type].color}>
                          {documentTypes[doc.type].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{doc.uploadDate}</td>
                      <td className="py-3 px-2 text-gray-600">{doc.fileSize}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                doc.confidence > 0.9
                                  ? 'bg-green-500'
                                  : doc.confidence > 0.7
                                  ? 'bg-blue-500'
                                  : 'bg-orange-500'
                              }`}
                              style={{ width: `${doc.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{Math.round(doc.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => setPreview(doc)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="View document"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-sm text-gray-600">Documents Uploaded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.type !== 'unknown').length}/{documents.length}
                </p>
                <p className="text-sm text-gray-600">Identified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {(documents.reduce((acc, d) => acc + d.confidence, 0) / documents.length * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {preview && (
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {preview.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Document Type</p>
                    <p className="font-semibold text-gray-900">{documentTypes[preview.type].label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Detection Confidence</p>
                    <p className="font-semibold text-gray-900">{Math.round(preview.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Upload Date</p>
                    <p className="font-semibold text-gray-900">{preview.uploadDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">File Size</p>
                    <p className="font-semibold text-gray-900">{preview.fileSize}</p>
                  </div>
                </div>
              </div>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 ml-2">
                  Document preview would be displayed here in production with full rendering capabilities.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setPreview(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
