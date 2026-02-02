/**
 * useGroups Hook
 *
 * State management for groups with real-time updates.
 */

import { groupsService } from '@/services/groups';
import { Group } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useGroups() {
  const { userId } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = groupsService.subscribeToUserGroups(
      userId,
      (groupsList) => {
        setGroups(groupsList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Groups subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const createGroup = useCallback(async (name: string, description: string) => {
    if (!userId) throw new Error('Not authenticated');
    return await groupsService.createGroup(name, description, userId);
  }, [userId]);

  const joinByCode = useCallback(async (code: string) => {
    if (!userId) throw new Error('Not authenticated');
    const group = await groupsService.findByJoinCode(code);
    if (!group) throw new Error('Group not found');
    if (group.members.includes(userId)) throw new Error('Already a member');
    await groupsService.joinGroup(group.id!, userId);
    return group;
  }, [userId]);

  return {
    groups,
    isLoading,
    error,
    createGroup,
    joinByCode,
  };
}

export function useGroup(groupId: string) {
  const { userId } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = groupsService.subscribeToGroup(
      groupId,
      (groupData) => {
        setGroup(groupData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Group subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  const leaveGroup = useCallback(async () => {
    if (!userId || !groupId) return;
    await groupsService.leaveGroup(groupId, userId);
  }, [groupId, userId]);

  const deleteGroup = useCallback(async () => {
    if (!groupId) return;
    await groupsService.deleteGroup(groupId);
  }, [groupId]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!groupId) return;
    await groupsService.removeMember(groupId, memberId);
  }, [groupId]);

  const transferOwnership = useCallback(async (newOwnerId: string) => {
    if (!groupId) return;
    await groupsService.transferOwnership(groupId, newOwnerId);
  }, [groupId]);

  const isOwner = group?.ownerId === userId;
  const isMember = group?.members.includes(userId || '') ?? false;

  return {
    group,
    isLoading,
    error,
    isOwner,
    isMember,
    leaveGroup,
    deleteGroup,
    removeMember,
    transferOwnership,
  };
}
