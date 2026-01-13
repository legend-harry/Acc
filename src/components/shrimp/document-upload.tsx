'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDocuments, useImageAnalysis, usePonds } from '@/hooks/use-shrimp';
import { useUser } from '@/context/user-context';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { Loader2, Upload, X, AlertCircle, CheckCircle2, FileText, Eye, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react';

interface DocumentUploadProps {
  pondName: string;
  pondId: string;
}

const documentTypes = {
  'soil-testing': { label: '🧪 Soil Testing Report', color: 'bg-orange-100 border-orange-500 text-orange-900' },
  'water-testing': { label: '💧 Water Testing Report', color: 'bg-blue-100 border-blue-500 text-blue-900' },
  'feed-analysis': { label: '🌾 Feed Analysis', color: 'bg-green-100 border-green-500 text-green-900' },
  'health-report': { label: '🏥 Health Report', color: 'bg-red-100 border-red-500 text-red-900' },
  'shrimp-health-image': { label: '🦐 Shrimp Health Photo', color: 'bg-purple-100 border-purple-500 text-purple-900' },
  'pond-condition': { label: '🏞️ Pond Condition', color: 'bg-cyan-100 border-cyan-500 text-cyan-900' },
  'equipment-photo': { label: '⚙️ Equipment Photo', color: 'bg-gray-100 border-gray-500 text-gray-900' },
  'unknown': { label: '📄 Document', color: 'bg-gray-100 border-gray-500 text-gray-900' },
};

const getTypeMeta = (type: string) => documentTypes[type as keyof typeof documentTypes] || documentTypes['unknown'];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function DocumentUploadComponent({ pondName, pondId }: DocumentUploadProps) {
  const { toast } = useToast();
  const { documents, loading: docsLoading, addDocument, deleteDocument } = useDocuments(pondId);
  const { images, loading: imagesLoading, addImage, deleteImage } = useImageAnalysis(pondId);
  const { ponds } = usePonds();
  const { selectedProfile } = useUser();
  
  const currentPond = ponds.find(p => p.id === pondId);
  const currentPhase = currentPond?.currentStage || 'operation';
  const currentDay = currentPond?.cycleDay || 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbSaving, setKbSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addKnowledgeEntry = async (entry: { title: string; content: string; source: string; documentId?: string }) => {
    if (!selectedProfile) return;
    const kbRef = ref(db, `shrimp/${selectedProfile}/knowledge/${pondId}`);
    const newRef = push(kbRef);
    await set(newRef, {
      ...entry,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSaveKnowledge = async () => {
    if (!kbTitle.trim() && !kbContent.trim()) {
      setError('Add a title or content before saving.');
      return;
    }
    setKbSaving(true);
    try {
      await addKnowledgeEntry({
        title: kbTitle || 'Untitled note',
        content: kbContent,
        source: 'manual',
      });
      setKbOpen(false);
      setKbTitle('');
      setKbContent('');
      toast({ title: 'Saved to knowledge base' });
      setError('');
    } catch (err) {
      console.error('KB save error', err);
      setError('Could not save knowledge entry.');
    } finally {
      setKbSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const isImage = file.type.startsWith('image/');
    const dataUrl = await fileToDataUrl(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pondId', pondId);
    formData.append('isImage', isImage.toString());

    const endpoint = isImage ? '/api/ai/analyze-farm-image' : '/api/ai/analyze-test-document';
    const now = new Date();
    const dateStr = now.toISOString();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedName = `${dateStr.split('T')[0]}_${dayName}_Day${currentDay}_${currentPhase}`;
    const previewUrl = URL.createObjectURL(file);

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (isImage) {
        await addImage({
          pondId,
          name: formattedName,
          uploadDate: dateStr,
          uploadDay: currentDay,
          phase: currentPhase,
          type: (data.type || data.documentType || 'pond-condition') as any,
          aiAnalysis: data.analysis || data.insights || 'Analysis completed.',
          confidence: data.confidence || 0.75,
          fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          url: data.url || previewUrl,
          previewData: data.url ? undefined : dataUrl,
          isImage: true,
        });
      } else {
        const docData: any = {
          pondId,
          name: file.name,
          type: data.type || 'unknown',
          uploadDate: dateStr,
          confidence: data.confidence || 0.75,
          fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          isImage: false,
          url: data.url || previewUrl,
          previewData: data.url ? undefined : dataUrl,
          aiAnalysis: data.analysis || 'Analysis completed.',
        };
        if (data.minerals) {
          docData.minerals = data.minerals;
        }
        await addDocument(docData);

        if (data.analysis) {
          await addKnowledgeEntry({
            title: `${data.type === 'water-testing' ? '💧' : data.type === 'soil-testing' ? '🧪' : '📄'} ${file.name}`,
            content: data.analysis,
            source: 'document',
          });
        }
      }

      toast({
        title: isImage ? 'Image Analyzed' : 'Document Uploaded',
        description: isImage ? 'Image analysis saved to progress images.' : 'Document stored and parsed.',
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
              <p className="font-medium text-gray-700">Drop your documents or images here</p>
              <p className="text-sm text-gray-500">or click to browse (PDF, images supported)</p>
              <p className="text-xs text-gray-400 mt-2">
                📄 Auto-detects: Soil Testing, Water Testing, Feed Analysis, Health Reports
              </p>
              <p className="text-xs text-gray-400">
                📸 AI Image Analysis: Shrimp health, pond conditions, equipment inspection
              </p>
              <p className="text-xs font-semibold text-blue-600 mt-2">
                Images tracked with: Date, Day, Phase for progress monitoring
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.heic"
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Files you upload stay available and can be re-opened after refresh.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setKbOpen(true)}>
          Add knowledge note
        </Button>
      </div>

      {/* Tabs for Documents and Images */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="w-4 h-4 mr-2" />
            Progress Images ({images.length})
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents">
          {documents.length > 0 ? (
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
                          {doc.isImage ? (
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900 truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getTypeMeta(doc.type).color}>
                          {getTypeMeta(doc.type).label}
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
                        <div className="flex gap-1">
                          <button
                            onClick={() => setPreview(doc)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="View document"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
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
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No documents uploaded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          {images.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Images - {pondName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left text-gray-600 font-semibold">
                        <th className="pb-3 px-2">Image Name</th>
                        <th className="pb-3 px-2">Type</th>
                        <th className="pb-3 px-2">Day</th>
                        <th className="pb-3 px-2">Phase</th>
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Confidence</th>
                        <th className="pb-3 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map(img => (
                        <tr key={img.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-gray-900 truncate">{img.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={getTypeMeta(img.type).color}>
                              {getTypeMeta(img.type).label}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              Day {img.uploadDay}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 capitalize">
                              {img.phase}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {new Date(img.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    img.confidence > 0.9
                                      ? 'bg-green-500'
                                      : img.confidence > 0.7
                                      ? 'bg-blue-500'
                                      : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${img.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{Math.round(img.confidence * 100)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setPreview(img)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="View image"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => deleteImage(img.id)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Delete image"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{images.length}</p>
                    <p className="text-sm text-gray-600">Images Analyzed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...images.map(i => i.uploadDay), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Latest Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {images[0]?.phase || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Current Phase</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {(images.reduce((acc, i) => acc + i.confidence, 0) / images.length * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">Avg Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No images uploaded yet</p>
                <p className="text-sm mt-2">Upload images to track progress over time</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {preview && (
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {preview.isImage || preview.uploadDay !== undefined ? (
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                {preview.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900">{getTypeMeta(preview.type || 'unknown').label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Detection Confidence</p>
                    <p className="font-semibold text-gray-900">{Math.round(preview.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{preview.uploadDay !== undefined ? 'Upload Day' : 'Upload Date'}</p>
                    <p className="font-semibold text-gray-900">
                      {preview.uploadDay !== undefined 
                        ? `Day ${preview.uploadDay}` 
                        : new Date(preview.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{preview.phase ? 'Phase' : 'File Size'}</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {preview.phase || preview.fileSize}
                    </p>
                  </div>
                </div>
              </div>

              { (preview.url || preview.previewData) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {preview.isImage || preview.uploadDay !== undefined ? (
                    <img
                      src={preview.url || preview.previewData}
                      alt={preview.name}
                      className="w-full max-h-[420px] object-contain bg-black/5"
                    />
                  ) : preview.name?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={preview.url || preview.previewData}
                      title="Document preview"
                      className="w-full h-[420px]"
                    />
                  ) : (
                    <div className="p-3 text-sm text-gray-600">Preview available once a PDF or image URL is provided.</div>
                  )}
                </div>
              )}

              {preview.aiAnalysis && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900 ml-2">
                    <p className="font-semibold mb-1">AI Analysis:</p>
                    <p className="text-sm">{preview.aiAnalysis}</p>
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 ml-2">
                  {preview.phase 
                    ? "Image preview and detailed analysis would be displayed here in production."
                    : "Document preview would be displayed here in production with full rendering capabilities."}
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setPreview(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Knowledge note dialog */}
      <Dialog open={kbOpen} onOpenChange={setKbOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to knowledge base</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Title"
              value={kbTitle}
              onChange={e => setKbTitle(e.target.value)}
            />
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-32"
              placeholder="Key learnings, actions, or observations"
              value={kbContent}
              onChange={e => setKbContent(e.target.value)}
            />
            <Button onClick={handleSaveKnowledge} disabled={kbSaving} className="w-full">
              {kbSaving ? 'Saving...' : 'Save note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
