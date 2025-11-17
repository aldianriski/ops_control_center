import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { MessageCircle, Send, UserCircleIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  mentions: string[];
  timestamp: string;
  edited?: boolean;
}

interface IncidentCommentsProps {
  incidentId: string;
  incidentTitle: string;
}

const IncidentComments: React.FC<IncidentCommentsProps> = ({ incidentId, incidentTitle }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'John Doe',
      authorEmail: 'john@example.com',
      content: 'Investigating the root cause. Database queries are timing out.',
      mentions: [],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      author: 'Jane Smith',
      authorEmail: 'jane@example.com',
      content: '@john Found the issue - connection pool exhausted. Increasing max connections.',
      mentions: ['john'],
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock team members for @mentions (currently not used, but kept for future features)
  // const teamMembers = [
  //   { name: 'John Doe', email: 'john@example.com', handle: 'john' },
  //   { name: 'Jane Smith', email: 'jane@example.com', handle: 'jane' },
  //   { name: 'Bob Johnson', email: 'bob@example.com', handle: 'bob' },
  //   { name: 'Alice Williams', email: 'alice@example.com', handle: 'alice' },
  // ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Extract mentions
    const mentions = newComment.match(/@\w+/g)?.map(m => m.slice(1)) || [];

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      author: user?.name || 'Current User',
      authorEmail: user?.email || 'user@example.com',
      content: newComment,
      mentions,
      timestamp: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');
    toast.success('Comment added');

    // Simulate notification to mentioned users
    if (mentions.length > 0) {
      toast.success(`Notified ${mentions.length} team member(s)`, { duration: 2000 });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const highlightMentions = (content: string) => {
    return content.split(/(@\w+)/g).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-indigo-600 dark:text-indigo-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Team Collaboration
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Comments List */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {comment.author}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                    {comment.edited && (
                      <span className="text-xs text-gray-400 italic">(edited)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {highlightMentions(comment.content)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* New Comment Form */}
          <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment... (use @username to mention)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span>💡 Tip: Use @username to mention team members</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Participants */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Participants
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(comments.map(c => c.authorEmail))).map((email, index) => {
                const comment = comments.find(c => c.authorEmail === email);
                return (
                  <div
                    key={email}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                  >
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {comment?.author}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentComments;
