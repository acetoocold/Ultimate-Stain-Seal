import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  User,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import ussLogo from "@/assets/uss-logo.png";
import fenceBg from "@/assets/login-fence-bg.png";

const features = [
  {
    icon: ShieldCheck,
    title: "WORK SMARTER",
    body: "Access schedules, job details, and resources on the go.",
  },
  {
    icon: CheckCircle2,
    title: "STAY CONNECTED",
    body: "Real-time updates and team communication.",
  },
  {
    icon: BarChart3,
    title: "DRIVE RESULTS",
    body: "Track performance, complete jobs, and grow your business.",
  },
];

export default function OpsLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ data: { email, password } });
      setLocation("/ops/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left panel — fence photo with logo + tagline + features */}
        <div
          className="relative lg:w-1/2 min-h-[320px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(20,12,8,0.78) 0%, rgba(20,12,8,0.85) 100%), url(${fenceBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto lg:mx-0 w-full">
            <div className="bg-white/95 rounded-xl p-6 inline-block w-fit mb-8 shadow-lg">
              <img
                src={ussLogo}
                alt="USS — Ultimate Stain & Seal"
                className="h-20 w-auto object-contain"
              />
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-3">
              Built for the Field.
              <br />
              Backed by the Best.
            </h2>
            <p className="text-white/80 mb-8 max-w-sm">
              Tools, training, and support to help you deliver results that
              last.
            </p>

            <ul className="space-y-5">
              {features.map((f) => (
                <li key={f.title} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center shrink-0">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide">
                      {f.title}
                    </h3>
                    <p className="text-sm text-white/75 mt-0.5 max-w-xs">
                      {f.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="lg:w-1/2 flex flex-col bg-card relative">
          <div className="flex justify-end p-6">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              data-testid="link-need-help"
            >
              Need help? <HelpCircle className="h-4 w-4" />
            </a>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 pb-12">
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  USS Ops Login
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to your Ultimate Stain &amp; Seal employee account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-11"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <a
                      href="#"
                      className="text-xs text-primary hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold"
                  disabled={login.isPending}
                  data-testid="button-sign-in"
                >
                  <LogIn className="h-4 w-4" />
                  {login.isPending ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs uppercase text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-sm font-medium"
                  onClick={() => setLocation("/customer/login")}
                  data-testid="button-customer-login"
                >
                  <User className="h-4 w-4" />
                  Go to Customer Login
                </Button>

                <div
                  className="mt-6 rounded-lg border border-border bg-muted/40 p-4 flex items-start gap-3"
                  data-testid="card-team-message"
                >
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-primary">
                      You&apos;re Part of the Team.
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                      Your work makes a difference. Use this portal to stay
                      informed, get the tools you need, and keep delivering
                      exceptional results.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground text-xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2010–{new Date().getFullYear()} Ultimate Stain &amp; Seal. All
            rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <span className="opacity-50">|</span>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
