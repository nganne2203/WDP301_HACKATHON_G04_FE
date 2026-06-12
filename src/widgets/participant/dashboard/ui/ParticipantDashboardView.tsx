import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Github,
  Upload,
  Calendar,
} from 'lucide-react';
import { Progress } from '@/shared/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { toast } from 'sonner';

type UploadType = 'demo' | 'report' | 'slides' | null;

export function ParticipantDashboard() {
  const navigate = useNavigate();
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState('');

  const [submitted, setSubmitted] = useState({
    demo: false,
    report: false,
    slides: false,
  });

  const [submittedValues, setSubmittedValues] = useState({
    demo: '',
    report: '',
    slides: '',
  });

  const doneCount = 1 + Object.values(submitted).filter(Boolean).length; // repo always done
  const progress = Math.round((doneCount / 4) * 100);

  const uploadMeta: Record<NonNullable<UploadType>, { label: string; isUrl: boolean; placeholder: string }> = {
    demo: { label: 'Demo URL', isUrl: true, placeholder: 'https://your-demo.vercel.app' },
    report: { label: 'Project Report', isUrl: false, placeholder: 'report.pdf' },
    slides: { label: 'Presentation Slides', isUrl: false, placeholder: 'slides.pptx' },
  };

  function handleOpenUpload(type: UploadType) {
    setUploadType(type);
    setUrlInput('');
    setFileInput('');
  }

  function handleSubmitUpload() {
    if (!uploadType) return;
    const value = uploadMeta[uploadType].isUrl ? urlInput : fileInput;
    if (!value.trim()) {
      toast.error('Please enter a value before submitting.');
      return;
    }
    setSubmitted((prev) => ({ ...prev, [uploadType]: true }));
    setSubmittedValues((prev) => ({ ...prev, [uploadType]: value.trim() }));
    toast.success(`${uploadMeta[uploadType].label} submitted successfully`);
    setUploadType(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your hackathon journey and team progress
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertTitle>Upcoming Deadline</AlertTitle>
        <AlertDescription>
          Final submission deadline is May 28, 2026 at 11:59 PM. Make sure to submit your project
          repository, demo link, and presentation before the deadline.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Account Registered</p>
                <p className="text-xs text-muted-foreground">Completed on May 1, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Team Joined</p>
                <p className="text-xs text-muted-foreground">Code Wizards</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Checked In</p>
                <p className="text-xs text-muted-foreground">May 15, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">GitHub Access</p>
                <p className="text-xs text-muted-foreground">Access granted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Code Wizards</h3>
                <Badge variant="default">Team Leader</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Web Development Track</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>3 Members</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Github className="w-4 h-4 text-muted-foreground" />
                <a href="#" className="text-blue-600 hover:underline">
                  seal-2026/code-wizards
                </a>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => navigate('/participant/team')}>
              Manage Team
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: 'May 1-10', title: 'Registration Period', status: 'completed' as const },
              { date: 'May 11-14', title: 'Team Formation', status: 'completed' as const },
              { date: 'May 15', title: 'Opening Ceremony & Check-in', status: 'completed' as const },
              { date: 'May 16-27', title: 'Coding Period', status: 'active' as const },
              { date: 'May 28', title: 'Final Submission', status: 'pending' as const },
              { date: 'May 29-30', title: 'Preliminary Judging', status: 'pending' as const },
              { date: 'May 31', title: 'Final Round & Awards', status: 'pending' as const },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                ) : item.status === 'active' ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-100 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.status === 'active' && (
                      <Badge variant="default" className="text-xs">In Progress</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repository — always done */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Repository Link</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                github.com/seal-2026/code-wizards
              </a>
            </div>

            {/* Demo URL */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Demo URL</span>
                {submitted.demo
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300" />}
              </div>
              {submitted.demo ? (
                <a href="#" className="text-sm text-blue-600 hover:underline truncate block">
                  {submittedValues.demo}
                </a>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleOpenUpload('demo')}>
                  <Upload className="w-3 h-3 mr-1" />
                  Upload Demo Link
                </Button>
              )}
            </div>

            {/* Project Report */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Report</span>
                {submitted.report
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300" />}
              </div>
              {submitted.report ? (
                <span className="text-sm text-muted-foreground">{submittedValues.report}</span>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleOpenUpload('report')}>
                  <Upload className="w-3 h-3 mr-1" />
                  Upload Report
                </Button>
              )}
            </div>

            {/* Presentation Slides */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Presentation Slides</span>
                {submitted.slides
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300" />}
              </div>
              {submitted.slides ? (
                <span className="text-sm text-muted-foreground">{submittedValues.slides}</span>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleOpenUpload('slides')}>
                  <Upload className="w-3 h-3 mr-1" />
                  Upload Slides
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Submission Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={!!uploadType} onOpenChange={() => setUploadType(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {uploadType ? uploadMeta[uploadType].label : ''}
            </DialogTitle>
            <DialogDescription>
              {uploadType && uploadMeta[uploadType].isUrl
                ? 'Enter the URL for your live demo.'
                : 'Enter the filename or paste a link to your file.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-sm">
                {uploadType && uploadMeta[uploadType].isUrl ? 'URL' : 'File name / link'}
              </Label>
              {uploadType && uploadMeta[uploadType].isUrl ? (
                <Input
                  className="mt-1"
                  placeholder={uploadType ? uploadMeta[uploadType].placeholder : ''}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              ) : (
                <Input
                  className="mt-1"
                  placeholder={uploadType ? uploadMeta[uploadType].placeholder : ''}
                  value={fileInput}
                  onChange={(e) => setFileInput(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setUploadType(null)}>Cancel</Button>
            <Button onClick={handleSubmitUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
