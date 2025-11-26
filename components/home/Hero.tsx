"use client";
import { Link as I18nLink } from "@/i18n/routing";
import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { StarsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

export default function Hero() {
  const t = useTranslations("Landing.Hero");

  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  return (
    <motion.section
      style={{
        backgroundImage,
      }}
      className="relative grid place-content-center overflow-hidden bg-gray-950 px-4 py-16 md:py-28 2xl:py-40 text-gray-200"
    >
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-1.5 flex items-center gap-2 rounded-full bg-gray-600/50 px-3 py-1.5 text-sm">
          <StarsIcon className="w-4 h-4" /> {t("badge")}
        </span>
        <h1 className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-3xl font-medium leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
          {t("title")}
        </h1>
        <p className="mt-6 mb-12 max-w-3xl text-center text-base leading-relaxed md:text-lg md:leading-relaxed">
          {t("description")}
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <motion.button
            style={{
              border,
              boxShadow,
            }}
            whileHover={{
              scale: 1.015,
            }}
            whileTap={{
              scale: 0.985,
            }}
            className="group relative w-fit rounded-full bg-gray-950/10 px-4 py-2 text-gray-50 transition-colors hover:bg-gray-950/50"
          >
            <I18nLink href="/text-to-video" className="flex items-center gap-1.5">
              {t("getStarted")}
              <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
            </I18nLink>
          </motion.button>
          {/* <motion.button
            style={{
              border,
              boxShadow,
            }}
            whileHover={{
              scale: 1.015,
            }}
            whileTap={{
              scale: 0.985,
            }}
            className="group relative w-fit rounded-full bg-gray-950/10 px-4 py-2 text-gray-50 transition-colors hover:bg-gray-950/50"
          >
            <I18nLink
              href={process.env.NEXT_PUBLIC_DEFAULT_FEATURE_PAGE || "/"}
              className="flex items-center gap-1.5"
            >
              {t("getFreeTrial")}
              <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
            </I18nLink>
          </motion.button> */}
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={50} count={2500} factor={4} fade speed={2} />
        </Canvas>
      </div>
    </motion.section>
  );
}
