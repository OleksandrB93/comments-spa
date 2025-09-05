import "./App.css";
import "./index.css";
import MainWrapper from "@/Providers/MainWraper";
import Header from "@/components/Header";
import PostWithComments from "@/components/Post/PostWithComments";
import type { Post } from "@/types";

// Мокові дані для демонстрації
const mockPost: Post = {
  id: "1",
  content: `Внезапно, тщательные исследования конкурентов, которые представляют собой яркий пример континентально-европейского типа политической культуры, будут объявлены нарушающими общечеловеческие нормы этики и морали. 

С другой стороны, высокотехнологичная концепция общественного уклада создаёт предпосылки для новых принципов формирования материально-технической и кадровой базы.`,
  author: {
    id: "1",
    username: "Anonym",
  },
  createdAt: "2022-05-22T22:30:00Z",
  votes: 0,
  comments: [
    {
      id: "comment-1",
      content: "Отличная статья! Полностью согласен с автором.",
      author: {
        id: "2",
        username: "Rum_8",
      },
      createdAt: "2022-05-22T22:43:00Z",
      votes: 0,
      replies: [
        {
          id: "reply-1",
          content: `Спасибо за комментарий! Действительно, современные тенденции развития общества требуют пересмотра устоявшихся подходов.

Важно отметить, что предложенные решения могут стать основой для дальнейшего развития отрасли.`,
          author: {
            id: "1",
            username: "Anonym",
          },
          createdAt: "2022-05-22T23:21:00Z",
          votes: 0,
          parentId: "comment-1",
          quotedContent: "Отличная статья! Полностью согласен с автором.",
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
