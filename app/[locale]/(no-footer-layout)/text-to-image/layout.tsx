import { ReactNode } from "react";

type TextToImageLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

export default function TextToImageLayout({ children, modal }: TextToImageLayoutProps) {
  return (
    <>
      {children}
      {modal ?? null}
    </>
  );
}
