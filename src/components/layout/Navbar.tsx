import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, Moon, Sun, LogOut, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { Language } from '@/lib/i18n';
import logo from '@/assets/bilimhub-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'kg', label: 'Кыргызча' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { canAccessAI, canAccessLessons, canAccessDashboard, canAccessTests, canAccessProfile, canAccessPractice } = useUserGroup();
  const location = useLocation();
  const navigate = useNavigate();
  const showBack = !['/', '/dashboard', '/login', '/index'].includes(location.pathname);

  const navLinks = [
    { href: '/', label: t('nav.home'), show: true },
    ...(user
      ? [
          { href: '/dashboard', label: t('nav.dashboard'), show: canAccessDashboard },
          { href: '/profile', label: t('nav.profile'), show: canAccessProfile },
        ]
      : []),
  ].filter((link) => link.show);

  const moreLinks = user
    ? [
        { href: '/lessons', label: t('nav.lessons'), show: canAccessLessons },
        { href: '/tests', label: t('nav.tests'), show: canAccessTests },
        { href: '/practice', label: t('nav.practice'), show: canAccessPractice },
        { href: '/ai-tutor', label: t('nav.aiTutor'), show: canAccessAI },
        { href: '/learning-plan', label: t('nav.myPlan'), show: canAccessAI },
      ].filter((link) => link.show)
    : [];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                aria-label={t('v2.back')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={logo} alt="BilimHub" className="h-11 w-auto md:h-12 transition-transform group-hover:scale-105" />
              <span className="hidden sm:inline text-lg font-bold tracking-tight gradient-text">BilimHub</span>
            </Link>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {moreLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    {t('v2.more')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-accent/10' : ''}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => {
              setIsDark(!isDark);
              document.documentElement.classList.toggle('dark');
            }}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('common.logout')}
                </Button>
              ) : (
                <Button variant="accent" asChild>
                  <Link to="/login">{t('v2.loginCta')}</Link>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-border py-3 md:hidden animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-base font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                    isActive(link.href)
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 px-4">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('common.logout')}
                  </Button>
                ) : (
                  <Button variant="accent" asChild className="w-full">
                    <Link to="/login">{t('v2.loginCta')}</Link>
                  </Button>
                )}
              </div>
              <div className="mt-4 flex gap-2 px-4">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? 'accent' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage(lang.code)}
                  >
                    {lang.code.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
