import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import BrowseCollections from "@/pages/BrowseCollections";
import CollectionDetails from "@/pages/CollectionDetails";
import CreateCollection from "@/pages/CreateCollection";
import PaymentCallback from "@/pages/PaymentCallback";
import AboutPage from "@/pages/AboutPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { Loader2 } from "lucide-react";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5F00] animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: "/create" } }} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowseCollections />} />
        <Route path="/collection/:id" element={<CollectionDetails />} />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateCollection />
            </ProtectedRoute>
          } 
        />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
