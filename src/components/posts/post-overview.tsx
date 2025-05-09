import { Post } from "@/lib/api.d";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { MoreHorizontal, MessageCircle, EyeOff, Pencil, Trash2, Pin } from "lucide-react";
import VoteButtons from "./vote-buttons";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useVotePost } from "@/lib/hooks/use-vote-post";
import PostDeleteWarning from "./post-delete-warning";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { MarkdownRenderer } from "../ui/markdown-renderer";

const PostOverview = ({
  post,
  queryKey,
  showPinned = false
}: {
  post: Post,
  queryKey: any[],
  showPinned?: boolean
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const voteDifference = post.upvotes - post.downvotes;
  const [isOpen, setIsOpen] = useState(voteDifference >= 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { votePost } = useVotePost(queryKey);
  const queryClient = useQueryClient();

  const isOwner = user?.id === post.user.id;
  const canModify = isOwner || user?.isAdmin;

  const { mutate: deletePost } = useMutation({
    mutationFn: () => api.delete(`/post/${post.id}`),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast({
        title: error.message || 'Error',
        description: error.info || 'Failed to delete post',
        variant: 'destructive'
      });
    }
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: () => {
      if (post.isPinned) {
        return api.patch(`/post/unpin/${post.id}`);
      } else {
        return api.patch(`/post/pin/${post.id}`);
      }
    },
    onMutate: () => {
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          data: {
            ...old.data,
            posts: old.data.posts.map((post: Post) => post.id === post.id ? { ...post, isPinned: !post.isPinned } : post)
          }
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: post.isPinned ? 'Post unpinned successfully' : 'Post pinned successfully',
      });
    },
    onError: (error: any, _, context) => {
      if (context?.previousData)
        queryClient.setQueryData(queryKey, context.previousData);

      toast({
        title: error.message || 'Error',
        description: error.info || 'Failed to update post pin status',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const handleVote = (postId: number, voteType: 'up' | 'down') => {
    votePost({ postId, voteType });
  }

  return (
    <div className="flex items-start gap-2">
      {!isOpen && (
        <div
          className='flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
          onClick={() => setIsOpen(true)}
        >
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <p className='text-sm text-muted-foreground'>Post hidden</p>
        </div>
      )}

      <div className="flex-1">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <CollapsibleContent>
            <article 
              key={post.id} 
              className={cn(
                "rounded-lg border bg-card hover:border-border/80 transition-colors",
                "group relative overflow-hidden",
                post.isPinned && showPinned && "border-primary/50"
              )}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('[role="menuitem"]')) {
                  navigate(`/community/${post.community.id}/post/${post.id}`);
                }
              }}
            >
              <div className="px-4 py-3 space-y-3 dark:bg-gray-950">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {post.image ? (
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-background" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background" />
                      )}
                      <Button
                        variant="link"
                        className="text-sm font-medium p-0 h-auto hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/community/${post.community.id}`);
                        }}
                      >
                        {post.community.name}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        by{" "}
                        <Button
                          variant="link"
                          className="text-xs text-muted-foreground p-0 h-auto hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.user.id}`);
                          }}
                        >
                          {post.user.displayName || post.user.username}
                        </Button>
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Label className="text-xs text-muted-foreground">
                                {formatTime(new Date(post.createdAt))}
                              </Label>
                              {Math.abs(new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime()) > 5000 && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              Date created: {new Date(post.createdAt).toLocaleString()}
                              {Math.abs(new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime()) > 5000 && (
                                <span className="block text-xs text-muted-foreground">
                                  Last edited: {new Date(post.updatedAt).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {post.isPinned && showPinned && (
                        <div className="flex items-center gap-1 text-primary text-xs font-medium">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </div>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canModify && (
                        <>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/community/${post.community.id}/edit-post/${post.id}`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                          </DropdownMenuItem>
                        </>
                      )}
                      {user?.isAdmin && showPinned && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin();
                          }}
                        >
                          <Pin className="mr-2 h-4 w-4" />
                          {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h1 className="text-lg font-semibold leading-tight line-clamp-2">{post.title}</h1>
                  <div className="line-clamp-5">
                    <MarkdownRenderer content={post.content} className="text-sm text-muted-foreground" />
                  </div>
                </div>

                {/* Image */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full h-auto object-cover" 
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 pt-2">
                  <VoteButtons post={post} handleVote={handleVote} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/community/${post.community.id}/post/${post.id}`)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Comments
                  </Button>
                </div>
              </div>
            </article>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <PostDeleteWarning
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={() => deletePost()}
      />
    </div>
  )
}

export default PostOverview;
