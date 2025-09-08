import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import type { Comment as CommentType } from "@/types";

interface WebSocketMessage {
  type: "NEW_COMMENT" | "UPDATED_COMMENT" | "DELETED_COMMENT";
  data: CommentType | { id: string };
}

interface UseWebSocketReturn {
  socket: any | null;
  isConnected: boolean;
  joinPost: (postId: string) => void;
  leavePost: (postId: string) => void;
  onNewComment: (callback: (comment: CommentType) => void) => void;
  onUpdatedComment: (callback: (comment: CommentType) => void) => void;
  onDeletedComment: (callback: (commentId: string) => void) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any | null>(null);
  const callbacksRef = useRef<{
    newComment?: (comment: CommentType) => void;
    updatedComment?: (comment: CommentType) => void;
    deletedComment?: (commentId: string) => void;
  }>({});

  useEffect(() => {
    // Ініціалізуємо Socket.IO клієнт
    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:3001";
    const socket = io(`${wsUrl}/comments`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Обробники подій підключення
    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Обробники повідомлень
    socket.on("new_comment", (message: WebSocketMessage) => {
      console.log("New comment received:", message);
      console.log("Message data:", message.data);
      console.log("PostId from message:", (message.data as any)?.postId);
      if (callbacksRef.current.newComment && message.data) {
        callbacksRef.current.newComment(message.data as CommentType);
      }
    });

    socket.on("updated_comment", (message: WebSocketMessage) => {
      console.log("Updated comment received:", message);
      if (callbacksRef.current.updatedComment && message.data) {
        callbacksRef.current.updatedComment(message.data as CommentType);
      }
    });

    socket.on("deleted_comment", (message: WebSocketMessage) => {
      console.log("Deleted comment received:", message);
      if (callbacksRef.current.deletedComment && message.data) {
        callbacksRef.current.deletedComment(
          (message.data as { id: string }).id
        );
      }
    });

    // Cleanup при розмонтуванні
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinPost = useCallback(
    (postId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("join_post", { postId });
        console.log(`Joined post: ${postId}`);
      }
    },
    [isConnected]
  );

  const leavePost = useCallback(
    (postId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("leave_post", { postId });
        console.log(`Left post: ${postId}`);
      }
    },
    [isConnected]
  );

  const onNewComment = useCallback(
    (callback: (comment: CommentType) => void) => {
      callbacksRef.current.newComment = callback;
    },
    []
  );

  const onUpdatedComment = useCallback(
    (callback: (comment: CommentType) => void) => {
      callbacksRef.current.updatedComment = callback;
    },
    []
  );

  const onDeletedComment = useCallback(
    (callback: (commentId: string) => void) => {
      callbacksRef.current.deletedComment = callback;
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    joinPost,
    leavePost,
    onNewComment,
    onUpdatedComment,
    onDeletedComment,
  };
};
