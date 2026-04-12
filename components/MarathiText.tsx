import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface MarathiTextProps extends TextProps {
  bold?: boolean;
  size?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export const MarathiText: React.FC<MarathiTextProps> = ({ 
  children, 
  style, 
  bold, 
  size = 16, 
  color = '#1f2937', 
  textAlign,
  ...props 
}) => {
  return (
    <Text 
      style={[
        styles.text, 
        { 
          fontSize: size, 
          color, 
          fontWeight: bold ? '700' : '400',
          textAlign
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    // We will load 'NotoSansDevanagari_400Regular' and 'NotoSansDevanagari_700Bold' in the root layout
    fontFamily: 'NotoSansDevanagari',
  },
});
