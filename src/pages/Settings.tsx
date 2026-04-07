import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { Building2, Bell, Palette, Shield, Users } from 'lucide-react';

export default function Settings() {
  const { isDarkMode, toggleDarkMode, currentOrganization } = useApp();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and product settings
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue={currentOrganization?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-desc">Description</Label>
                <Input id="org-desc" defaultValue={currentOrganization?.description} />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Statuses</CardTitle>
              <CardDescription>
                Define custom status labels (mapped to TODO/IN_PROGRESS/DONE internally)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>TODO Labels</Label>
                  <Input placeholder="Backlog, Planned..." />
                </div>
                <div className="space-y-2">
                  <Label>IN_PROGRESS Labels</Label>
                  <Input placeholder="In Progress, In Review..." />
                </div>
                <div className="space-y-2">
                  <Label>DONE Labels</Label>
                  <Input placeholder="Done, Released, Live..." />
                </div>
              </div>
              <Button variant="outline">Add Custom Status</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { id: 'task-assigned', label: 'Task assigned to me', description: 'Get notified when a task is assigned to you' },
                { id: 'feature-updated', label: 'Feature updates', description: 'Get notified when features you own are updated' },
                { id: 'feedback-received', label: 'New feedback', description: 'Get notified when new feedback is logged' },
                { id: 'release-published', label: 'Release published', description: 'Get notified when a new release is published' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize how REST looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Accent Color</Label>
                <div className="flex gap-3">
                  {['blue', 'purple', 'green', 'orange'].map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background ${
                        color === 'blue' ? 'ring-primary bg-primary' : 'ring-transparent'
                      }`}
                      style={{
                        backgroundColor:
                          color === 'blue'
                            ? 'hsl(217, 91%, 60%)'
                            : color === 'purple'
                            ? 'hsl(258, 90%, 66%)'
                            : color === 'green'
                            ? 'hsl(142, 76%, 36%)'
                            : 'hsl(38, 92%, 50%)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage team members and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team management features coming soon. You'll be able to invite members,
                assign roles, and manage permissions.
              </p>
              <Button variant="outline" className="mt-4">
                <Users className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
