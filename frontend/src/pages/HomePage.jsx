import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CollectionCard from "@/components/CollectionCard";
import { 
  ArrowRight, 
  Users, 
  Shield, 
  Zap, 
  Heart,
  PartyPopper,
  Sparkles,
  Home,
  HandHeart,
  Briefcase,
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

  const useCases = [
    { icon: PartyPopper, title: "Celebrations", desc: "Birthday, farewell, team parties" },
    { icon: Heart, title: "Medical Emergency", desc: "Help friends & family in need" },
    { icon: Sparkles, title: "Festivals", desc: "Ganesh Utsav, Navratri & more" },
    { icon: Home, title: "Society Funds", desc: "Maintenance & community projects" },
    { icon: HandHeart, title: "Social Causes", desc: "Tree plantation, charity drives" },
    { icon: Briefcase, title: "Office Events", desc: "Team lunch, outings & celebrations" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Quick Setup",
      desc: "Create a collection in under 2 minutes. Share the link and start receiving funds."
    },
    {
      icon: Shield,
      title: "Secure Payments",
      desc: "Bank-grade security with Cashfree. Your money is safe and traceable."
    },
    {
      icon: Users,
      title: "Easy Sharing",
      desc: "Public or private collections. Share via WhatsApp, Email, or any platform."
    },
  ];

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

      {/* Use Cases Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-4"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Perfect for Every Occasion
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Whether it's a joyful celebration or urgent need, FundFlow makes collecting funds simple.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {useCases.map((item, index) => (
              <div 
                key={item.title}
                className="bg-[#f5f5f7] rounded-2xl p-5 text-center hover:bg-[#FF5F00]/5 transition-colors cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`usecase-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FF5F00] group-hover:text-white transition-colors">
                  <item.icon className="w-6 h-6 text-[#002FA7] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#0a0a0a] text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-[#f5f5f7]">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-4"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Why Choose FundFlow?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#002FA7] flex items-center justify-center mb-5">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 
                  className="text-xl font-bold text-[#0a0a0a] mb-3"
                  style={{ fontFamily: 'Bricolage Grotesque' }}
                >
                  {feature.title}
                </h3>
                <p className="text-zinc-600">{feature.desc}</p>
              </div>
            ))}
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
