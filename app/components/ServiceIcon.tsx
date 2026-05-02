import {
  Home, Building2, Search, BarChart3, Handshake, Zap, Target,
  TrendingUp, Key, MapPin, FileSignature, Calculator, Award,
  Shield, Users, Clock, type LucideIcon,
} from "lucide-react";

/**
 * أيقونات احترافية للخدمات + بطاقات "لماذا تختارنا" في الصفحة العامة.
 * تدعم legacy emoji (نعرض fallback تلقائي) + keys جديدة (lucide).
 */

const ICON_MAP: Record<string, LucideIcon> = {
  // keys جديدة (مفضّلة)
  home:        Home,
  building:    Building2,
  search:      Search,
  chart:       BarChart3,
  handshake:   Handshake,
  zap:         Zap,
  target:      Target,
  trend:       TrendingUp,
  key:         Key,
  pin:         MapPin,
  contract:    FileSignature,
  calc:        Calculator,
  award:       Award,
  shield:      Shield,
  users:       Users,
  clock:       Clock,

  // legacy emoji → نفس الأيقونة (لتوافق الخلفية القديم)
  "🏠": Home, "🏢": Building2, "🔍": Search, "📊": BarChart3,
  "🤝": Handshake, "⚡": Zap, "🎯": Target, "📈": TrendingUp,
  "🔑": Key, "📍": MapPin, "📝": FileSignature, "🧮": Calculator,
  "🏆": Award, "🛡": Shield, "👥": Users, "⏰": Clock,
};

export const SERVICE_ICON_KEYS = [
  "home", "building", "search", "chart", "handshake", "zap",
  "target", "trend", "key", "pin", "contract", "calc",
  "award", "shield", "users", "clock",
];

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export default function ServiceIcon({ name, size = 26, color = "currentColor" }: Props) {
  const Icon = ICON_MAP[name] || Home;
  return <Icon size={size} color={color} strokeWidth={1.6} />;
}
