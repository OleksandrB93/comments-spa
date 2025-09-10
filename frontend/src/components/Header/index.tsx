import { useEffect, useState } from "react";
import { ModeToggle } from "../ui/ModeToggle";
import Logo from "./Logo";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const OFFSET = 120;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > OFFSET);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const body = document.body;

    const handleOpen = () => {
      body.style.paddingRight = `${scrollbarWidth}px`;
    };

    const handleClose = () => {
      body.style.paddingRight = "";
    };

    document.addEventListener("dialog-open", handleOpen);
    document.addEventListener("dialog-close", handleClose);

    return () => {
      document.removeEventListener("dialog-open", handleOpen);
      document.removeEventListener("dialog-close", handleClose);
    };
  }, []);

  return (
    <header
      className={`fixed z-50 flex justify-between items-center p-4 border-b border-border transition-all duration-200 ${
        isScrolled
          ? "top-4 left-[1rem] bg-[red]/70 backdrop-blur-[4px] rounded-lg w-[calc(100%-2rem)] shadow-[0_2px_6px_3px_rgba(0,0,0,0.1)] shadow-primary/40"
          : "top-0 left-0 w-full rounded-none bg-background"
      }`}
    >
      <Logo />
      <ModeToggle />
    </header>
  );
};

export default Header;
