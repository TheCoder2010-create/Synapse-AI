
"use client";

import React, { useState, useRef, type ChangeEvent, type DragEvent, useEffect } from "react";
import pako from "pako";
import { aiAssistedDiagnosis } from "@/ai/flows/ai-assisted-diagnosis";
import { summarizeReport } from "@/ai/flows/summarize-reports";
import { generateStructuredReport } from "@/ai/flows/generate-structured-report";
import { chatStream } from "@/ai/flows/chat";
import type {
  AiAssistedDiagnosisOutput,
  GenerateStructuredReportOutput,
  ChatInput
} from "@/ai/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  BrainCircuit,
  Ruler,
  Contrast,
  FileUp,
  Newspaper,
  FileCheck,
  Printer,
  History,
  Info,
  ZoomIn,
  ZoomOut,
  Move,
  BookOpenCheck,
  PackageOpen,
  Atom,
  UploadCloud,
  Film,
  Save,
  Mic,
  MicOff,
  User,
  Bot,
} from "lucide-react";
import { cn, extractFramesFromVideo } from "@/lib/utils";

interface Message {
    role: 'user' | 'assistant';
    text: string;
    audioUrl?: string;
}

export default function ProfessionalViewerPage() {
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [images, setImages] = useState<string[] | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] =
    useState<AiAssistedDiagnosisOutput | null>(null);
  const [report, setReport] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const [structuredReport, setStructuredReport] = useState<GenerateStructuredReportOutput | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [reportTemplate, setReportTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  // Carousel state
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(0)


  // Windowing state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isWindowingOpen, setIsWindowingOpen] = useState(false);
  const [isWindowingActive, setIsWindowingActive] = useState(false);
  const windowingStartRef = useRef<{ x: number, y: number, initialBrightness: number, initialContrast: number } | null>(null);


  // Canvas state
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  // Date for PDF view
  const [reportDate, setReportDate] = useState("");
  useEffect(() => {
    setReportDate(new Date().toLocaleDateString());
  }, []);

  // Voice Assistant State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const imageToDraw = (index: number) => {
    return images?.[index] ?? null;
  }

  const clearAll = () => {
    setImages(null);
    setVideo(null);
    setFileType(null);
    setDiagnosis(null);
    setReport("");
    setSummary(null);
    setStructuredReport(null);
    setReportTemplate(null);
    setMessages([]);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // For now, handle single file upload (first file)
      const reader = new FileReader();

      clearAll();

      if (file.type.startsWith('video/')) {
        setFileType('video');
        reader.onloadend = () => {
          const result = reader.result as string;
          setVideo(result);
          toast({ title: "Video Loaded", description: "Ready for viewing and analysis." });
          handleDiagnose(null, result);
        };
        reader.readAsDataURL(file);
      } else {
        setFileType('image');
        handleImageUpload(e);
      }
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const fileArray = Array.from(files);

        const processFile = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    if (file.name.endsWith('.gz')) {
                        try {
                            const compressedData = new Uint8Array(reader.result as ArrayBuffer);
                            const decompressedData = pako.inflate(compressedData);
                            
                            const blob = new Blob([decompressedData], { type: 'application/dicom' });
                            const blobReader = new FileReader();
                            blobReader.onloadend = () => {
                                resolve(blobReader.result as string);
                            };
                            blobReader.onerror = reject;
                            blobReader.readAsDataURL(blob);

                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        resolve(reader.result as string);
                    }
                };
                reader.onerror = reject;

                if (file.name.endsWith('.gz')) {
                  reader.readAsArrayBuffer(file);
                } else {
                  reader.readAsDataURL(file);
                }
            });
        };
        
        const imagePromises = fileArray.map(processFile);
        
        Promise.all(imagePromises).then(processedFiles => {
            const imageDataUris = processedFiles;

            setImages(imageDataUris);
            toast({
                title: `${imageDataUris.length} Image(s) Loaded`,
                description: "Ready for viewing and analysis.",
            });
            handleDiagnose(imageDataUris);

        }).catch(error => {
            console.error("Error reading or decompressing files:", error);
            toast({ variant: "destructive", title: "File Process Error", description: "Could not read or decompress the selected files." });
        });
    }
  };

  const handleTemplateUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setReportTemplate(result);
        toast({
          title: "Template Loaded",
          description: "The new report will be generated using this template.",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const inputEvent = { target: { files: e.dataTransfer.files } } as ChangeEvent<HTMLInputElement>;
    handleFileChange(inputEvent);
  };

  // Update slide count for carousel
  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length)
    setCurrentSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  // Draw images to canvas
  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach((imageUri, index) => {
        const canvas = canvasRefs.current[index];
        const context = canvas?.getContext('2d');
        const imageToDrawOnCanvas = imageToDraw(index);

        if (context && imageToDrawOnCanvas) {
          const img = new window.Image();
          img.crossOrigin = "Anonymous";
          img.src = imageToDrawOnCanvas;
          img.onload = () => {
              const parent = canvas.parentElement;
              if (!parent) return;

              const parentWidth = parent.clientWidth;
              const parentHeight = parent.clientHeight;
              
              const aspectRatio = img.width / img.height;
              let newWidth = parentWidth;
              let newHeight = parentWidth / aspectRatio;

              if (newHeight > parentHeight) {
                  newHeight = parentHeight;
                  newWidth = parentHeight * aspectRatio;
              }
              
              canvas.width = newWidth;
              canvas.height = newHeight;

              context.clearRect(0, 0, canvas.width, canvas.height);
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.onerror = () => {
            if (!context) return;
            context.fillStyle = '#222';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText('Error loading image', canvas.width / 2, canvas.height / 2);
          }
        }
      })
    }
  }, [images, currentSlide, brightness, contrast]);


  const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.button === 2) { // Right click for windowing
          setIsWindowingActive(true);
          windowingStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              initialBrightness: brightness,
              initialContrast: contrast,
          };
      }
  };

  const handleMouseMoveOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isWindowingActive && windowingStartRef.current) {
          const deltaX = e.clientX - windowingStartRef.current.x;
          const deltaY = e.clientY - windowingStartRef.current.y;

          const newContrast = windowingStartRef.current.initialContrast + deltaX * 0.5;
          const newBrightness = windowingStartRef.current.initialBrightness - deltaY * 0.5;

          setContrast(Math.max(0, Math.min(200, newContrast)));
          setBrightness(Math.max(0, Math.min(200, newBrightness)));
      }
  };

  const handleMouseUpOrLeaveCanvas = () => {
      if (isWindowingActive) {
          setIsWindowingActive(false);
          windowingStartRef.current = null;
      }
  };
  
  const handleDiagnose = async (imagesForDiagnosis?: string[] | null, videoUri?: string | null) => {
    
    setIsLoadingDiagnosis(true);
    setDiagnosis(null);
    setReport("");
    setSummary(null);
    setStructuredReport(null);
    setMessages([]);

    let frames: string[] = [];

    if (videoUri) {
      try {
        frames = await extractFramesFromVideo(videoUri, 10); // Extract 10 frames
        if (frames.length === 0) throw new Error("Could not extract frames from video.");
        setImages(frames);
        toast({ title: "Video Processing", description: `Extracted ${frames.length} frames for analysis.` });
      } catch (error) {
        console.error("Video processing error:", error);
        toast({ variant: "destructive", title: "Video Error", description: "Failed to process the video file." });
        setIsLoadingDiagnosis(false);
        return;
      }
    }

    const imagesToProcess = imagesForDiagnosis || (frames.length > 0 ? frames : null);

    if (!imagesToProcess || imagesToProcess.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Media",
        description: "Please upload a valid image series or video.",
      });
      setIsLoadingDiagnosis(false);
      return;
    }

    try {
      const result = await aiAssistedDiagnosis({
        radiologyMediaDataUris: imagesToProcess,
        mediaType: videoUri ? 'video' : 'image',
      });
      setDiagnosis(result);
      if (result.primarySuggestion) {
        setReport(result.primarySuggestion);
      }
      setMessages([{ role: 'assistant', text: "I've analyzed the case. How can I help you with the report?" }]);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while running the AI diagnosis. Please try again.";
      toast({
        variant: "destructive",
        title: "Diagnosis Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoadingDiagnosis(false);
    }
  };

  const handleSummarize = async () => {
    if (!report) {
      toast({
        variant: "destructive",
        title: "Missing Report",
        description: "Please enter a report to summarize.",
      });
      return;
    }
    setIsLoadingSummary(true);
    setSummary(null);
    try {
      const result = await summarizeReport({ reportText: report });
      setSummary(result.summary);
      toast({
        title: "Summary Generated",
        description: "The report has been summarized below.",
      });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while summarizing the report. Please try again.";
      toast({
        variant: "destructive",
        title: "Summarization Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };


  const handleFinalizeAndSave = async () => {
    if (!report || !diagnosis || (!images && !video)) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "An image/video, report, and AI diagnosis are required to finalize.",
      });
      return;
    }
    setIsSaving(true);
    setStructuredReport(null);
    try {
      const finalReport = await generateStructuredReport({
        reportText: report,
        diagnosis: diagnosis,
        reportTemplate: reportTemplate,
      });
      setStructuredReport(finalReport);
      toast({ title: "Report Finalized", description: "The structured report is now available." });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Finalizing & Saving Failed",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Voice Assistant Logic
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = handleRecognitionResult;
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast({ variant: 'destructive', title: 'Voice Error', description: `Speech recognition failed: ${event.error}` });
        setIsRecording(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
        console.warn("Speech recognition not supported in this browser.");
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'Speech recognition is not supported in this browser.' });
        return;
      }
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleRecognitionResult = async (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    setIsRecording(false);
    await handleSend(transcript);
  };
  
  const handleSend = async (text: string) => {
      if (!text || isResponding) return;

      const newUserMessage: Message = { role: 'user', text };
      const newMessages = [...messages, newUserMessage];
      setMessages(newMessages);
      setIsResponding(true);
      
      let fullResponseText = "";
      let fullResponseAudioUrl = "";

      try {
        const stream = await chatStream({
            messages: newMessages.map(m => ({role: m.role, text: m.text})),
        });
        
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const data = JSON.parse(chunk);
            
            if (data.text) {
                fullResponseText += data.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'assistant') {
                        lastMessage.text = fullResponseText;
                        return [...prev.slice(0, -1), lastMessage];
                    }
                    return [...prev, { role: 'assistant', text: fullResponseText, audioUrl: "" }];
                });
            }
            if (data.audioUrl) {
                fullResponseAudioUrl = data.audioUrl;
            }
        }
        
      } catch (error) {
        console.error("Chat stream error:", error);
        toast({ variant: 'destructive', title: 'Chat Error', description: 'Failed to get response from AI.' });
        setMessages(prev => [...prev.slice(0, -1)]); // Remove optimistic user message on error
      } finally {
        if (fullResponseAudioUrl && audioRef.current) {
            audioRef.current.src = fullResponseAudioUrl;
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'assistant') {
                lastMessage.audioUrl = fullResponseAudioUrl;
                return [...prev.slice(0, -1), lastMessage];
            }
            return prev;
        });
        setIsResponding(false);
      }
  };

  const hasKnowledgeLookups = (diagnosis?.tciaLookups && diagnosis.tciaLookups.length > 0) || (diagnosis?.imaiosLookups && diagnosis.imaiosLookups.length > 0) || (diagnosis?.openiLookups && diagnosis.openiLookups.length > 0);
  
  const firstAvailableTab = diagnosis ? (messages.length > 0 ? "chat" : "analysis") : "analysis";
  const reportStatus = structuredReport ? "Final" : diagnosis ? "Reviewed" : "Draft";
  const statuses = ['Draft', 'Reviewed', 'Final'];
  const currentStatusIndex = statuses.indexOf(reportStatus);
    
  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <audio ref={audioRef} className="hidden" />
      <header className="flex-none border-b border-border">
        <div className="px-2">
          <Menubar className="border-none rounded-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => fileInputRef.current?.click()}>Open Case <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
                <MenubarItem onClick={() => templateInputRef.current?.click()}>Upload Template</MenubarItem>
                <MenubarItem onClick={handleFinalizeAndSave} disabled={isSaving || !diagnosis}>Finalize & Save <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Export PDF</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Toggle Fullscreen</MenubarItem>
                <MenubarItem onClick={() => { setBrightness(100); setContrast(100); }}>Reset View</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger>Layout</MenubarTrigger>
               <MenubarContent>
                <MenubarItem>1x1</MenubarItem>
                <MenubarItem disabled>1x2</MenubarItem>
                <MenubarItem disabled>2x2</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger>Tools</MenubarTrigger>
               <MenubarContent>
                <MenubarItem onClick={() => setIsWindowingOpen(true)}>Windowing</MenubarItem>
                <MenubarItem>Zoom</MenubarItem>
                <MenubarItem>Pan</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Measurements</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
        <Separator />
        <div className="p-2 flex items-center gap-1 h-14">
           <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><FileUp /><span className="sr-only">Upload Case</span></Button>
           <Button variant="ghost" size="icon" onClick={() => handleDiagnose(images, video)} disabled={(!images && !video) || isLoadingDiagnosis}>
            {isLoadingDiagnosis ? <Loader2 className="animate-spin" /> : <Sparkles />}
            <span className="sr-only">Run AI Analysis</span>
           </Button>
           <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setIsWindowingOpen(true)}><Contrast /><span className="sr-only">Windowing</span></Button>
            <Button variant="ghost" size="icon"><ZoomIn /><span className="sr-only">Zoom In</span></Button>
            <Button variant="ghost" size="icon"><ZoomOut /><span className="sr-only">Zoom Out</span></Button>
            <Button variant="ghost" size="icon"><Move /><span className="sr-only">Pan</span></Button>
            <Button variant="ghost" size="icon"><Ruler /><span className="sr-only">Measurements</span></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
           <Button variant="ghost" size="icon" onClick={handleFinalizeAndSave} disabled={isSaving || !diagnosis}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            <span className="sr-only">Finalize and Save</span>
           </Button>
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_420px] gap-2 p-2 pt-0 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between p-2 h-14 flex-none">
                  <CardTitle className="text-sm font-medium">Primary View</CardTitle>
                  {fileType === 'image' && images && images.length > 0 && (
                    <div className="text-sm text-muted-foreground font-mono">
                      Image {currentSlide + 1} of {slideCount}
                    </div>
                  )}
                  {fileType === 'video' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                      <Film className="h-4 w-4" />
                      <span>Video Clip</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent 
                    className="flex-1 p-0 relative flex items-center justify-center bg-black"
                >
                   {!fileType ? (
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg flex items-center justify-center flex-col h-full w-full text-center transition-all cursor-pointer hover:border-primary bg-card/50",
                        isDragging ? 'border-primary bg-accent' : 'border-border'
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={(e) => handleDragEvents(e, true)}
                      onDragOver={(e) => handleDragEvents(e, true)}
                      onDragLeave={(e) => handleDragEvents(e, false)}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/dicom,.dcm,.gz,video/mp4"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                      />
                       <input
                        ref={templateInputRef}
                        type="file"
                        accept=".txt,.md"
                        className="hidden"
                        onChange={handleTemplateUpload}
                      />
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Upload className="w-12 h-12" />
                        <p className="font-semibold text-lg">Click or drag & drop to open case</p>
                        <p className="text-sm">Supported formats: DICOM, GZ, JPG, PNG, MP4</p>
                      </div>
                    </div>
                  ) : fileType === 'image' && images ? (
                    <Carousel setApi={setCarouselApi} className="w-full h-full">
                      <CarouselContent className="h-full">
                        {images.map((imageUri, index) => (
                           <CarouselItem key={index} className="h-full flex items-center justify-center">
                              <canvas
                                ref={el => { if (el) canvasRefs.current[index] = el; }}
                                onMouseDown={handleMouseDownOnCanvas}
                                onMouseUp={handleMouseUpOrLeaveCanvas}
                                onMouseMove={handleMouseMoveOnCanvas}
                                onMouseLeave={handleMouseUpOrLeaveCanvas}
                                onContextMenu={(e) => e.preventDefault()}
                                style={{ 
                                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                                 }}
                                className={cn(
                                    "max-w-full max-h-full object-contain transition-all duration-200",
                                    isWindowingActive ? 'cursor-move' : 'cursor-default'
                                )}
                              />
                           </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </Carousel>
                  ) : fileType === 'video' && video ? (
                    <video
                        src={video}
                        controls
                        className="max-w-full max-h-full"
                        style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />
                  ) : null}
                  
                   {fileType && (isWindowingActive) && (
                      <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-mono p-2 rounded-md pointer-events-none z-20">
                          <p>B: {Math.round(brightness)}%</p>
                          <p>C: {Math.round(contrast)}%</p>
                      </div>
                    )}
                     {(isLoadingDiagnosis) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="font-semibold">AI is analyzing...</p>
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="flex flex-col gap-2 overflow-hidden">
          {diagnosis ? (
            <Tabs defaultValue={firstAvailableTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Analysis
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                        <Mic className="w-4 h-4 mr-2" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" disabled={!hasKnowledgeLookups}>
                         <BookOpenCheck className="w-4 h-4 mr-2" />
                        Knowledge
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="flex-1 overflow-hidden -mr-3 mt-4">
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base"><History className="w-5 h-5"/> Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center">
                              {statuses.map((status, index) => (
                                  <React.Fragment key={status}>
                                      <div className="flex flex-col items-center gap-2">
                                          <div className={cn(
                                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                              index <= currentStatusIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                          )}>
                                              {index < currentStatusIndex ? <FileCheck className="w-4 h-4" /> : index + 1}
                                          </div>
                                          <span className={cn(
                                              "text-xs font-semibold",
                                              index <= currentStatusIndex ? "text-foreground" : "text-muted-foreground"
                                          )}>
                                              {status}
                                          </span>
                                      </div>
                                      {index < statuses.length - 1 && (
                                          <Separator className={cn(
                                              "mx-2 flex-1",
                                              index < currentStatusIndex ? "bg-primary" : "bg-border"
                                          )} />
                                      )}
                                  </React.Fragment>
                              ))}
                            </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="w-5 h-5 text-primary" />
                            AI Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Primary Suggestion</Label>
                            <p className="font-semibold">{diagnosis?.primarySuggestion}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Potential Areas of Interest</Label>
                            <p className="text-sm text-muted-foreground">{diagnosis?.potentialAreasOfInterest}</p>
                          </div>
                          {diagnosis.measurements && diagnosis.measurements.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Ruler className="w-3 h-3" /> Key Measurements</Label>
                                <div className="space-y-1">
                                    {diagnosis.measurements.map((item, index) => (
                                        <div key={index} className="flex justify-between items-baseline text-sm">
                                            <p className="text-muted-foreground">{item.structure}</p>
                                            <p className="font-mono font-semibold text-foreground">{item.measurement}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                          )}
                          <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="reasoning">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2 text-sm">
                                    <BrainCircuit className="w-4 h-4" />
                                    Show AI Reasoning
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2 text-xs">
                                    <p className="font-semibold">Initial Observations:</p>
                                    <p className="italic text-muted-foreground/80">"{diagnosis.reasoningProcess.initialObservations}"</p>
                                    <p className="font-semibold">Final Justification:</p>
                                    <p className="italic text-muted-foreground/80">"{diagnosis.reasoningProcess.justification}"</p>
                                </AccordionContent>
                              </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>

                      <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Radiologist's Report
                              </div>
                              <Button variant="outline" size="sm" onClick={() => templateInputRef.current?.click()}>
                                <UploadCloud className="w-4 h-4 mr-2" />
                                Upload Template
                              </Button>
                            </CardTitle>
                             {reportTemplate && (
                              <CardDescription className="text-xs text-green-400 pt-2">
                                Using custom report template.
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Textarea
                              placeholder="Review and edit the AI-assisted draft..."
                              value={report}
                              onChange={(e) => setReport(e.target.value)}
                              className="h-64 text-sm"
                            />
                            <Button onClick={handleSummarize} disabled={isLoadingSummary || !report} className="w-full" variant="secondary">
                              {isLoadingSummary ? <Loader2 className="animate-spin" /> : <Newspaper size={16} />}
                              {isLoadingSummary ? 'Summarizing...' : 'Summarize for Referring Physician'}
                            </Button>
                            {summary && <p className="text-xs text-muted-foreground border-l-2 pl-3 mt-2">{summary}</p>}
                          </CardContent>
                      </Card>

                      {structuredReport && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-base">
                                        <FileCheck className="w-5 h-5 text-primary"/>
                                        Final Report
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => window.print()}>
                                        <Printer className="h-4 w-4" />
                                        <span className="sr-only">Export PDF</span>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 font-serif rounded-md space-y-6 text-sm">
                               <div className="text-center">
                                  <h2 className="text-xl font-bold">Radiology Report</h2>
                                  <p className="text-xs">CONFIDENTIAL</p>
                              </div>
                              <Separator className="bg-gray-300" />
                                <div>
                                    <p className="text-md font-bold uppercase tracking-wider">Technique</p>
                                    <p className="mt-1 leading-relaxed">{structuredReport?.technique}</p>
                                </div>
                                <div>
                                    <p className="text-md font-bold uppercase tracking-wider">Findings</p>
                                    <div className="mt-1 space-y-1 leading-relaxed whitespace-pre-wrap">
                                        {structuredReport?.findings}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-md font-bold uppercase tracking-wider">Impression</p>
                                    <p className="mt-1 font-semibold leading-relaxed">{structuredReport?.impression}</p>
                                </div>
                                <div className="pt-4 mt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                                    <p>Report generated by Synapse AI on {reportDate}</p>
                                </div>
                            </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden -mr-3 mt-4">
                  <div className="flex-1 flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                           <Bot className="h-5 w-5" /> Voice Assistant
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Click the microphone to talk to the AI assistant.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4">
                          <div className="space-y-4">
                            {messages.map((message, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex gap-3 text-sm",
                                  message.role === "user" && "justify-end"
                                )}
                              >
                                {message.role === "assistant" && (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Bot className="h-5 w-5" />
                                  </div>
                                )}
                                <div
                                  className={cn(
                                    "rounded-lg px-4 py-2",
                                    message.role === "user"
                                      ? "bg-secondary text-secondary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {message.text}
                                </div>
                                {message.role === "user" && (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                    <User className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            ))}
                             {isResponding && (
                                <div className="flex gap-3 text-sm">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Bot className="h-5 w-5" />
                                  </div>
                                  <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground flex items-center gap-2">
                                     <Loader2 className="h-4 w-4 animate-spin" />
                                     <span>Thinking...</span>
                                  </div>
                                </div>
                              )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                      <CardContent className="p-4 border-t">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon" 
                            variant={isRecording ? 'destructive' : 'outline'}
                            onClick={handleToggleRecording}
                            disabled={isResponding}
                           >
                            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          </Button>
                           <p className="text-xs text-muted-foreground flex-1">
                            {isRecording ? "Listening..." : (isResponding ? "Responding..." : "Click mic to talk")}
                           </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="flex-1 overflow-hidden -mr-3 mt-4">
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-4">
                      {diagnosis?.imaiosLookups && diagnosis.imaiosLookups.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                <Atom className="w-5 h-5"/>
                                Clinical Knowledge Base
                                </CardTitle>
                                <CardDescription>Anatomical definitions related to the AI's findings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {diagnosis.imaiosLookups?.map((lookup, index) => (
                                <div key={index} className="p-3 rounded-md border bg-card-foreground/5">
                                    <p className="font-semibold text-sm">{lookup.term}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{lookup.summary}</p>
                                </div>
                                ))}
                            </CardContent>
                        </Card>
                      )}
                      {diagnosis?.tciaLookups && diagnosis.tciaLookups.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <PackageOpen className="w-5 h-5"/>
                              Public Research Datasets
                            </CardTitle>
                            <CardDescription>Public imaging collections related to the AI's findings.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {diagnosis.tciaLookups?.map((lookup, index) => (
                              <div key={index} className="p-3 rounded-md border bg-card-foreground/5">
                                <p className="font-semibold text-sm">{lookup.term}</p>
                                <p className="text-xs text-muted-foreground mt-1">{lookup.summary}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

            </Tabs>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-8 rounded-lg border-2 border-dashed">
                  <Info className="w-10 h-10 mb-4" />
                  <h3 className="font-semibold text-lg text-foreground">Awaiting Case</h3>
                  <p className="text-sm">Upload an image or DICOM series to begin.</p>
                </div>
            )}
        </div>
      </main>

      <Dialog open={isWindowingOpen} onOpenChange={setIsWindowingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Image Windowing</DialogTitle>
            <DialogDescription>
              Adjust image brightness and contrast. You can also right-click and drag on the image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brightness" className="text-right">
                Brightness
              </Label>
              <Slider
                id="brightness"
                value={[brightness]}
                onValueChange={(val) => setBrightness(val[0])}
                max={200}
                step={1}
                className="col-span-2"
              />
              <span className="w-10 text-center font-mono text-sm text-muted-foreground">{Math.round(brightness)}%</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contrast" className="text-right">
                Contrast
              </Label>
              <Slider
                id="contrast"
                value={[contrast]}
                onValueChange={(val) => setContrast(val[0])}
                max={200}
                step={1}
                className="col-span-2"
              />
               <span className="w-10 text-center font-mono text-sm text-muted-foreground">{Math.round(contrast)}%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBrightness(100); setContrast(100); }}>Reset</Button>
            <Button onClick={() => setIsWindowingOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
