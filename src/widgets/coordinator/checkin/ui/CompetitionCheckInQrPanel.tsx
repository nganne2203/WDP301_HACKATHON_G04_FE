import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Clock3, Download, Loader2, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';

import { participantsApi } from '@/shared/api/participants';
import { ApiError } from '@/shared/api/client';
import type { CheckInQr } from '@/shared/api/types';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

function getRemainingSeconds(expiresAt?: string) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getStorageKey(competitionId: string) {
  return `seal:check-in-qr:${competitionId}`;
}

function readStoredQr(competitionId: string): CheckInQr | null {
  try {
    const value = window.sessionStorage.getItem(getStorageKey(competitionId));
    if (!value) return null;
    const stored = JSON.parse(value) as CheckInQr;
    return getRemainingSeconds(stored.expiresAt) > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function CompetitionCheckInQrPanel({
  competitionId,
  disabled = false,
  eventTitle,
}: {
  competitionId?: string;
  disabled?: boolean;
  eventTitle?: string;
}) {
  const [qr, setQr] = useState<CheckInQr | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const qrMutation = useMutation({
    mutationFn: () => participantsApi.generateCheckInQr(competitionId!),
    onSuccess: (response) => {
      setQr(response.data);
      setRemainingSeconds(getRemainingSeconds(response.data.expiresAt));
      window.sessionStorage.setItem(getStorageKey(competitionId!), JSON.stringify(response.data));
    },
  });

  useEffect(() => {
    if (!competitionId || disabled) {
      setQr(null);
      setRemainingSeconds(0);
      if (competitionId) window.sessionStorage.removeItem(getStorageKey(competitionId));
      return;
    }

    const storedQr = readStoredQr(competitionId);
    if (storedQr) {
      setQr(storedQr);
      setRemainingSeconds(getRemainingSeconds(storedQr.expiresAt));
      return;
    }

    window.sessionStorage.removeItem(getStorageKey(competitionId));
    setQr(null);
    setRemainingSeconds(0);
  }, [competitionId, disabled]);

  useEffect(() => {
    if (!qr?.expiresAt) return;
    const updateCountdown = () => {
      const seconds = getRemainingSeconds(qr.expiresAt);
      setRemainingSeconds(seconds);
      if (seconds === 0 && competitionId) window.sessionStorage.removeItem(getStorageKey(competitionId));
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [qr?.expiresAt]);

  const isExpired = Boolean(qr) && remainingSeconds === 0;
  const errorMessage = qrMutation.error instanceof ApiError
    ? qrMutation.error.firstError
    : qrMutation.error
      ? 'Unable to generate the competition check-in QR.'
      : null;

  const downloadQr = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.href = qr.qrCodeDataUrl;
    link.download = `check-in-${(eventTitle || 'competition').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  if (!competitionId) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-slate-50 p-6 text-center">
        <QrCode className="h-14 w-14 text-slate-400" />
        <p className="text-sm text-muted-foreground">Select an competition to generate its check-in QR.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white p-3">
        {!qr && !qrMutation.isPending && (
          <div className="flex flex-col items-center gap-3 px-5 text-center">
            <div className="rounded-full bg-blue-100 p-4 text-blue-700">
              <QrCode className="h-12 w-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              {disabled ? 'Check-in QR is available only while the competition is ongoing.' : 'Generate a short-lived QR for participants to scan.'}
            </p>
          </div>
        )}
        {qrMutation.isPending && <Loader2 className="h-9 w-9 animate-spin text-blue-600" />}
        {qr && !qrMutation.isPending && (
          <>
            <img
              src={qr.qrCodeDataUrl}
              alt="Competition check-in QR"
              className={`h-full w-full object-contain ${isExpired ? 'opacity-20 blur-[1px]' : ''}`}
            />
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/75">
                <Clock3 className="h-8 w-8 text-amber-600" />
                <p className="font-medium">QR expired</p>
              </div>
            )}
          </>
        )}
      </div>

      {qr && (
        <div className={`flex items-center justify-center gap-2 text-sm font-medium ${isExpired ? 'text-amber-700' : 'text-emerald-700'}`}>
          {isExpired ? <Clock3 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isExpired ? 'Generate a new QR' : `Active for ${formatCountdown(remainingSeconds)}`}
        </div>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
        <Button onClick={() => qrMutation.mutate()} disabled={disabled || qrMutation.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {qr ? 'Generate new' : 'Generate QR'}
        </Button>
        <Button variant="outline" onClick={downloadQr} disabled={!qr || isExpired}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
