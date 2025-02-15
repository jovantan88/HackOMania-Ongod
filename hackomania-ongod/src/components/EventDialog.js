import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/supabaseClient";

const Comment = ({ comment, onReply, session, comments, onDelete }) => {
  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  const childComments = comments.filter(c => c.parent_comment_id === comment.id);

  const handleSubmitReply = async () => {
    if (replyText.trim()) {
      await onReply(replyText, comment.id);
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  const isCommentAuthor = session?.user?.user_metadata?.user_name === comment.username;

  return (
    <div className="mt-2">
      <div className="flex items-start gap-1">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm">{comment.username}</p>
            <p className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </p>
          </div>
          <p className="mt-0.5 text-sm">{comment.comment}</p>
          <div className="mt-1 flex gap-1">
            {session && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                Reply
              </Button>
            )}
            {isCommentAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="mt-1 ml-4">
          <div className="flex gap-1">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 h-8 text-sm"
            />
            <Button
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              className="h-8 text-sm"
            >
              Post
            </Button>
          </div>
        </div>
      )}

      {childComments.length > 0 && (
        <div className="ml-4">
          {childComments.map((childComment) => (
            <Comment
              key={childComment.id}
              comment={childComment}
              onReply={onReply}
              session={session}
              comments={comments}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ eventUrl, session }) => {
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select('id, event_url, username, comment, parent_comment_id, created_at')
        .eq('event_url', eventUrl)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (eventUrl) {
      fetchComments();
    }
  }, [eventUrl]);

  const handleSubmitComment = async (text, parentId = null) => {
    if (!session || !text.trim()) return;

    try {
      const newCommentData = {
        event_url: eventUrl,
        username: session.user.user_metadata.user_name,
        comment: text.trim(),
        parent_comment_id: parentId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('event_comments')
        .insert([newCommentData]);

      if (error) throw error;

      await fetchComments();
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  if (isLoading) {
    return <div className="p-2">Loading comments...</div>;
  }

  if (error) {
    return <div className="p-2 text-red-500">{error}</div>;
  }

  const topLevelComments = comments.filter(comment => !comment.parent_comment_id);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-2 pt-2">
        <h3 className="text-lg font-semibold">Comments</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {topLevelComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={handleSubmitComment}
              session={session}
              comments={comments}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      </div>
      <div className="flex-none p-2">
        {session ? (
          <div className="flex gap-1">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 h-8 text-sm"
            />
            <Button
              onClick={() => handleSubmitComment(newComment)}
              disabled={!newComment.trim()}
              className="h-8 text-sm"
            >
              Post
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Please sign in to leave a comment.
          </p>
        )}
      </div>
    </div>
  );
};

const EventDialog = ({ event, isOpen, onClose, onEventClick, session }) => {
  const handleEventClick = async () => {
    if (!event?.url) return;
    await onEventClick(event.url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="overflow-hidden max-w-5xl max-h-[calc(100vh-200px)] flex flex-row justify-between grid grid-cols-2">
        <div className="overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center w-full">
              <img
                src={event?.image_url}
                alt={event?.name}
                className="mr-2 w-8 h-8 rounded-full"
              />
              <DialogTitle className="whitespace-normal break-words">
                {event?.name}
              </DialogTitle>
            </div>
            <DialogDescription className="whitespace-normal break-words">
              {event?.description}
            </DialogDescription>
            <p className="text-xs text-gray-500">
              {event?.date && new Date(event.date).toDateString()}
            </p>
          </DialogHeader>

          <div className="flex-1">
            <p className="mb-2 text-sm flex items-center">
              <MapPin className="mr-1 inline-block h-4 w-4" />
              {event?.location}
            </p>
            <p className="font-bold">
              {event?.price === 0 ? "Free" : `$${event?.price}`}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex w-full justify-between">
              <Button
                variant="outline"
                onClick={handleEventClick}
              >
                Sign up here
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </DialogFooter>
        </div>
        <div className="border-l">
          <CommentSection
            eventUrl={event?.url}
            session={session}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;