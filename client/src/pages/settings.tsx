import { Layout } from "@/components/Layout";
import { ChevronLeft, LogOut, Trash2, HelpCircle, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const [, navigate] = useLocation();

  const settingsSections = [
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "FAQ and contact",
          action: () => {},
        },
        {
          icon: MessageCircle,
          label: "Send Feedback",
          description: "Follow us on Instagram",
          action: () => {
            window.open('https://www.instagram.com/xhaustvisuals/', '_blank');
          },
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          icon: Trash2,
          label: "Clear Cache",
          description: "Free up storage",
          action: () => {},
        },
        {
          icon: LogOut,
          label: "Sign Out",
          description: "End your session",
          action: () => {},
          danger: true,
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="px-5 pt-8 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/profile')} className="text-white/70 hover:text-white transition-colors" data-testid="button-back-profile">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{section.title}</h2>
              <div className="space-y-2 bg-white/5 rounded-lg overflow-hidden">
                {section.items.map((item, idx) => {
                  const isDanger = 'danger' in item && item.danger;
                  return (
                    <button
                      key={`${section.title}-${idx}`}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between p-4 border-b border-white/5 last:border-b-0 hover:bg-white/10 transition-colors ${
                        isDanger ? 'text-red-400' : 'text-white'
                      }`}
                      data-testid={`settings-item-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isDanger ? 'bg-red-500/20' : 'bg-white/10'
                        }`}>
                          <item.icon size={20} className={isDanger ? 'text-red-400' : 'text-gray-400'} />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-400">{item.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* App Version */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">Music Player v1.0.0</p>
          <p className="text-xs text-gray-600 mt-1">© 2024 All Rights Reserved</p>
        </div>
      </div>
    </Layout>
  );
}
