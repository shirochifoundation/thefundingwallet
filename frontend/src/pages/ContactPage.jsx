import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            Contact Us
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Have questions or need help? We're here for you. Reach out and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 
              className="text-2xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Get in Touch
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#002FA7]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-[#002FA7]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a0a0a]">Email</h3>
                  <p className="text-zinc-600">support@fundflow.app</p>
                  <p className="text-zinc-500 text-sm mt-1">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF5F00]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#FF5F00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a0a0a]">Phone</h3>
                  <p className="text-zinc-600">+91 98765 43210</p>
                  <p className="text-zinc-500 text-sm mt-1">Mon-Fri, 9am to 6pm IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a0a0a]">Office</h3>
                  <p className="text-zinc-600">Mumbai, Maharashtra, India</p>
                  <p className="text-zinc-500 text-sm mt-1">PIN: 400001</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
            <h2 
              className="text-2xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Send a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-2">Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-2">Subject</label>
                <Input
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-2">Message</label>
                <Textarea
                  placeholder="Tell us how we can help..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white resize-none"
                  rows={5}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-xl py-6 text-lg font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
