import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth-store';
import { useHouseholdStore } from '../../stores/household-store';
import { useSyncStore } from '../../stores/sync-store';
import { clearAllCachedData } from '../../db';
import { Button } from '../../components/ui';
import type { Member } from '@chorechamp/types';

export function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const {
    activeHousehold,
    activeMember,
    members,
    households,
    setActiveHousehold,
    setActiveMember,
    clear: clearHousehold,
  } = useHouseholdStore();
  const { sync, isSyncing, lastSyncAt } = useSyncStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            clearHousehold();
            await clearAllCachedData();
            await signOut();
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached data. You will need to sync again to reload your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllCachedData();
            clearHousehold();
            Alert.alert('Cache Cleared', 'Pull down to refresh and reload data.');
          },
        },
      ]
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getMemberColor = (member: Member) => {
    return member.color || '#6366f1';
  };

  const renderBadges = () => {
    const badges = activeMember?.badges || [];
    if (badges.length === 0) {
      return (
        <View className="items-center py-6">
          <Text className="text-4xl mb-2">🏆</Text>
          <Text className="text-gray-500 text-center">
            Complete chores to earn badges!
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-row flex-wrap">
        {badges.slice(0, 8).map((badge, index) => (
          <View
            key={index}
            className="w-1/4 p-2 items-center"
          >
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center">
              <Text className="text-2xl">🏅</Text>
            </View>
            <Text className="text-xs text-gray-600 mt-1 text-center" numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ))}
        {badges.length > 8 && (
          <View className="w-1/4 p-2 items-center">
            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
              <Text className="text-gray-600 font-medium">+{badges.length - 8}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isSyncing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Profile Header */}
        <View className="bg-white mx-6 mt-4 rounded-2xl p-6 items-center">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: getMemberColor(activeMember || {} as Member) + '20' }}
          >
            {activeMember?.avatarUrl ? (
              <Text className="text-4xl">👤</Text>
            ) : (
              <Text className="text-4xl font-bold" style={{ color: getMemberColor(activeMember || {} as Member) }}>
                {(activeMember?.name || user?.name || 'U')[0].toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            {activeMember?.name || user?.name || 'User'}
          </Text>
          <Text className="text-gray-500 mt-1">{user?.email}</Text>
          <View className="flex-row mt-4">
            <View className="items-center px-6">
              <Text className="text-2xl font-bold text-primary-500">
                {activeMember?.pointsCurrent || 0}
              </Text>
              <Text className="text-gray-500 text-sm">
                {activeHousehold?.pointsName || 'Points'}
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center px-6">
              <Text className="text-2xl font-bold text-warning-500">
                {activeMember?.streakCurrent || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Day Streak</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center px-6">
              <Text className="text-2xl font-bold text-success-500">
                {activeMember?.badges?.length || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Badges</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Badges</Text>
          {renderBadges()}
        </View>

        {/* Member Selection */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <Text className="text-lg font-semibold text-gray-900 px-6 pt-6 pb-2">
            Family Member
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100"
            onPress={() => setShowMemberPicker(true)}
          >
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: getMemberColor(activeMember || {} as Member) + '20' }}
              >
                <Text style={{ color: getMemberColor(activeMember || {} as Member) }} className="font-bold">
                  {(activeMember?.name || 'U')[0]}
                </Text>
              </View>
              <Text className="text-gray-900 font-medium">{activeMember?.name || 'Select member'}</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Household Selection */}
        {households.length > 1 && (
          <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
            <Text className="text-lg font-semibold text-gray-900 px-6 pt-6 pb-2">
              Household
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100"
              onPress={() => setShowHouseholdPicker(true)}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                  <Text>🏠</Text>
                </View>
                <Text className="text-gray-900 font-medium">
                  {activeHousehold?.name || 'Select household'}
                </Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <Text className="text-lg font-semibold text-gray-900 px-6 pt-6 pb-2">
            Settings
          </Text>

          {/* Last Sync */}
          <View className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100">
            <Text className="text-gray-600">Last Sync</Text>
            <Text className="text-gray-900">{formatDate(lastSyncAt)}</Text>
          </View>

          {/* Sync Button */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100"
            onPress={sync}
            disabled={isSyncing}
          >
            <Text className="text-gray-600">Sync Now</Text>
            <Text className="text-primary-500 font-medium">
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>

          {/* Clear Cache */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100"
            onPress={handleClearCache}
          >
            <Text className="text-gray-600">Clear Cache</Text>
            <Text className="text-warning-500 font-medium">Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View className="mx-6 mt-6">
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleSignOut}
            size="lg"
          />
        </View>

        {/* App Version */}
        <Text className="text-gray-400 text-center text-sm mt-6">
          ChoreChamp v1.0.0
        </Text>
      </ScrollView>

      {/* Member Picker Modal */}
      <Modal
        visible={showMemberPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[60%]">
            <View className="p-6 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900 text-center">
                Select Family Member
              </Text>
            </View>
            <ScrollView className="p-6">
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${
                    member.id === activeMember?.id ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                  onPress={async () => {
                    await setActiveMember(member.id);
                    setShowMemberPicker(false);
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: getMemberColor(member) + '20' }}
                  >
                    <Text className="text-xl font-bold" style={{ color: getMemberColor(member) }}>
                      {member.name[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{member.name}</Text>
                    <Text className="text-gray-500 text-sm capitalize">{member.role}</Text>
                  </View>
                  {member.id === activeMember?.id && (
                    <Text className="text-primary-500 text-xl">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="p-6 pt-0">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowMemberPicker(false)}
                size="lg"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Household Picker Modal */}
      <Modal
        visible={showHouseholdPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHouseholdPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[60%]">
            <View className="p-6 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900 text-center">
                Select Household
              </Text>
            </View>
            <ScrollView className="p-6">
              {households.map((household) => (
                <TouchableOpacity
                  key={household.id}
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${
                    household.id === activeHousehold?.id ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                  onPress={async () => {
                    await setActiveHousehold(household.id);
                    setShowHouseholdPicker(false);
                  }}
                >
                  <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-xl">🏠</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{household.name}</Text>
                  </View>
                  {household.id === activeHousehold?.id && (
                    <Text className="text-primary-500 text-xl">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="p-6 pt-0">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowHouseholdPicker(false)}
                size="lg"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
