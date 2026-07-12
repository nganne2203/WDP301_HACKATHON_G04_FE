import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, ImageUp, Loader2, RefreshCw, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { participantsApi } from '@/shared/api/participants';
import { ApiError } from '@/shared/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

const READER_ID = 'participant-self-check-in-qr-reader';
type QrScanner = {
  isScanning: boolean;
  start: (
    cameraConfig: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number }; aspectRatio: number },
    successCallback: (decodedText: string) => void | Promise<void>,
    errorCallback?: () => void,
  ) => Promise<unknown>;
  stop: () => Promise<unknown>;
  scanFile: (imageFile: File, showImage?: boolean) => Promise<string>;
  clear: () => Promise<unknown> | void;
};

async function waitForReaderElement() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const reader = document.getElementById(READER_ID);
    if (reader) return reader;
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  return null;
}

function getScannerError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CHECK_IN_QR_EXPIRED') return 'This check-in QR has expired. Ask the coordinator for a new one.';
    if (error.code === 'PARTICIPANT_ALREADY_CHECKED_IN') return 'You have already checked in for this event.';
    if (error.code === 'INVALID_CHECK_IN_QR') return 'This is not a valid event check-in QR.';
    return error.firstError;
  }
  if (error instanceof Error) return error.message;
  return 'Could not process this QR. Please try again.';
}

export function ParticipantCheckInScannerDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const scanLockedRef = useRef(false);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scanMutation = useMutation({
    mutationFn: (token: string) => participantsApi.scanCheckInQr(token),
    onSuccess: (response) => {
      toast.success('Check-in successful', {
        description: response.data.eventId ? 'Your attendance has been recorded.' : undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all });
    },
  });

  const scanQr = scanMutation.mutateAsync;
  const handleScan = useCallback(async (token: string) => {
    await scanQr(token);
  }, [scanQr]);

  useEffect(() => {
    if (!open) return;

    let disposed = false;
    scanLockedRef.current = false;
    setScannerError(null);
    setStarting(true);

    const stopScanner = async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      if (scanner.isScanning) await scanner.stop().catch(() => undefined);
      await Promise.resolve(scanner.clear()).catch(() => undefined);
    };

    const startScanner = async () => {
      try {
        const reader = await waitForReaderElement();
        if (!reader) {
          throw new Error('QR scanner container is not ready. Please try again.');
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not available in this browser or context.');
        }

        const { Html5Qrcode } = await import('html5-qrcode');
        scannerRef.current = new Html5Qrcode(READER_ID, false);

        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          async (decodedText) => {
            if (scanLockedRef.current || disposed) return;
            scanLockedRef.current = true;
            await scannerRef.current?.stop().catch(() => undefined);

            try {
              await handleScan(decodedText);
              if (!disposed) setOpen(false);
            } catch (error) {
              if (!disposed) setScannerError(getScannerError(error));
            }
          },
          () => undefined,
        );

        if (!disposed) setStarting(false);
      } catch (error: unknown) {
        if (!disposed) {
          setStarting(false);
          setScannerError(
            error instanceof Error
              ? error.message
              : 'Camera access failed. Check browser permissions and try again.',
          );
        }
      }
    };

    void startScanner();

    return () => {
      disposed = true;
      void stopScanner();
      scannerRef.current = null;
    };
  }, [attempt, handleScan, open]);

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;

    scanLockedRef.current = true;
    setScannerError(null);
    setScanningImage(true);

    try {
      const reader = await waitForReaderElement();
      if (!reader) {
        throw new Error('QR scanner container is not ready. Please try again.');
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode(READER_ID, false);
      if (scannerRef.current.isScanning) await scannerRef.current.stop().catch(() => undefined);

      const decodedText = await scannerRef.current.scanFile(file, false);
      await handleScan(decodedText);
      setOpen(false);
    } catch (error) {
      setScannerError(getScannerError(error));
      scanLockedRef.current = false;
    } finally {
      setScanningImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <ScanLine className="h-4 w-4" />
          Scan QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan event check-in QR
          </DialogTitle>
          <DialogDescription>
            Point your camera at the QR code displayed by the coordinator.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 overflow-hidden rounded-xl border bg-slate-950">
          <div
            id={READER_ID}
            className="h-full w-full overflow-hidden [&_img]:max-h-72 [&_img]:w-full [&_img]:object-contain [&_video]:h-full [&_video]:w-full [&_video]:rounded-lg [&_video]:object-cover"
          />
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-sm text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              Starting camera…
            </div>
          )}
        </div>

        {scannerError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{scannerError}</AlertDescription>
          </Alert>
        )}

        {scannerError && (
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanningImage || scanMutation.isPending}
          >
            {scanningImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
            Upload QR image
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleImageUpload(event.target.files?.[0])}
        />
      </DialogContent>
    </Dialog>
  );
}
