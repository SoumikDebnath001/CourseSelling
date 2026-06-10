"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useComments, useCommentActions } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export function CommentsSection({ topicId }: { topicId: string }) {
  const { data: comments, isLoading } = useComments(topicId);
  const { add, like, pin, star, edit, remove } = useCommentActions(topicId);
  const [text, setText] = useState("");

  const actions = {
    like: (id: string) => like.mutate(id),
    pin: (id: string) => pin.mutate(id),
    star: (id: string) => star.mutate(id),
    edit: (id: string, t: string) => edit.mutate({ id, text: t }),
    remove: (id: string) => remove.mutate(id),
    reply: (parentId: string, t: string) => add.mutate({ text: t, parentId }),
  };

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <MessageSquare className="h-5 w-5 text-pitch-600" />
        Discussion {comments && `(${comments.length})`}
      </h2>

      <div className="mt-3 flex gap-2">
        <textarea
          className="input min-h-12"
          placeholder="Ask a question or share a thought…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          loading={add.isPending}
          onClick={() => {
            if (text.trim()) {
              add.mutate({ text: text.trim() });
              setText("");
            }
          }}
          className="self-end"
        >
          Post
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : comments && comments.length > 0 ? (
          comments.map((c) => <CommentItem key={c._id} comment={c} actions={actions} />)
        ) : (
          <p className="py-6 text-center text-sm text-ink-400">No comments yet — start the conversation.</p>
        )}
      </div>
    </section>
  );
}
