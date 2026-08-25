import FilterVoicesModal, {
    DEFAULT_FILTERS,
    VoiceFilters,
} from '@/components/voices/FilterVoicesModal';
import SearchBar from '@/components/voices/SearchBar';
import VoiceCard, { Voice } from '@/components/voices/VoiceCard';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data — replace with your real voice-catalog API response
const VOICES: Voice[] = [
  {
    id: '1',
    name: 'Olivia',
    gender: 'F',
    flag: '🇺🇸',
    style: 'Young',
    avatar: 'https://i.pravatar.cc/150?img=5',
    avatarTint: 'rgba(0, 238, 252, 0.14)',
  },
  {
    id: '2',
    name: 'Samuel',
    gender: 'M',
    flag: '🇬🇧',
    style: 'Middle-Aged',
    avatar: 'https://i.pravatar.cc/150?img=13',
    avatarTint: 'rgba(212, 192, 215, 0.14)',
  },
  {
    id: '3',
    name: 'Daniel',
    gender: 'M',
    flag: '🇮🇳',
    style: 'Middle-Aged',
    avatar: 'https://i.pravatar.cc/150?img=14',
    avatarTint: 'rgba(212, 192, 215, 0.14)',
  },
  {
    id: '4',
    name: 'Isabella',
    gender: 'F',
    flag: '🇳🇬',
    style: 'Young',
    avatar: 'https://i.pravatar.cc/150?img=32',
    isPremium: true,
    avatarTint: 'rgba(255, 185, 97, 0.16)',
  },
  {
    id: '5',
    name: 'Abigail',
    gender: 'F',
    flag: '🇬🇧',
    style: 'Middle-Aged',
    avatar: 'https://i.pravatar.cc/150?img=25',
    isPremium: true,
    avatarTint: 'rgba(0, 238, 252, 0.14)',
  },
  {
    id: '6',
    name: 'Gabriel',
    gender: 'M',
    flag: '🇧🇷',
    style: 'Middle-Aged',
    avatar: 'https://i.pravatar.cc/150?img=51',
    isPremium: true,
    avatarTint: 'rgba(0, 238, 252, 0.14)',
  },
];

export default function VoiceSelectScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  /*
   * Responsive breakpoints
   *
   * < 600       → phone
   * 600 - 899   → tablet
   * 900+        → large tablet / desktop-like layout
   */
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLargeTablet = width >= 900;

  /*
   * Number of columns
   *
   * Phone:
   *   2 columns
   *
   * Tablet portrait:
   *   3 columns
   *
   * Tablet landscape / large screens:
   *   4 columns
   */
  const numColumns = isPhone
    ? 2
    : isTablet
      ? isLandscape
        ? 4
        : 3
      : 4;

  /*
   * Responsive horizontal padding.
   *
   * Phones stay compact.
   * Tablets get more breathing room.
   */
  const horizontalPadding = isPhone
    ? 16
    : isTablet
      ? 28
      : 40;

  /*
   * Gap between cards.
   */
  const gridGap = isPhone ? 10 : isTablet ? 14 : 16;

  /*
   * Calculate card width so every card has an exact width.
   *
   * This prevents VoiceCard from stretching strangely on iPads.
   */
  const availableWidth =
    width -
    horizontalPadding * 2 -
    gridGap * (numColumns - 1);

  const cardWidth = availableWidth / numColumns;

  const [query, setQuery] = useState('');
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<VoiceFilters>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] =
    useState(false);

  const activeFilterCount = [
    filters.language,
    filters.gender,
    filters.ageGroup,
  ].filter(Boolean).length;

  const filteredVoices = useMemo(() => {
    return VOICES.filter((v) => {
      const matchesQuery = v.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const matchesGender =
        !filters.gender ||
        v.gender ===
          (filters.gender === 'Male' ? 'M' : 'F');

      const matchesAge =
        !filters.ageGroup ||
        filters.ageGroup === 'All Age Groups' ||
        v.style === filters.ageGroup;

      return matchesQuery && matchesGender && matchesAge;
    });
  }, [query, filters]);

  const toggleFavorite = (id: string) => {
    setFavorited((f) => ({
      ...f,
      [id]: !f[id],
    }));
  };

  const togglePlay = (id: string) => {
    setPlayingId((current) =>
      current === id ? null : id
    );
  };

  const handleSelect = (voice: Voice) => {
    // TODO:
    // persist the chosen voice to your real store
    // then navigate back

    router.back();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* ================= HEADER ================= */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isPhone ? 6 : 10,
            paddingBottom: isPhone ? 12 : 16,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.headerButton,
            {
              backgroundColor: theme.surfaceVariant,
            },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.onSurface}
          />
        </Pressable>

        <Text
          numberOfLines={1}
          style={[
            styles.headerTitle,
            {
              color: theme.onSurface,
              fontSize: isPhone ? 17 : 19,
            },
          ]}
        >
          Explore AI Voices
        </Text>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[
            styles.headerButton,
            {
              backgroundColor: theme.surfaceVariant,
            },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={theme.onSurface}
          />

          {activeFilterCount > 0 && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  {
                    color: theme.buttonText,
                  },
                ]}
              >
                {activeFilterCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ================= SEARCH ================= */}
      <View
        style={[
          styles.searchWrapper,
          {
            paddingHorizontal: horizontalPadding,
            marginBottom: isPhone ? 12 : 18,
          },
        ]}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* ================= VOICE GRID ================= */}
      <FlatList
        key={`grid-${numColumns}`}
        data={filteredVoices}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.gridContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: isPhone ? 30 : 50,
            gap: gridGap,
          },
        ]}
        columnWrapperStyle={{
          gap: gridGap,
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: cardWidth,
            }}
          >
            <VoiceCard
              voice={item}
              favorited={!!favorited[item.id]}
              isPlaying={playingId === item.id}
              onToggleFavorite={() =>
                toggleFavorite(item.id)
              }
              onTogglePlay={() =>
                togglePlay(item.id)
              }
              onSelect={() =>
                handleSelect(item)
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              {
                width:
                  width -
                  horizontalPadding * 2,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    theme.surfaceVariant,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={26}
                color={theme.onSurfaceVariant}
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.onSurface,
                },
              ]}
            >
              No voices found
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
            >
              No voices match “{query}”
            </Text>
          </View>
        }
      />

      {/* ================= FILTER MODAL ================= */}
      <FilterVoicesModal
        visible={filterModalVisible}
        initialFilters={filters}
        onClose={() =>
          setFilterModalVisible(false)
        }
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.3,
    marginHorizontal: 12,
  },

  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  filterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  searchWrapper: {
    width: '100%',
  },

  gridContent: {
    alignItems: 'flex-start',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

