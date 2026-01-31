import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  PlusCircle,
  Loader2,
  Users,
  IndianRupee,
  Calendar,
  Eye,
  Share2,
  Copy,
  MoreVertical,
  TrendingUp,
  Wallet,
  Globe,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categoryColors = {
  celebration: "bg-amber-100 text-amber-800",
  medical: "bg-red-100 text-red-800",
  festival: "bg-pink-100 text-pink-800",
  society: "bg-blue-100 text-blue-800",
  social: "bg-emerald-100 text-emerald-800",
  office: "bg-indigo-100 text-indigo-800",
  reunion: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

export default function MyCollectionsPage() {
  const { user, getAuthHeader } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalRaised: 0,
    totalDonors: 0
  });

  useEffect(() => {
    fetchMyCollections();
  }, []);

  const fetchMyCollections = async () => {
    try {
      const response = await axios.get(`${API}/my-collections`, {
        headers: getAuthHeader()
      });
      setCollections(response.data);
      
      // Calculate stats
      const totalRaised = response.data.reduce((sum, c) => sum + c.current_amount, 0);
      const totalDonors = response.data.reduce((sum, c) => sum + c.donor_count, 0);
      setStats({
        totalCollections: response.data.length,
        totalRaised,
        totalDonors
      });
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load your collections");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (collectionId) => {
    const link = `${window.location.origin}/collection/${collectionId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const formatAmount = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5F00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 pb-24 md:pb-12">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
              data-testid="my-collections-title"
            >
              My Collections
            </h1>
            <p className="text-zinc-600">
              Manage and track all your fundraising campaigns
            </p>
          </div>
          <Link to="/create">
            <Button 
              className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-6 font-semibold"
              data-testid="create-new-btn"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Collection
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#002FA7] to-[#0047d6] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-blue-100 text-sm">Total Raised</span>
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {formatAmount(stats.totalRaised)}
            </p>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5F00]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FF5F00]" />
              </div>
              <span className="text-zinc-500 text-sm">Active Collections</span>
            </div>
            <p className="text-3xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {stats.totalCollections}
            </p>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-zinc-500 text-sm">Total Donors</span>
            </div>
            <p className="text-3xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {stats.totalDonors}
            </p>
          </div>
        </div>

        {/* Collections List */}
        {collections.length > 0 ? (
          <div className="space-y-4">
            {collections.map((collection, index) => {
              const progress = Math.min((collection.current_amount / collection.goal_amount) * 100, 100);
              const badgeClass = categoryColors[collection.category?.toLowerCase()] || categoryColors.other;
              
              return (
                <div 
                  key={collection.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  data-testid={`collection-item-${collection.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Image */}
                    <div className="w-full lg:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={collection.cover_image}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${badgeClass} rounded-full px-3 py-1 text-xs font-semibold`}>
                              {collection.category}
                            </Badge>
                            {collection.visibility === 'private' ? (
                              <Badge className="bg-zinc-100 text-zinc-600 rounded-full px-2 py-1 text-xs">
                                <Lock className="w-3 h-3 mr-1" /> Private
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-100 text-zinc-600 rounded-full px-2 py-1 text-xs">
                                <Globe className="w-3 h-3 mr-1" /> Public
                              </Badge>
                            )}
                          </div>
                          <Link to={`/collection/${collection.id}`}>
                            <h3 
                              className="text-lg font-bold text-[#0a0a0a] hover:text-[#002FA7] transition-colors truncate"
                              style={{ fontFamily: 'Bricolage Grotesque' }}
                            >
                              {collection.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-zinc-500 mt-1">
                            Created {formatDate(collection.created_at)}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <MoreVertical className="w-5 h-5 text-zinc-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/collection/${collection.id}`} className="cursor-pointer">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => copyShareLink(collection.id)}
                              className="cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-[#0a0a0a]">
                              {formatAmount(collection.current_amount)}
                            </span>
                            <span className="text-zinc-500">
                              of {formatAmount(collection.goal_amount)}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2 bg-zinc-100" />
                          <p className="text-xs text-zinc-500 mt-1">{progress.toFixed(0)}% raised</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{collection.donor_count} donors</span>
                        </div>
                        
                        {collection.deadline && (
                          <div className="flex items-center gap-2 text-zinc-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDate(collection.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#f5f5f7] rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 
              className="text-xl font-bold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              No Collections Yet
            </h3>
            <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
              Start your first fundraising campaign and collect funds from your community.
            </p>
            <Link to="/create">
              <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Collection
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
