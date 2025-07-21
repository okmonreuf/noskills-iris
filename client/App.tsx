import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import OsintTools from "./pages/OsintTools";
import Placeholder from "./pages/Placeholder";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <OsintTools />
              </ProtectedRoute>
            } />
            <Route path="/investigations" element={
              <ProtectedRoute>
                <Placeholder 
                  title="Gestionnaire d'Enquêtes" 
                  description="Gérez vos enquêtes en cours et accédez à l'historique complet"
                  suggestedActions={[
                    "Consultez le tableau de bord pour voir les enquêtes actives",
                    "Créez une nouvelle enquête depuis l'onglet correspondant",
                    "Configurez vos outils OSINT préférés"
                  ]}
                />
              </ProtectedRoute>
            } />
            <Route path="/evidence" element={
              <ProtectedRoute>
                <Placeholder 
                  title="Gestionnaire de Preuves" 
                  description="Organisez et gérez toutes les preuves collectées lors de vos enquêtes"
                  suggestedActions={[
                    "Démarrez une enquête pour commencer à collecter des preuves",
                    "Configurez le chiffrement automatique des données",
                    "Explorez les outils de capture et d'archivage"
                  ]}
                />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Placeholder 
                  title="Générateur de Rapports" 
                  description="Créez des rapports professionnels à partir de vos enquêtes"
                  suggestedActions={[
                    "Terminez une enquête pour générer votre premier rapport",
                    "Configurez les modèles de rapports",
                    "Paramétrez la signature numérique"
                  ]}
                />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireOwner>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
