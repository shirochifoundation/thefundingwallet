import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CollectionCard from "@/components/CollectionCard";
import { 
  ArrowRight, 
  TrendingUp
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/collections?limit=6`);
      setCollections(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24 lg:py-32">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-[#FF5F00]/10 text-[#FF5F00] rounded-full px-4 py-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                Trusted by 10,000+ groups
              </div>
              
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0a0a0a] tracking-tight leading-tight"
                style={{ fontFamily: 'Bricolage Grotesque' }}
                data-testid="hero-title"
              >
                Collect Funds
                <span className="block text-[#002FA7]">Together, Easily</span>
              </h1>
              
              <p className="text-lg text-zinc-600 max-w-lg">
                The simplest way to collect money from friends, family, and community for any occasion. 
                From kitty parties to medical emergencies.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/create" data-testid="hero-cta-create">
                  <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto">
                    Start Your Collection
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/browse" data-testid="hero-cta-browse">
                  <Button variant="outline" className="border-2 border-[#002FA7] text-[#002FA7] hover:bg-[#002FA7] hover:text-white rounded-full px-8 py-6 text-lg font-medium transition-all w-full sm:w-auto">
                    Browse Collections
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="hidden lg:block animate-fade-in stagger-2">
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80"
                alt="Friends celebrating together"
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 
                className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Active Collections
              </h2>
              <p className="text-zinc-600">Support causes that matter</p>
            </div>
            <Link to="/browse" className="hidden md:block">
              <Button variant="outline" className="rounded-full border-zinc-300" data-testid="view-all-collections">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection, index) => (
                <div 
                  key={collection.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CollectionCard collection={collection} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#f5f5f7] rounded-2xl">
              <p className="text-zinc-500 mb-4">No collections yet. Be the first to start one!</p>
              <Link to="/create">
                <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full">
                  Create Collection
                </Button>
              </Link>
            </div>
          )}

          <div className="md:hidden mt-6 text-center">
            <Link to="/browse">
              <Button variant="outline" className="rounded-full border-zinc-300 w-full">
                View All Collections
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#0a0a0a]">
        <div className="container-main text-center">
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            Ready to Start Collecting?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            Create your collection in minutes and share it with your network. 
            Start receiving contributions today.
          </p>
          <Link to="/create" data-testid="footer-cta-create">
            <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-10 py-6 text-lg font-bold shadow-lg animate-pulse-glow">
              Start Free Collection
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
