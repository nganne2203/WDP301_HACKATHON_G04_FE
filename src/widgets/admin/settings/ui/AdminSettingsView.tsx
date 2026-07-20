import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

export function Settings() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure platform-wide preferences for SEAL.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>General information about your institution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" defaultValue="University Hackathon Office" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-contact">Contact email</Label>
            <Input id="org-contact" type="email" defaultValue="hackathon@university.edu" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competition defaults</CardTitle>
          <CardDescription>Defaults applied to new hackathon competitions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-teams">Maximum teams per competition</Label>
            <Input id="max-teams" type="number" defaultValue={30} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable AI repository insights</Label>
              <p className="text-xs text-muted-foreground">
                Surface AI summaries on the judging interface.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require GitHub repository on submission</Label>
              <p className="text-xs text-muted-foreground">
                Teams must link a repo before final scoring.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
