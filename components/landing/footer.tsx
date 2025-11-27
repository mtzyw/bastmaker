import { Mail, Video } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function Footer() {
  const t = useTranslations("Landing.Footer")

  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg text-foreground">BestMaker AI</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">{t("description")}</p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="w-4 h-4" />
              contact@bestmaker.ai
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("products")}</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("productLinks.videoGen")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("productLinks.imageToVideo")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("productLinks.templates")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("productLinks.pricing")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("resources")}</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("resourceLinks.help")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("resourceLinks.blog")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("resourceLinks.tutorial")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("resourceLinks.api")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t("about")}</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("aboutLinks.company")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("aboutLinks.contact")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("aboutLinks.privacy")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  {t("aboutLinks.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">{t("copyright")}</p>
          <div className="flex gap-6 text-muted-foreground text-sm">
            <Link href="#" className="hover:text-amber-400 transition-colors">
              {t("bottomLinks.privacy")}
            </Link>
            <Link href="#" className="hover:text-amber-400 transition-colors">
              {t("bottomLinks.terms")}
            </Link>
            <Link href="#" className="hover:text-amber-400 transition-colors">
              {t("bottomLinks.cookie")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
