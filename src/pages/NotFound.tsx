import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-8xl font-bold gradient-text">404</h1>
          <h2 className="mb-4 text-2xl font-semibold">{t('notFound.title')}</h2>
          <p className="mb-8 text-muted-foreground">{t('notFound.description')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="accent" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                {t('notFound.home')}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('notFound.back')}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
