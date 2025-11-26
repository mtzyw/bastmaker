import { ReactNode } from "react";

type MyCreationsLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

export default function MyCreationsLayout({ children, modal }: MyCreationsLayoutProps) {
  return (
    <>
      {children}
      {modal ?? null}
    </>
  );
}
