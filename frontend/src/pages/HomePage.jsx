import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CollectionCard from "@/components/CollectionCard";
import { ArrowRight } from "lucide-react";
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
