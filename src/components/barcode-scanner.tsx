"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle2, XCircle, Loader2, AlertCircle, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeState {
  status: 'pending' | 'approved' | 'rejected';
  serialNumber?: string;
}

interface DetectedBarcode extends BarcodeState {
  rawValue: string;
  boundingBox: DOMRectReadOnly;
}

const APPROVED_SERIAL_NUMBER = "T2132000111632";

export default function BarcodeScanner() {
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [persistentCodes, setPersistentCodes] = useState<Map<string, BarcodeState>>(new Map());
  const [visibleBarcodes, setVisibleBarcodes] = useState<DetectedBarcode[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameId = useRef<number>();
  const { toast } = useToast();
  
  const isBarcodeDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const getBarcodeDetector = useCallback(() => {
    // @ts-ignore
    return new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128', 'upc_a', 'data_matrix', 'aztec'] });
  }, []);

  const startScan = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsScanning(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsScannerReady(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Error',
          description: 'Could not access the camera. Please check permissions.',
        });
      }
    }
  };

  const stopScan = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const validateBarcode = useCallback((barcodeValue: string) => {
    if (barcodeValue === APPROVED_SERIAL_NUMBER) {
      setPersistentCodes(prev => new Map(prev).set(barcodeValue, { status: 'approved', serialNumber: barcodeValue }));
    } else {
      setPersistentCodes(prev => new Map(prev).set(barcodeValue, { status: 'rejected' }));
    }
  }, []);


  const scanFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !isScanning) {
        return;
    }
    try {
      const barcodeDetector = getBarcodeDetector();
      const detectedInFrame = await barcodeDetector.detect(videoRef.current);
      const newVisibleBarcodes: DetectedBarcode[] = [];

      for (const barcode of detectedInFrame) {
        let barcodeState = persistentCodes.get(barcode.rawValue);

        if (!barcodeState) {
          barcodeState = { status: 'pending' };
          setPersistentCodes(prev => new Map(prev).set(barcode.rawValue, barcodeState!));
          // Validate immediately, no pending state needed for local check
          validateBarcode(barcode.rawValue);
          // Get the updated state
          barcodeState = persistentCodes.get(barcode.rawValue) || { status: 'pending' };
        }
        
        newVisibleBarcodes.push({
          ...barcode,
          status: barcodeState.status,
          serialNumber: barcodeState.serialNumber,
        });
      }
      setVisibleBarcodes(newVisibleBarcodes);
    } catch (e) {
      console.error(e);
    } finally {
      if (isScanning) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    }
  }, [getBarcodeDetector, isScanning, persistentCodes, validateBarcode]);

  useEffect(() => {
    if(isBarcodeDetectorSupported) {
        try {
            getBarcodeDetector();
            setIsScannerReady(true);
        } catch (e) {
            console.error("BarcodeDetector could not be initialized.", e);
            setIsScannerReady(false);
        }
    }
  }, [isBarcodeDetectorSupported, getBarcodeDetector]);

  useEffect(() => {
    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, scanFrame]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  const statusConfig: Record<BarcodeState['status'], { color: string, icon: React.ReactNode }> = {
    approved: { color: 'border-green-500 text-green-400', icon: <CheckCircle2 className="h-full w-full" /> },
    rejected: { color: 'border-red-500 text-red-400', icon: <XCircle className="h-full w-full" /> },
    pending: { color: 'border-orange-400 text-orange-300', icon: <Loader2 className="h-full w-full animate-spin" /> },
  };

  const getBoxStyle = (barcode: DetectedBarcode) => {
    if (!videoRef.current) return {};
    const video = videoRef.current;
    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;
    const { x, y, width, height } = barcode.boundingBox;
    
    return {
      position: 'absolute' as const,
      left: `${x * scaleX}px`,
      top: `${y * scaleY}px`,
      width: `${width * scaleX}px`,
      height: `${height * scaleY}px`,
    };
  };

  return (
    <Card className="w-full max-w-4xl shadow-2xl overflow-hidden border-2 border-primary/20">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] sm:aspect-video bg-black flex items-center justify-center">
          <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
          
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 bg-background/95 backdrop-blur-sm">
              {!isScannerReady ? (
                 <Alert variant="destructive" className="max-w-md">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Compatibility Issue</AlertTitle>
                   <AlertDescription>
                     Your browser does not support the Barcode Detection API. Please try a different browser like Chrome on desktop or Android.
                   </AlertDescription>
                 </Alert>
              ) : (
                <>
                  <Camera className="h-16 w-16 text-primary mb-4" />
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Ready to Scan</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm text-center">
                    Click the button below to start your camera and begin verifying barcodes.
                  </p>
                  <Button size="lg" onClick={startScan}>
                    <ScanLine className="mr-2 h-5 w-5" />
                    Start Scanning
                  </Button>
                </>
              )}
            </div>
          )}
          
          {isScanning && (
            <>
              <div className="absolute inset-0 z-10 pointer-events-none">
                {visibleBarcodes.map((barcode, i) => {
                  const config = statusConfig[barcode.status];
                  return (
                    <div
                      key={`${barcode.rawValue}-${i}`}
                      style={getBoxStyle(barcode)}
                      className={`border-[6px] rounded-lg transition-colors duration-500 ease-in-out ${config.color}`}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs truncate max-w-[calc(100%-1rem)]">
                        {barcode.status === 'approved' ? barcode.serialNumber : barcode.rawValue}
                      </div>
                      <div className="w-8 h-8 absolute -bottom-10 left-1/2 -translate-x-1/2 p-1 bg-black/50 rounded-full">
                        {config.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute bottom-4 right-4 z-20"
                onClick={stopScan}
              >
                Stop Scan
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
