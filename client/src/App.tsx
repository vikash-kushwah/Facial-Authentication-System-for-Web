import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Authentication from "@/pages/Authentication";
import SimilarityTest from "@/pages/SimilarityTest";
import MatchingTest from "@/pages/MatchingTest";
import Dashboard from "@/pages/Dashboard";

export type User = {
  id: number;
  username: string;
  email: string;
  token: string;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing user data in localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  // Save user data to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
    } else {
      localStorage.removeItem('userData');
    }
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Switch>
        <Route path="/" component={() => <Authentication user={user} onLogin={handleLogin} />} />
        <Route path="/similarity-test" component={SimilarityTest} />
        <Route path="/matching-test" component={MatchingTest} />
        <Route path="/dashboard" component={() => <Dashboard user={user} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
