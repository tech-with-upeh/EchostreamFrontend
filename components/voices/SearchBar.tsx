import { useAppTheme } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search by Voice Name",
}: SearchBarProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceVariant,
          borderWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.onSurfaceVariant}
        style={[styles.input, { color: theme.onSurface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
});
