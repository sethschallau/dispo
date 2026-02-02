/**
 * CommentList Component
 *
 * Industrial ethereal comment section
 */

import Theme from '@/constants/Theme';
import { Comment, formatRelativeTime } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  canDelete: (comment: Comment) => boolean;
}

export default function CommentList({
  comments,
  isLoading,
  onAddComment,
  onDeleteComment,
  canDelete,
}: CommentListProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.authorName?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(item.timestamp)}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      {canDelete(item) && (
        <TouchableOpacity
          onPress={() => onDeleteComment(item.id!)}
          style={styles.deleteButton}
        >
          <FontAwesome name="trash-o" size={14} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Comments ({comments.length})
      </Text>

      {comments.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id!}
          scrollEnabled={false}
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={Theme.colors.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
        >
          <FontAwesome
            name="send"
            size={16}
            color={newComment.trim() ? Theme.colors.accent : Theme.colors.chromeDim}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
    color: Theme.colors.textPrimary,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundCard,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  commentText: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    marginTop: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: Theme.colors.backgroundCard,
    color: Theme.colors.textPrimary,
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
