import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, Camera, Loader2, RefreshCw, ScanLine } from 'lucide-react';
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
  const scanLockedRef = useRef(false);

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
    const scanner = new Html5Qrcode(READER_ID, false);
    scanLockedRef.current = false;
    setScannerError(null);
    setStarting(true);

    const stopScanner = async () => {
      if (scanner.isScanning) await scanner.stop().catch(() => undefined);
      await scanner.clear().catch(() => undefined);
    };

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
      async (decodedText) => {
        if (scanLockedRef.current || disposed) return;
        scanLockedRef.current = true;
        await scanner.stop().catch(() => undefined);

        try {
          await handleScan(decodedText);
          if (!disposed) setOpen(false);
        } catch (error) {
          if (!disposed) setScannerError(getScannerError(error));
        }
      },
      () => undefined,
    ).then(() => {
      if (!disposed) setStarting(false);
    }).catch((error: unknown) => {
      if (!disposed) {
        setStarting(false);
        setScannerError(
          error instanceof Error
            ? error.message
            : 'Camera access failed. Check browser permissions and try again.',
        );
      }
    });

    return () => {
      disposed = true;
      void stopScanner();
    };
  }, [attempt, handleScan, open]);

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

        <div className="relative min-h-72 overflow-hidden rounded-xl border bg-slate-950">
          <div id={READER_ID} className="w-full [&_video]:rounded-lg" />
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
      </DialogContent>
    </Dialog>
  );
}
