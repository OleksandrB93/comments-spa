import { ThemeProvider } from "./ThemeProvider";

const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <ThemeProvider>{children}</ThemeProvider>
    </div>
  );
};

export default MainWrapper;
