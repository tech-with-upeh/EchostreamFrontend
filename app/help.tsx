import GamerTTSMascot from "@/components/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    Layout
} from "react-native-reanimated"; // Reanimated's Animated.View, understands `entering`/`layout`
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type FAQ = {
  id: string;
  question: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Category = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  articleCount?: number;
};

const FAQS: FAQ[] = [
  {
    id: "username",
    question: "How do I update my username?",
    category: "Account",
    icon: "create-outline",
  },
  {
    id: "voice-cloning",
    question: "How do I clone my voice?",
    category: "Voice Cloning",
    icon: "mic-outline",
  },
  {
    id: "free",
    question: "Is EchoStream free?",
    category: "Pricing",
    icon: "gift-outline",
  },
  {
    id: "tiktok",
    question: "How do I connect my TikTok account?",
    category: "Live Runtime",
    icon: "musical-notes-outline",
  },
  {
    id: "tts",
    question: "How do I change my TTS voice?",
    category: "Voices",
    icon: "mic-outline",
  },
  {
    id: "subscription",
    question: "How do I change my subscription?",
    category: "Pricing",
    icon: "card-outline",
  },
];

const CATEGORIES: Category[] = [
  {
    id: "runtime",
    title: "Live Runtime",
    description: "Connecting TikTok and running EchoStream during your stream.",
    icon: "radio-outline",
    articleCount: 4,
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Configure speech, comments, gifts, and other behavior.",
    icon: "options-outline",
    articleCount: 5,
  },
  {
    id: "voices",
    title: "Voices",
    description: "Choose and customize the voices EchoStream uses.",
    icon: "mic-outline",
    articleCount: 3,
  },
  {
    id: "cloning",
    title: "Voice Cloning",
    description: "Create and manage your own AI voice.",
    icon: "mic-outline",
    articleCount: 2,
  },
  {
    id: "pricing",
    title: "Pricing & Plans",
    description: "Plans, upgrades, downgrades, and subscriptions.",
    icon: "card-outline",
    articleCount: 5,
  },
  {
    id: "account",
    title: "Account",
    description: "Manage your profile, login, and account settings.",
    icon: "person-outline",
    articleCount: 5,
  },
  {
    id: "alerts",
    title: "Alerts",
    description: "Configure sounds, gifts, follows, likes, and alerts.",
    icon: "notifications-outline",
    articleCount: 5,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Solutions for common EchoStream problems.",
    icon: "construct-outline",
    articleCount: 4,
  },
];

function getCategoryColors(
  category: string,
  theme: ReturnType<typeof useAppTheme>["theme"],
) {
  switch (category) {
    case "Voice Cloning":
      return {
        background: `${theme.primary}18`,
        icon: theme.primary,
      };

    case "Pricing":
      return {
        background: "#A855F715",
        icon: "#A855F7",
      };

    case "Live Runtime":
      return {
        background: "#3B82F615",
        icon: "#3B82F6",
      };

    case "Voices":
      return {
        background: "#10B98115",
        icon: "#10B981",
      };

    case "Account":
      return {
        background: "#F59E0B15",
        icon: "#F59E0B",
      };

    default:
      return {
        background: `${theme.primary}14`,
        icon: theme.primary,
      };
  }
}

export default function HelpCenterScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();

  const [search, setSearch] = useState("");

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return FAQS;
    }

    return FAQS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query),
    );
  }, [search]);

  const openFAQ = (faq: FAQ) => {
    // Later this can navigate to:
    // /help-center/username
    // or open an article returned from your backend.
    console.log("Open FAQ:", faq.id);
  };

  const openCategory = (category: Category) => {
    // Later this can navigate to:
    // /help-center/category/[id]
    console.log("Open category:", category.id);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={[theme.topGlow, "transparent"]}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <LinearGradient
          colors={[theme.bottomGlow, "transparent"]}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.header}
        >
          <Pressable onPress={() => router.back()} style={[styles.backButton]}>
            <Ionicons name="chevron-back" size={21} color={theme.onSurface} />
          </Pressable>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(80)}
          style={styles.hero}
        >
          <Text
            style={[
              styles.heroTitle,
              { color: theme.onSurface, marginBottom: 20 },
            ]}
          >
            Have a question in mind?
          </Text>

          {/* Search */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: "transparent",
                boxShadow: isDark
                  ? "0px 0px 18px #0000004d"
                  : "0px 0px 18px #8681814d",
              },
            ]}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search for topics or questions"
              placeholderTextColor={theme.onSurfaceVariant}
              style={[styles.searchInput, { color: theme.onSurface }]}
              returnKeyType="search"
            />

            <View style={[styles.searchIcon]}>
              <Ionicons name="search" size={18} color={theme.onSurface} />
            </View>
          </View>
        </Animated.View>

        {/* Frequently Asked */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(160)}
          layout={Layout.springify()}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
              Frequently asked
            </Text>

            <Pressable
              onPress={() => console.log("View all FAQs")}
              style={styles.viewAll}
            >
              <Text style={[styles.viewAllText, { color: theme.primaryDim }]}>
                View All
              </Text>
            </Pressable>
          </View>

          {filteredFAQs.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.faqRow}
            >
              {filteredFAQs.map((faq) => {
                const categoryColors = getCategoryColors(faq.category, theme);

                return (
                  <Pressable
                    key={faq.id}
                    onPress={() => openFAQ(faq)}
                    style={[
                      styles.faqCard,
                      {
                        backgroundColor: theme.surfaceVariant,
                        borderColor: "transparent",
                        boxShadow: isDark
                          ? "0px 0px 18px #0000004d"
                          : "0px 0px 18px #8681814d",
                        overflow: "hidden",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.faqQuestion,
                        {
                          color: theme.onSurface,
                        },
                      ]}
                      numberOfLines={4}
                    >
                      {faq.question}
                    </Text>

                    <View style={styles.faqBottom}>
                      <View style={styles.readMore}>
                        <Text
                          style={[
                            styles.readMoreText,
                            { color: theme.onSurfaceVariant },
                          ]}
                        >
                          Read article
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={13}
                          color={theme.onSurfaceVariant}
                        />
                      </View>

                      <Ionicons
                        name={faq.icon}
                        size={46}
                        color={categoryColors.icon}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.emptySearch,
                { backgroundColor: theme.surfaceVariant },
              ]}
            >
              <View style={[styles.emptyIcon]}>
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
                No results found
              </Text>

              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Try searching for something else.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Categories */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(240)}
          style={styles.categoriesSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
              Categories
            </Text>

            <Pressable
              onPress={() => console.log("View all categories")}
              style={styles.viewAll}
            >
              <Text style={[styles.viewAllText, { color: theme.primaryDim }]}>
                View All
              </Text>
            </Pressable>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInUp.duration(400).delay(280 + index * 45)}
                style={styles.categoryColumn}
              >
                <Pressable
                  onPress={() => openCategory(category)}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: theme.surfaceVariant,
                      borderColor: "transparent",
                      boxShadow: isDark
                        ? "0px 0px 18px #0000004d"
                        : "0px 0px 18px #8681814d",
                    },
                  ]}
                >
                  <View style={[styles.categoryIcon]}>
                    <Ionicons
                      name={category.icon}
                      size={22}
                      color={theme.primary}
                    />
                  </View>

                  <View style={styles.categoryContent}>
                    <Text
                      style={[styles.categoryTitle, { color: theme.onSurface }]}
                      numberOfLines={1}
                    >
                      {category.title}
                    </Text>

                    <Text
                      style={[
                        styles.categoryDescription,
                        { color: theme.onSurfaceVariant },
                      ]}
                      numberOfLines={1}
                    >
                      {category.articleCount} articles
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Still Need Help */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(500)}
          style={[
            styles.contactCard,
            { backgroundColor: theme.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.contactIcon,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={theme.primary}
            />
          </View>

          <View style={styles.contactContent}>
            <Text style={[styles.contactTitle, { color: theme.onSurface }]}>
              Still need help?
            </Text>

            <Text
              style={[
                styles.contactSubtitle,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Ask our AI assistant and get help with EchoStream.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward-circle"
            size={27}
            color={theme.primary}
          />
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Floating AI Chatbot */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(550)}
        style={styles.chatbotWrapper}
      >
        <Pressable
          onPress={() => router.push("/livechat")}
          style={({ pressed }) => [
            styles.chatbotButton,
            {
              backgroundColor: theme.surfaceVariant,
              transform: [{ scale: pressed ? 0.94 : 1 }],
              borderColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
        >
          <GamerTTSMascot height={80} width={80} />
          <View
            style={[
              styles.chatbotBadge,
              {
                backgroundColor: theme.primary,
                borderColor: theme.surfaceVariant,
              },
            ]}
          >
            <Text style={styles.chatbotBadgeText}>3</Text>
          </View>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topAmbientGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },

  bottomAmbientGlow: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  hero: {
    marginBottom: 30,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "92%",
    marginBottom: 20,
  },

  searchContainer: {
    height: 56,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 17,
    paddingRight: 7,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    paddingVertical: 0,
  },

  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewAllText: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  faqRow: {
    gap: 18,
    paddingRight: 20,
  },

  faqCard: {
    width: 205,
    height: 175,
    borderRadius: 18,
    padding: 16,
    justifyContent: "space-between",
  },

  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    paddingRight: 8,
  },

  faqBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  readMoreText: {
    fontSize: 10.5,
    fontWeight: "500",
  },

  emptySearch: {
    minHeight: 160,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  emptySubtitle: {
    fontSize: 11.5,
  },

  categoriesSection: {
    marginTop: 32,
  },

  categoryGrid: {
    gap: 10,
  },

  categoryColumn: {
    width: "100%",
  },

  categoryCard: {
    minHeight: 82,
    borderRadius: 17,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  categoryContent: {
    flex: 1,
    paddingRight: 10,
  },

  categoryTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 4,
  },

  categoryDescription: {
    fontSize: 10.5,
    lineHeight: 15,
  },

  contactCard: {
    borderRadius: 19,
    padding: 16,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  contactContent: {
    flex: 1,
    paddingRight: 10,
  },

  contactTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 4,
  },

  contactSubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
  },

  bottomSpace: {
    height: 40,
  },

  chatbotWrapper: {
    position: "absolute",
    right: 20,
    bottom: 25,
  },

  chatbotButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  chatbotBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  chatbotBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
});
