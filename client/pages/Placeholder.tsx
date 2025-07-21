import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface PlaceholderProps {
  title: string;
  description: string;
  suggestedActions?: string[];
}

export default function Placeholder({ 
  title, 
  description, 
  suggestedActions = [
    "Configurez les outils OSINT dans les paramètres",
    "Créez votre première enquête",
    "Explorez les fonctionnalités disponibles"
  ]
}: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-background osint-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au Tableau de Bord
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Construction className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-lg">{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-medium text-center">Actions suggérées :</h4>
              <ul className="space-y-2">
                {suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    {action}
                  </li>
                ))}
              </ul>
              <div className="pt-4 text-center">
                <Link to="/">
                  <Button>
                    Retour au Tableau de Bord
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
