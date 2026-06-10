import { ExternalLink, FileText, Github } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { ScoreSheet } from '@/shared/api/types';

export function SubmissionSummaryCard({
  teamName,
  submission,
  repository,
  latestAnalysis,
  latestAiReview,
  isSubmitted,
}: {
  teamName: string;
  submission: any;
  repository: any;
  latestAnalysis: any;
  latestAiReview: any;
  isSubmitted: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{teamName}</CardTitle>
        {isSubmitted && <Badge variant="default" className="w-fit">Score Submitted</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {submission ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {submission.demoUrl && (
                <a href={submission.demoUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Demo
                  </Button>
                </a>
              )}
              {submission.reportUrl && (
                <a href={submission.reportUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Report
                  </Button>
                </a>
              )}
              {submission.presentationUrl && (
                <a href={submission.presentationUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <Github className="w-3.5 h-3.5 mr-1" />
                    Slides
                  </Button>
                </a>
              )}
            </div>

            {submission.repositoryId && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {repository?.repositoryFullName || submission.repository?.repositoryFullName || 'Repository linked'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Access: {repository?.accessState || 'UNKNOWN'} - Webhook: {repository?.webhookStatus || 'UNKNOWN'}
                    </p>
                  </div>
                  {repository?.repositoryUrl && (
                    <a href={repository.repositoryUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">Open repo</Button>
                    </a>
                  )}
                </div>
                {latestAnalysis && (
                  <p className="text-xs text-muted-foreground">
                    Static analysis: {latestAnalysis.errorCount} errors, {latestAnalysis.warningCount} warnings.
                  </p>
                )}
                {latestAiReview && (
                  <p className="text-xs text-muted-foreground">
                    AI review: {latestAiReview.summary || latestAiReview.reviewKind}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No submission found for this team.</p>
        )}
      </CardContent>
    </Card>
  );
}
