import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Users, 
  Shield, 
  Zap, 
  PartyPopper,
  Heart,
  Sparkles,
  Home,
  HandHeart,
  Briefcase,
  TrendingUp
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AboutPage() {
  const [stats, setStats] = useState({ total_collections: 0, total_donations: 0, total_raised: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
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
      <section className="bg-[#002FA7] py-16 md:py-24">
        <div className="container-main text-center">
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6"
            style={{ fontFamily: 'Bricolage Grotesque' }}
            data-testid="about-title"
          >
            About FundFlow
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Empowering communities to collect funds together for celebrations, emergencies, and everything in between.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="stats-card text-center">
              <p className="text-blue-200 text-sm mb-2">Total Funds Raised</p>
              <p className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                {formatCurrency(stats.total_raised)}
              </p>
            </div>
            <div className="bg-[#f5f5f7] border border-zinc-200 rounded-2xl p-8 text-center">
              <p className="text-zinc-500 text-sm mb-2">Active Collections</p>
              <p className="text-4xl md:text-5xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
                {stats.total_collections}
              </p>
            </div>
            <div className="bg-[#f5f5f7] border border-zinc-200 rounded-2xl p-8 text-center">
              <p className="text-zinc-500 text-sm mb-2">Total Donations</p>
              <p className="text-4xl md:text-5xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
                {stats.total_donations}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-20 bg-[#f5f5f7]">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Our Mission
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              FundFlow was created with a simple mission: to make collecting funds from groups as easy as sending a message. 
              Whether you're organizing a birthday party, helping someone in a medical emergency, or collecting society maintenance fees, 
              we believe the process should be seamless, transparent, and secure.
            </p>
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
          <Link to="/create" data-testid="about-cta-create">
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
