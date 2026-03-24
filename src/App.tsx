import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Life Tracker</h1>
        <p className="text-muted-foreground">
          Your personal dashboard for getting on top of things.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Scaffold complete. The debt dashboard is coming next.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
