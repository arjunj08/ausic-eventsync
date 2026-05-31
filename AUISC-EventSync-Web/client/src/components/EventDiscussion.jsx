import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { 
  Pin, 
  CornerDownRight, 
  Trash2, 
  Smile, 
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventDiscussion({ eventId, user }) {
  const { socket } = useContext(SocketContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Replies & Reaction states
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReactionsMenuId, setShowReactionsMenuId] = useState(null);

  const emojis = ['👍', '❤️', '🔥', '😮', '👏', '🎉'];

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/comments/event/${eventId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  // Listen for socket discussion events
  useEffect(() => {
    if (socket) {
      const newCommentChannel = `event_${eventId}_new_comment`;
      const updateCommentChannel = `event_${eventId}_comment_update`;
      const deleteCommentChannel = `event_${eventId}_comment_deleted`;

      socket.on(newCommentChannel, (newComment) => {
        setComments(prev => {
          // Verify if already exists to avoid duplicates
          if (prev.some(c => c._id === newComment._id)) return prev;
          
          // Re-sort to respect pinned first
          const updated = [newComment, ...prev];
          return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        });
      });

      socket.on(updateCommentChannel, (updatedComment) => {
        setComments(prev => {
          const updated = prev.map(c => c._id === updatedComment._id ? updatedComment : c);
          return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        });
      });

      socket.on(deleteCommentChannel, (data) => {
        setComments(prev => prev.filter(c => c._id !== data.id));
      });

      return () => {
        socket.off(newCommentChannel);
        socket.off(updateCommentChannel);
        socket.off(deleteCommentChannel);
      };
    }
  }, [socket, eventId]);

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyText : text;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post('/api/comments', {
        eventId,
        text: content,
        parentId
      });
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setText('');
      }
      // Optimistic update (if socket doesn't fire immediately)
      setComments(prev => {
        if (prev.some(c => c._id === res.data._id)) return prev;
        const updated = [res.data, ...prev];
        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
    } catch (err) {
      toast.error('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePin = async (id) => {
    try {
      await axios.patch(`/api/comments/${id}/pin`);
      toast.success('Pin state updated.');
    } catch (err) {
      toast.error('Failed to toggle pin state.');
    }
  };

  const handleReact = async (id, emoji) => {
    try {
      await axios.patch(`/api/comments/${id}/react`, { emoji });
      setShowReactionsMenuId(null);
    } catch (err) {
      toast.error('Failed to react.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(`/api/comments/${id}`);
      toast.success('Comment deleted.');
      setComments(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  // Group comments: Parents and children
  const parentComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => {
    return comments.filter(c => c.parentId === parentId).reverse(); // Reverse so oldest reply is first
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Input box for new parent comment */}
      <form onSubmit={(e) => handleSubmitComment(e)} className="bg-[#161616] border border-gray-850 p-4 rounded-xl space-y-3">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Join the conversation
        </h4>
        <div className="flex gap-2">
          <textarea
            placeholder="Type your event comment or question here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="flex-1 bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF] resize-none h-14"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 text-black px-4 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Discussions board */}
      <div className="space-y-4">
        {parentComments.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center py-6">No discussions started yet. Be the first to comment!</p>
        ) : (
          parentComments.map((comment) => {
            const replies = getReplies(comment._id);
            const userHasReacted = (r) => r.userIds.includes(user.id || user._id);

            return (
              <div key={comment._id} className="space-y-3">
                {/* Parent Comment Bubble */}
                <div className={`p-4 rounded-xl border relative ${
                  comment.isPinned ? 'border-[#00BFFF]/40 bg-[#00BFFF]/2' : 'border-gray-850 bg-[#111111]'
                }`}>
                  
                  {/* Pin badge */}
                  {comment.isPinned && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-[#00BFFF] font-extrabold uppercase">
                      <Pin className="h-3 w-3 fill-[#00BFFF]" />
                      Pinned
                    </span>
                  )}

                  {/* Comment Author Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={comment.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.authorName)}`}
                      alt={comment.authorName}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="font-bold text-xs text-white">{comment.authorName}</span>
                    <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-gray-300 leading-relaxed font-medium pl-8 pr-12">
                    {comment.text}
                  </p>

                  {/* Actions bar */}
                  <div className="flex flex-wrap items-center gap-4 pl-8 mt-4 pt-3 border-t border-gray-850/50 text-[10px] text-gray-500">
                    {/* Reply link */}
                    <button
                      onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
                      className="hover:text-white font-bold transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Reply
                    </button>

                    {/* Pin Action (Admin only) */}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handlePin(comment._id)}
                        className={`hover:text-white transition-all flex items-center gap-0.5 cursor-pointer uppercase tracking-wider font-bold ${
                          comment.isPinned ? 'text-[#00BFFF]' : ''
                        }`}
                      >
                        <Pin className="h-3 w-3" />
                        {comment.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}

                    {/* Delete Action */}
                    {(user?.role === 'admin' || String(comment.authorId) === String(user.id || user._id)) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="hover:text-red-400 text-red-500/80 transition-all flex items-center gap-0.5 cursor-pointer uppercase tracking-wider font-bold"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}

                    {/* Reactions Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setShowReactionsMenuId(showReactionsMenuId === comment._id ? null : comment._id)}
                        className="hover:text-white transition-all flex items-center gap-0.5 cursor-pointer uppercase tracking-wider font-bold"
                      >
                        <Smile className="h-3.5 w-3.5" />
                        React
                      </button>

                      {showReactionsMenuId === comment._id && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#1A1A1A] border border-gray-850 p-1.5 rounded-lg shadow-xl flex gap-1.5 z-20">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(comment._id, emoji)}
                              className="text-base hover:scale-125 transition-transform p-0.5 cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reactions Display */}
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {comment.reactions.map((react) => (
                          <button
                            key={react.emoji}
                            onClick={() => handleReact(comment._id, react.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold cursor-pointer transition-all ${
                              userHasReacted(react)
                                ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'
                                : 'bg-gray-850 border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>{react.emoji}</span>
                            <span>{react.userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Replies List */}
                {replies.length > 0 && (
                  <div className="pl-6 space-y-3">
                    {replies.map((reply) => (
                      <div key={reply._id} className="p-3.5 rounded-xl border border-gray-850 bg-[#161616]/50 flex gap-2.5">
                        <CornerDownRight className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          
                          {/* Reply Header */}
                          <div className="flex items-center gap-2">
                            <img
                              src={reply.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reply.authorName)}`}
                              alt={reply.authorName}
                              className="h-5 w-5 rounded-full"
                            />
                            <span className="font-bold text-xs text-white">{reply.authorName}</span>
                            <span className="text-[9px] text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Reply Text */}
                          <p className="text-xs text-gray-300 leading-relaxed font-medium pl-7 pr-6">
                            {reply.text}
                          </p>

                          {/* Reply Actions */}
                          <div className="flex items-center gap-3 pl-7 mt-2 text-[9px] text-gray-500">
                            {/* Delete */}
                            {(user?.role === 'admin' || String(reply.authorId) === String(user.id || user._id)) && (
                              <button
                                onClick={() => handleDelete(reply._id)}
                                className="hover:text-red-400 transition-colors flex items-center gap-0.5 cursor-pointer uppercase tracking-wider font-bold"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}

                            {/* Reactions Trigger for Reply */}
                            <div className="relative">
                              <button
                                onClick={() => setShowReactionsMenuId(showReactionsMenuId === reply._id ? null : reply._id)}
                                className="hover:text-white transition-all flex items-center gap-0.5 cursor-pointer uppercase font-bold"
                              >
                                <Smile className="h-3.5 w-3.5" />
                                React
                              </button>
                              {showReactionsMenuId === reply._id && (
                                <div className="absolute bottom-full left-0 mb-2 bg-[#1A1A1A] border border-gray-850 p-1.5 rounded-lg shadow-xl flex gap-1.5 z-20">
                                  {emojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReact(reply._id, emoji)}
                                      className="text-base hover:scale-125 transition-transform p-0.5 cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Reactions Display for Reply */}
                            {reply.reactions && reply.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {reply.reactions.map((react) => (
                                  <button
                                    key={react.emoji}
                                    onClick={() => handleReact(reply._id, react.emoji)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-bold cursor-pointer transition-all ${
                                      userHasReacted(react)
                                        ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'
                                        : 'bg-gray-850 border-gray-800 text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    <span>{react.emoji}</span>
                                    <span>{react.userIds.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Reply Input Box */}
                {replyingToId === comment._id && (
                  <form 
                    onSubmit={(e) => handleSubmitComment(e, comment._id)}
                    className="pl-6 flex gap-2 mt-2"
                  >
                    <textarea
                      placeholder={`Reply to ${comment.authorName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                      className="flex-1 bg-[#161616] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF] resize-none h-11"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-purple-650 hover:bg-purple-600 border border-purple-800/40 text-white px-3.5 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0"
                    >
                      <CornerDownRight className="h-4 w-4" />
                    </button>
                  </form>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
