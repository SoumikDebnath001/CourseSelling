"use client";

import { useState } from "react";
import { Heart, Pin, Star, Reply, Pencil, Trash2, Shield } from "lucide-react";
import type { CommentNode } from "@/types/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Actions {
  like: (id: string) => void;
  pin: (id: string) => void;
  star: (id: string) => void;
  edit: (id: string, text: string) => void;
  remove: (id: string) => void;
  reply: (parentId: string, text: string) => void;
}

export function CommentItem({ comment, actions, isReply }: { comment: CommentNode; actions: Actions; isReply?: boolean }) {
  const account = useAuth((s) => s.account);
  const isAdmin = account?.kind === "admin";
  const isOwner = account?.id === comment.authorId;
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [replyText, setReplyText] = useState("");

  return (
    <div className={cn("rounded-lg border p-3", comment.isPinned ? "border-pitch-200 bg-pitch-50/40" : "border-ink-200 bg-white")}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-ink-900">{comment.authorName}</span>
        {comment.authorModel === "Admin" && (
          <span className="flex items-center gap-0.5 rounded bg-ball-50 px-1.5 py-0.5 text-[10px] font-semibold text-ball-600">
            <Shield className="h-3 w-3" /> Coach
          </span>
        )}
        {comment.isPinned && <Pin className="h-3.5 w-3.5 text-pitch-600" />}
        {comment.isStarred && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
        <span className="ml-auto text-xs text-ink-400">{comment.isEdited && "(edited)"}</span>
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea className="input min-h-16 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => {
                actions.edit(comment._id, text);
                setEditing(false);
              }}
              className="text-xs font-semibold text-pitch-700"
            >
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-ink-400">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 whitespace-pre-line text-sm text-ink-700">{comment.text}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
        <button onClick={() => actions.like(comment._id)} className={cn("flex items-center gap-1 hover:text-ball-600", comment.likedByMe && "text-ball-600")}>
          <Heart className={cn("h-3.5 w-3.5", comment.likedByMe && "fill-ball-500")} /> {comment.likeCount}
        </button>
        {!isReply && (
          <button onClick={() => setReplying((v) => !v)} className="flex items-center gap-1 hover:text-pitch-700">
            <Reply className="h-3.5 w-3.5" /> Reply
          </button>
        )}
        {isAdmin && (
          <>
            <button onClick={() => actions.pin(comment._id)} className="flex items-center gap-1 hover:text-pitch-700">
              <Pin className="h-3.5 w-3.5" /> {comment.isPinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={() => actions.star(comment._id)} className="flex items-center gap-1 hover:text-yellow-600">
              <Star className="h-3.5 w-3.5" /> {comment.isStarred ? "Unstar" : "Star"}
            </button>
          </>
        )}
        {isOwner && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 hover:text-pitch-700">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {(isOwner || isAdmin) && (
          <button onClick={() => actions.remove(comment._id)} className="flex items-center gap-1 hover:text-ball-600">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>

      {replying && (
        <div className="mt-2 flex gap-2">
          <input
            className="input text-sm"
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                actions.reply(comment._id, replyText.trim());
                setReplyText("");
                setReplying(false);
              }
            }}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            Send
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-ink-100 pl-3">
          {comment.replies.map((r) => (
            <CommentItem key={r._id} comment={r} actions={actions} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
