import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Trophy, Medal, Award, Upload, CheckCircle2, Send } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { mockFinalists } from '../../../lib/data';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';

export function Results() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [published, setPublished] = useState(false);

  function handlePublish() {
    setShowConfirm(false);
    setPublished(true);
    toast.success('Results published successfully — participants have been notified');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Final Round & Results</h1>
          <p className="text-sm text-muted-foreground">
            View finalist rankings and publish results
          </p>
        </div>
        {published ? (
          <Button size="lg" variant="outline" disabled className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            Results Published
          </Button>
        ) : (
          <Button size="lg" onClick={() => setShowConfirm(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Publish Results
          </Button>
        )}
      </div>

      <Alert>
        <Trophy className="h-4 w-4" />
        <AlertTitle>Finalists Selected</AlertTitle>
        <AlertDescription>
          6 teams have been selected for the final round (top 2 from each of the 3 preliminary
          judging boards). Review the rankings below before publishing results to participants.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { place: '1st Place', team: 'Data Ninjas', prize: 'Gold', color: 'yellow' },
          { place: '2nd Place', team: 'Cloud Architects', prize: 'Silver', color: 'gray' },
          { place: '3rd Place', team: 'Code Wizards', prize: 'Bronze', color: 'orange' },
        ].map((winner, i) => (
          <Card key={i} className="border-2">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-2">
                {i === 0 && <Trophy className="w-12 h-12 text-yellow-500" />}
                {i === 1 && <Medal className="w-12 h-12 text-gray-400" />}
                {i === 2 && <Award className="w-12 h-12 text-orange-600" />}
              </div>
              <CardTitle className="text-lg">{winner.place}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl font-semibold mb-1">{winner.team}</p>
              <Badge
                variant="outline"
                className={
                  i === 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : i === 1
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-orange-100 text-orange-800'
                }
              >
                {winner.prize} Award
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Final Score</TableHead>
                <TableHead>Preliminary Board</TableHead>
                <TableHead>Award</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFinalists.map((finalist) => (
                <TableRow key={finalist.rank}>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {finalist.rank}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{finalist.team}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">{finalist.score}</div>
                      <span className="text-muted-foreground text-sm">/ 100</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Board {finalist.board}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        finalist.prize === 'Gold'
                          ? 'default'
                          : finalist.prize === 'Silver' || finalist.prize === 'Bronze'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        finalist.prize === 'Gold'
                          ? 'bg-yellow-100 text-yellow-800'
                          : finalist.prize === 'Silver'
                          ? 'bg-gray-100 text-gray-800'
                          : finalist.prize === 'Bronze'
                          ? 'bg-orange-100 text-orange-800'
                          : ''
                      }
                    >
                      {finalist.prize}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Publish Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Results</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish the final rankings and notify all participants via email. The results
              will be visible to everyone on the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
              <Trophy className="w-4 h-4 text-yellow-600 shrink-0" />
              <span><strong>1st:</strong> Data Ninjas</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
              <Medal className="w-4 h-4 text-gray-500 shrink-0" />
              <span><strong>2nd:</strong> Cloud Architects</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
              <Award className="w-4 h-4 text-orange-500 shrink-0" />
              <span><strong>3rd:</strong> Code Wizards</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              <Send className="w-4 h-4 mr-2" />
              Publish & Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Published Success */}
      <Dialog open={published} onOpenChange={setPublished}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Results Published
            </DialogTitle>
            <DialogDescription>
              Final rankings are now live. All participants have been notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Participants notified</span>
              <span className="font-medium">87</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Teams ranked</span>
              <span className="font-medium">28</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Finalists</span>
              <span className="font-medium">6</span>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => setPublished(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
