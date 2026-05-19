import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MetricCard } from '../../components/shared/MetricCard';
import { EventStepper } from '../../components/shared/EventStepper';
import {
  Users,
  UsersRound,
  ClipboardCheck,
  Github,
  Scale,
  Trophy,
  FileCheck,
} from 'lucide-react';
import { mockMetrics, lifecycleSteps } from '../../../lib/data';
import { Progress } from '../../components/ui/progress';

export function CoordinatorDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Coordinator Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage all aspects of the hackathon
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Participants"
          value={mockMetrics.participants}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Teams Formed"
          value={mockMetrics.teams}
          subtitle={`/ ${mockMetrics.maxTeams}`}
          icon={UsersRound}
        />
        <MetricCard
          title="Check-in Rate"
          value={`${Math.round((mockMetrics.checkedIn / mockMetrics.participants) * 100)}%`}
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Judging Progress"
          value={`${mockMetrics.judgingProgress}%`}
          icon={Scale}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <EventStepper steps={lifecycleSteps} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span>Repository Access Granted</span>
                </div>
                <span className="font-medium">{mockMetrics.repoAccess} / {mockMetrics.teams}</span>
              </div>
              <Progress value={(mockMetrics.repoAccess / mockMetrics.teams) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span>Teams Evaluated</span>
                </div>
                <span className="font-medium">18 / {mockMetrics.teams}</span>
              </div>
              <Progress value={65} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <span>Submissions Received</span>
                </div>
                <span className="font-medium">25 / {mockMetrics.teams}</span>
              </div>
              <Progress value={89} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span>Finalists Selected</span>
                </div>
                <span className="font-medium">{mockMetrics.finalists} / 6</span>
              </div>
              <Progress value={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '10 mins ago', text: 'Team "Data Ninjas" submitted final project' },
                { time: '25 mins ago', text: 'Judge Dr. Martinez completed Board B evaluations' },
                { time: '1 hour ago', text: '3 new participants checked in' },
                { time: '2 hours ago', text: 'Repository access granted to Team "Cloud Architects"' },
                { time: '3 hours ago', text: 'New team "Security Squad" registered' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
