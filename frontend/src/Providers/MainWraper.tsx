import { ApolloProvider } from "@apollo/client/react";
import { ThemeProvider } from "./ThemeProvider";
import { apolloClient } from "@/lib/apollo-client";

const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </ApolloProvider>
  );
};

export default MainWrapper;
