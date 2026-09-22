import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-theme-color";

type BottomSheetProps = {
  visible: boolean;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
};

export default function BottomSheet({
  visible,
  title,
  icon,
  onClose,
  children,
  maxHeight = 0.82,
}: BottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

  const tabletWidth = Math.min(width - 48, 720);

  const sheetHeight = Math.min(
    height * maxHeight,
    isTablet ? 720 : height * maxHeight,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            paddingBottom: isTablet ? Math.max(insets.bottom, 24) : 0,
          },
        ]}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(220)}
          style={[
            styles.bottomSheet,
            isTablet ? styles.bottomSheetTablet : styles.bottomSheetPhone,
            {
              width: isTablet ? tabletWidth : "100%",
              maxHeight: sheetHeight,
              backgroundColor: theme.background,
              borderColor: theme.outline,
              paddingBottom: isTablet
                ? Math.max(insets.bottom, 18)
                : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.dragArea}>
            <View
              style={[
                styles.dragHandle,
                {
                  backgroundColor: theme.onSurfaceVariant,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.sheetHeader,
              {
                borderBottomColor: theme.outline,
              },
            ]}
          >
            <View style={styles.sheetTitleRow}>
              <View
                style={[
                  styles.sheetTitleIcon,
                  {
                    backgroundColor: theme.surfaceVariant,
                  },
                ]}
              >
                <Ionicons name={icon} size={20} color={theme.primary} />
              </View>

              <Text
                style={[
                  styles.sheetTitle,
                  {
                    color: theme.onSurface,
                  },
                ]}
              >
                {title}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.surfaceVariant,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.sheetContent,
              isTablet && styles.sheetContentTablet,
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },

  bottomSheet: {
    overflow: "hidden",
    borderWidth: 1,
  },

  bottomSheetPhone: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  bottomSheetTablet: {
    alignSelf: "center",
    borderRadius: 24,
  },

  dragArea: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    opacity: 0.55,
  },

  sheetHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  sheetTitleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },

  sheetContentTablet: {
    paddingBottom: 8,
  },
});
