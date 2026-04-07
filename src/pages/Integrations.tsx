import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Plus, ExternalLink, Check } from 'lucide-react';

const integrations = [
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Connect your analytics platform to track product metrics',
    status: 'available',
    icon: '📊',
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Sync customer data from your CRM system',
    status: 'coming_soon',
    icon: '👥',
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Connect revenue data from your billing platform',
    status: 'coming_soon',
    icon: '💳',
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Import feedback from your support ticketing system',
    status: 'coming_soon',
    icon: '🎧',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link features and tasks to GitHub issues',
    status: 'available',
    icon: '🐙',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates in Slack',
    status: 'available',
    icon: '💬',
  },
];

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external tools to enhance your workflow
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                  {integration.icon}
                </div>
                {integration.status === 'coming_soon' ? (
                  <Badge variant="secondary">Coming Soon</Badge>
                ) : (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Available
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={integration.status === 'coming_soon' ? 'secondary' : 'outline'}
                className="w-full gap-2"
                disabled={integration.status === 'coming_soon'}
              >
                {integration.status === 'coming_soon' ? (
                  'Notify Me'
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Section */}
      <Card>
        <CardHeader>
          <CardTitle>REST API</CardTitle>
          <CardDescription>
            Build custom integrations with our API
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Full API access coming soon for custom integrations and automation
          </p>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Docs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
