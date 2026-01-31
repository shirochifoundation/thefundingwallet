import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import BrowseCollections from "@/pages/BrowseCollections";
import CollectionDetails from "@/pages/CollectionDetails";
import CreateCollection from "@/pages/CreateCollection";
import PaymentCallback from "@/pages/PaymentCallback";
import AboutPage from "@/pages/AboutPage";

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowseCollections />} />
            <Route path="/collection/:id" element={<CollectionDetails />} />
            <Route path="/create" element={<CreateCollection />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
