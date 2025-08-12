
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Brain, Heart, Activity, Eye, Bone, Zap, Download, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MedicalImageLabeler = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState('auto');
  const [annotations, setAnnotations] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Medical procedures and their typical findings
  const procedures = {
    auto: { name: 'Auto-Detect', icon: Zap, color: '#8B5CF6' },
    mri: { name: 'MRI Scan', icon: Brain, color: '#3B82F6' },
    ct: { name: 'CT Scan', icon: Camera, color: '#10B981' },
    xray: { name: 'X-Ray', icon: Bone, color: '#F59E0B' },
    ultrasound: { name: 'Ultrasound', icon: Activity, color: '#EF4444' },
    mammography: { name: 'Mammography', icon: Heart, color: '#EC4899' },
    pet: { name: 'PET Scan', icon: Zap, color: '#8B5CF6' },
    fluoroscopy: { name: 'Fluoroscopy', icon: Eye, color: '#06B6D4' }
  };

  // Simulated AI analysis results for different procedures
  const simulateAIAnalysis = (procedureType: string, imageData: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysisTemplates = {
          mri: {
            organs: [
              { name: 'Cerebral Cortex', confidence: 0.95, region: { x: 120, y: 80, width: 160, height: 120 }, color: '#FF6B6B' },
              { name: 'Corpus Callosum', confidence: 0.89, region: { x: 180, y: 140, width: 80, height: 20 }, color: '#4ECDC4' },
              { name: 'Cerebellum', confidence: 0.92, region: { x: 150, y: 220, width: 100, height: 60 }, color: '#45B7D1' },
              { name: 'Brain Stem', confidence: 0.88, region: { x: 190, y: 200, width: 40, height: 80 }, color: '#96CEB4' },
              { name: 'Lateral Ventricles', confidence: 0.85, region: { x: 160, y: 120, width: 60, height: 40 }, color: '#FFEAA7' }
            ],
            findings: ['Normal brain structure', 'No signs of hemorrhage', 'Ventricular system normal'],
            procedureType: 'Brain MRI'
          },
          ct: {
            organs: [
              { name: 'Lungs', confidence: 0.96, region: { x: 80, y: 100, width: 240, height: 180 }, color: '#74B9FF' },
              { name: 'Heart', confidence: 0.91, region: { x: 160, y: 140, width: 80, height: 100 }, color: '#FD79A8' },
              { name: 'Liver', confidence: 0.89, region: { x: 200, y: 200, width: 120, height: 80 }, color: '#FDCB6E' },
              { name: 'Ribs', confidence: 0.93, region: { x: 60, y: 90, width: 280, height: 200 }, color: '#E17055' },
              { name: 'Spine', confidence: 0.87, region: { x: 190, y: 80, width: 20, height: 220 }, color: '#A29BFE' }
            ],
            findings: ['Clear lung fields', 'Normal cardiac silhouette', 'No acute abnormalities'],
            procedureType: 'Chest CT'
          },
          xray: {
            organs: [
              { name: 'Femur', confidence: 0.94, region: { x: 140, y: 60, width: 40, height: 200 }, color: '#00B894' },
              { name: 'Tibia', confidence: 0.91, region: { x: 120, y: 240, width: 35, height: 160 }, color: '#E84393' },
              { name: 'Fibula', confidence: 0.88, region: { x: 160, y: 250, width: 25, height: 150 }, color: '#0984E3' },
              { name: 'Knee Joint', confidence: 0.92, region: { x: 110, y: 220, width: 80, height: 60 }, color: '#FDCB6E' },
              { name: 'Patella', confidence: 0.86, region: { x: 135, y: 230, width: 30, height: 25 }, color: '#6C5CE7' }
            ],
            findings: ['Bone density normal', 'No fractures detected', 'Joint spaces preserved'],
            procedureType: 'Leg X-Ray'
          },
          ultrasound: {
            organs: [
              { name: 'Fetal Head', confidence: 0.93, region: { x: 120, y: 100, width: 80, height: 80 }, color: '#FF7675' },
              { name: 'Fetal Spine', confidence: 0.89, region: { x: 140, y: 180, width: 20, height: 100 }, color: '#74B9FF' },
              { name: 'Amniotic Fluid', confidence: 0.87, region: { x: 80, y: 80, width: 160, height: 200 }, color: '#55A3FF' },
              { name: 'Placenta', confidence: 0.85, region: { x: 60, y: 120, width: 60, height: 80 }, color: '#FD79A8' },
              { name: 'Umbilical Cord', confidence: 0.82, region: { x: 150, y: 200, width: 40, height: 60 }, color: '#FDCB6E' }
            ],
            findings: ['Fetal development normal', 'Adequate amniotic fluid', 'Placental position normal'],
            procedureType: 'Obstetric Ultrasound'
          }
        };
        const template = (analysisTemplates as any)[procedureType] || analysisTemplates.ct;
        resolve({
          ...template,
          timestamp: new Date().toISOString(),
          processingTime: Math.random() * 2000 + 1000
        });
      }, 2000 + Math.random() * 1000);
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target!.result as string);
        setAnalysisResults(null);
        setAnnotations([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !imagePreview) return;

    setIsAnalyzing(true);
    try {
      const procedureType = selectedProcedure === 'auto' ? 
        Object.keys(procedures)[Math.floor(Math.random() * 4) + 1] : 
        selectedProcedure;
      
      const results = await simulateAIAnalysis(procedureType, imagePreview);
      setAnalysisResults(results);
      setAnnotations(results.organs);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const drawAnnotations = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !annotations.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imageRef.current;

    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((annotation, index) => {
      const { region, color, name, confidence } = annotation;
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(region.x, region.y, region.width, region.height);

      // Draw filled overlay
      ctx.fillStyle = color + '20';
      ctx.fillRect(region.x, region.y, region.width, region.height);

      // Draw label
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      const labelText = `${name} (${Math.round(confidence * 100)}%)`;
      const textWidth = ctx.measureText(labelText).width;
      
      ctx.fillRect(region.x, region.y - 20, textWidth + 10, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, region.x + 5, region.y - 5);

      // Draw point indicator
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(region.x + region.width / 2, region.y + region.height / 2, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [annotations]);

  useEffect(() => {
    if (analysisResults) {
      drawAnnotations();
    }
  }, [analysisResults, drawAnnotations]);

  const exportResults = () => {
    if (!analysisResults) return;

    const exportData = {
      ...analysisResults,
      image: selectedImage?.name,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview('');
    setAnalysisResults(null);
    setAnnotations([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">AI Medical Image Labeler</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Advanced AI-powered analysis for radiographic procedures with anatomical labeling
          </p>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card/30 backdrop-blur-lg border rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">Our AI-Powered Labeling Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-muted-foreground">
            {Object.entries(procedures).filter(([key]) => key !== 'auto').map(([key, procedure]) => (
                <div key={key} className="flex items-center space-x-3 p-3 bg-transparent">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{procedure.name}</span>
                </div>
            ))}
          </div>
        </motion.div>
        
        <div className="bg-card/50 backdrop-blur-lg border rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Select Procedure Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(procedures).map(([key, procedure]) => {
              const IconComponent = procedure.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedProcedure(key)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                    selectedProcedure === key 
                      ? 'border-primary bg-accent' 
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <IconComponent 
                    className="h-6 w-6" 
                    style={{ color: procedure.color }}
                  />
                  <span className="text-xs font-medium text-center text-muted-foreground">{procedure.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card/50 backdrop-blur-lg border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Medical Image Upload</h2>
            
            {!imagePreview ? (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-foreground mb-2">Upload Medical Image</p>
                <p className="text-sm text-muted-foreground">
                  Supports: MRI, CT, X-Ray, Ultrasound, Mammography, PET, Fluoroscopy
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="relative inline-block border rounded-lg overflow-hidden">
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Medical scan"
                    className="max-w-full h-auto"
                    onLoad={drawAnnotations}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        <span>Analyze Image</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetAnalysis}
                    variant="outline"
                    size="icon"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card/50 backdrop-blur-lg border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
              {analysisResults && (
                <Button
                  onClick={exportResults}
                  variant="secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>Export</span>
                </Button>
              )}
            </div>

            {!analysisResults ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p>Upload and analyze an image to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">{analysisResults.procedureType}</h3>
                  <p className="text-sm text-muted-foreground">
                    Analysis completed in {Math.round(analysisResults.processingTime)}ms
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Detected Anatomical Structures</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {analysisResults.organs.map((organ: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: organ.color }}
                          />
                          <span className="font-medium text-foreground">{organ.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">
                            {Math.round(organ.confidence * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">confidence</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    {analysisResults.findings.map((finding: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-green-200">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {analysisResults && (
          <div className="mt-6 bg-card/50 backdrop-blur-lg border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Color Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {analysisResults.organs.map((organ: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border-2"
                    style={{ 
                      backgroundColor: organ.color + '40',
                      borderColor: organ.color 
                    }}
                  />
                  <span className="text-sm text-muted-foreground">{organ.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
         <div className="text-center pt-12">
            <Button asChild variant="ghost">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Home
                </Link>
            </Button>
        </div>

      </div>
    </div>
  );
};

export default MedicalImageLabeler;

    