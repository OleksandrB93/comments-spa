import { ModeToggle } from "../ui/ModeToggle";
import Logo from "./Logo";

const Header = () => {
  return (
    <header className="bg-background flex justify-between items-center p-4 border-b border-border">
      <Logo />
      <ModeToggle />
    </header>
  );
};

export default Header;
