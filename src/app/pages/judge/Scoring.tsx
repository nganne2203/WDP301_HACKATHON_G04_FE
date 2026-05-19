import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Github, ExternalLink, FileText, Sparkles, CheckCircle2, Save, Send, Copy } from 'lucide-react';
import { mockRubricCriteria, mockTeams } from '../../../lib/data';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';

const teamRepos: Record<string, { repo: string; demo: string; commits: number; stars: number; language: string }> = {
  'team-001': { repo: 'https://github.com/seal-hackathon/data-ninjas', demo: 'https://data-ninjas.vercel.app', commits: 142, stars: 8, language: 'Python' },
  'team-002': { repo: 'https://github.com/seal-hackathon/code-wizards', demo: 'https://code-wizards.netlify.app', commits: 98, stars: 5, language: 'TypeScript' },
  'team-003': { repo: 'https://github.com/seal-hackathon/ai-avengers', demo: 'https://ai-avengers.vercel.app', commits: 76, stars: 3, language: 'JavaScript' },
  'team-004': { repo: 'https://github.com/seal-hackathon/cloud-chasers', demo: 'https://cloud-chasers.netlify.app', commits: 89, stars: 4, language: 'Go' },
  'team-005': { repo: 'https://github.com/seal-hackathon/neural-net', demo: 'https://neural-net-demo.vercel.app', commits: 113, stars: 6, language: 'Python' },
};

function getFallbackLinks(teamId: string) {
  return teamRepos[teamId] ?? {
    repo: `https://github.com/seal-hackathon/team-${teamId}`,
    demo: `https://team-${teamId}.vercel.app`,
    commits: 60,
    stars: 2,
    language: 'JavaScript',
  };
}

export function JudgeScoring() {
  const [selectedTeam, setSelectedTeam] = useState(mockTeams[0]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [overallComment, setOverallComment] = useState('');
  const [submittedTeams, setSubmittedTeams] = useState<Set<string>>(new Set());
  const [draftTeams, setDraftTeams] = useState<Set<string>>(new Set());

  const [repoDialog, setRepoDialog] = useState(false);
  const [demoDialog, setDemoDialog] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const maxScore = mockRubricCriteria.reduce((sum, c) => sum + c.maxScore, 0);
  const links = getFallbackLinks(selectedTeam.id);

  const isSubmitted = submittedTeams.has(selectedTeam.id);

  function handleSaveDraft() {
    setDraftTeams((prev) => new Set(prev).add(selectedTeam.id));
    toast.success(`Draft saved for ${selectedTeam.name}`);
  }

  function handleSubmitConfirmed() {
    setSubmitConfirm(false);
    setSubmittedTeams((prev) => new Set(prev).add(selectedTeam.id));
    setSubmitDone(true);
  }

  function handleCopyLink(link: string) {
    navigator.clipboard.writeText(link).catch(() => {});
    toast.success('Link copied to clipboard');
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Score Teams</h1>
        <p className="text-sm text-muted-foreground">
          Evaluate teams assigned to your judging board
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Assigned Teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockTeams.slice(0, 5).map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTeam.id === team.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{team.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{team.track}</p>
                  </div>
                  {submittedTeams.has(team.id) ? (
                    <Badge variant="default" className="ml-2 bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Done
                    </Badge>
                  ) : draftTeams.has(team.id) ? (
                    <Badge variant="secondary" className="ml-2">Draft</Badge>
                  ) : team.score > 0 ? (
                    <Badge variant="default" className="ml-2">{team.score}</Badge>
                  ) : null}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedTeam.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTeam.track}</p>
                </div>
                <Badge variant="outline">{selectedTeam.leader}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRepoDialog(true)}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">View Repository</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDemoDialog(true)}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">View Demo</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </button>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>AI Evaluation Insight:</strong> Strong technical implementation with
                  clean code architecture. Repository shows consistent commit history and
                  comprehensive documentation. Consider highlighting the innovative use of real-time
                  data processing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Evaluation Rubric</CardTitle>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Score: </span>
                  <span className="font-semibold text-lg">{totalScore}/{maxScore}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSubmitted ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Evaluation submitted</p>
                    <p className="text-sm text-green-700">
                      Your scores for <strong>{selectedTeam.name}</strong> have been recorded.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {mockRubricCriteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-sm font-medium">{criterion.name}</Label>
                          <span className="text-xs text-muted-foreground">
                            Max: {criterion.maxScore} points
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          placeholder="Score"
                          value={scores[criterion.id] || ''}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [criterion.id]: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <div className="md:col-span-2">
                          <Textarea
                            placeholder="Add comments (optional)"
                            rows={1}
                            className="resize-none"
                            value={comments[criterion.id] || ''}
                            onChange={(e) =>
                              setComments({ ...comments, [criterion.id]: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {scores[criterion.id] > 0 && (
                        <Progress
                          value={(scores[criterion.id] / criterion.maxScore) * 100}
                          className="h-1"
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Overall Comments</Label>
                    <Textarea
                      placeholder="Provide overall feedback for the team..."
                      rows={4}
                      className="mt-2"
                      value={overallComment}
                      onChange={(e) => setOverallComment(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSaveDraft}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setSubmitConfirm(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Evaluation
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Repository Dialog */}
      <Dialog open={repoDialog} onOpenChange={setRepoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Repository — {selectedTeam.name}
            </DialogTitle>
            <DialogDescription>GitHub repository submitted for this hackathon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <span className="font-mono text-xs break-all">{links.repo}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 shrink-0"
                onClick={() => handleCopyLink(links.repo)}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Commits</p>
                <p className="font-semibold">{links.commits}</p>
              </div>
              <div className="p-2 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Stars</p>
                <p className="font-semibold">{links.stars}</p>
              </div>
              <div className="p-2 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Language</p>
                <p className="font-semibold">{links.language}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setRepoDialog(false)}>Close</Button>
            <Button onClick={() => { handleCopyLink(links.repo); setRepoDialog(false); }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Repository
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Demo Dialog */}
      <Dialog open={demoDialog} onOpenChange={setDemoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Demo — {selectedTeam.name}
            </DialogTitle>
            <DialogDescription>Live demo deployment submitted for this hackathon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <span className="font-mono text-xs break-all">{links.demo}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 shrink-0"
                onClick={() => handleCopyLink(links.demo)}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the team's submitted demo URL. Open in a new tab to evaluate the live product.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDemoDialog(false)}>Close</Button>
            <Button onClick={() => { handleCopyLink(links.demo); setDemoDialog(false); }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation */}
      <AlertDialog open={submitConfirm} onOpenChange={setSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Evaluation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your evaluation for <strong>{selectedTeam.name}</strong>.
              Total score: <strong>{totalScore}/{maxScore}</strong>. Once submitted, scores cannot
              be changed without coordinator approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitConfirmed}>
              <Send className="w-4 h-4 mr-2" />
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Done */}
      <Dialog open={submitDone} onOpenChange={setSubmitDone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Evaluation Submitted
            </DialogTitle>
            <DialogDescription>
              Your evaluation for <strong>{selectedTeam.name}</strong> has been recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Total Score</span>
              <span className="font-semibold">{totalScore} / {maxScore}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Team</span>
              <span className="font-medium">{selectedTeam.name}</span>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => setSubmitDone(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
