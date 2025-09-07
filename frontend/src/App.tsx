import "./App.css";
import "./index.css";
import MainWrapper from "@/Providers/MainWraper";
import Header from "@/components/Header";
import PostWithComments from "@/components/Post/PostWithComments";
import type { Post } from "@/types";

// Mock data for demonstration
const mockPost: Post = {
  id: "1",
  content: `Suddenly, careful research of competitors, which are an example of a bright example of the continental-European type of political culture, will be declared violating human ethics and morality. On the other hand, the high-tech concept of the social order creates the prerequisites for new principles of forming the material and technical and personnel base.`,
  author: {
    id: "1",
    username: "Anonym",
  },
  createdAt: "2022-05-22T22:30:00Z",
  votes: 0,
  comments: [
    {
      id: "comment-1",
      content: "Excellent article! Fully agree with the author.",
      author: {
        userId: "2",
        email: "rum8@example.com",
        homepage: "https://example.com",
        username: "Rum_8",
      },
      createdAt: "2022-05-22T22:43:00Z",
      votes: 0,
      postId: "1",
      replies: [
        {
          id: "reply-1",
          content: `Thank you for the comment! Indeed, the current trends in the development of society require a review of the established approaches. Important to note that the proposed solutions can become the basis for further development of the industry.`,
          author: {
            userId: "1",
            username: "Anonym",
            email: "anonym@example.com",
            homepage: "https://example.com",
          },
          createdAt: "2022-05-22T23:21:00Z",
          votes: 0,
          parentId: "comment-1",
          quotedContent: "Excellent article! Fully agree with the author.",
          postId: "1",
        },
      ],
    },
  ],
};

function App() {
  return (
    <MainWrapper>
      <Header />
      <PostWithComments post={mockPost} />
    </MainWrapper>
  );
}

export default App;
