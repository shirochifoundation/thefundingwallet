import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CollectionCard from "@/components/CollectionCard";
import { Search, Filter, Loader2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categories = [
  { id: "all", name: "All Categories" },
  { id: "celebration", name: "Celebration" },
  { id: "medical", name: "Medical Emergency" },
  { id: "festival", name: "Festival" },
  { id: "society", name: "Society/Community" },
  { id: "social", name: "Social Cause" },
  { id: "office", name: "Office/Team" },
  { id: "reunion", name: "Reunion" },
  { id: "other", name: "Other" },
];

export default function BrowseCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCollections();
  }, [category]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      let url = `${API}/collections?limit=50`;
      if (category && category !== "all") {
        url += `&category=${category}`;
      }
      const response = await axios.get(url);
      setCollections(response.data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-8 md:py-12 pb-24 md:pb-12">
      <div className="container-main">
        {/* Header */}
        <div className="mb-10">
          <h1 
            className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-3"
            style={{ fontFamily: 'Bricolage Grotesque' }}
            data-testid="browse-title"
          >
            Browse Collections
          </h1>
          <p className="text-zinc-600">
            Discover and support causes that matter to you
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
              data-testid="search-input"
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger 
              className="w-full sm:w-[220px] h-12 rounded-xl bg-[#f5f5f7] border-transparent"
              data-testid="category-filter"
            >
              <Filter className="w-4 h-4 mr-2 text-zinc-500" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF5F00] animate-spin" />
          </div>
        ) : filteredCollections.length > 0 ? (
          <>
            <p className="text-sm text-zinc-500 mb-6">
              Showing {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection, index) => (
                <div 
                  key={collection.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CollectionCard collection={collection} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-[#f5f5f7] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 
              className="text-xl font-semibold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              No collections found
            </h3>
            <p className="text-zinc-500 mb-6">
              {searchTerm 
                ? "Try adjusting your search or filter criteria"
                : "Be the first to start a collection in this category!"
              }
            </p>
            {!searchTerm && (
              <Button 
                className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full"
                onClick={() => window.location.href = '/create'}
              >
                Create Collection
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
