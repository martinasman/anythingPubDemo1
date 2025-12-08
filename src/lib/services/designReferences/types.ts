/**
 * Design Reference Types
 *
 * Types for the visual inspiration analysis system.
 * Used to extract and apply design patterns from reference screenshots.
 */

export interface DesignInspiration {
  layout: {
    heroStyle: 'centered' | 'split' | 'full-bleed' | 'asymmetric' | 'minimal';
    gridPattern: 'single-column' | '2-column' | '3-column' | '4-column' | 'bento' | 'masonry';
    sectionSpacing: 'tight' | 'normal' | 'generous' | 'dramatic';
    navStyle: 'fixed-top' | 'transparent' | 'minimal' | 'hamburger-only' | 'centered-logo';
  };
  colorScheme: {
    dominantColor: string;      // Primary brand color hex
    accentColor: string;        // CTA/highlight color hex
    backgroundColor: string;    // Main background hex
    textColor: string;          // Primary text color hex
    backgroundStyle: 'light' | 'dark' | 'gradient' | 'image' | 'mixed';
  };
  typography: {
    headingStyle: 'bold-sans' | 'elegant-serif' | 'geometric' | 'display' | 'minimal';
    headingWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
    bodyFont: 'sans-serif' | 'serif' | 'mono';
    textDensity: 'minimal' | 'balanced' | 'content-rich';
  };
  components: {
    buttonStyle: 'rounded-full' | 'rounded' | 'sharp' | 'outline' | 'ghost' | 'gradient';
    cardStyle: 'flat' | 'elevated' | 'bordered' | 'glassmorphic' | 'minimal';
    imageStyle: 'rounded' | 'sharp' | 'circular' | 'masked' | 'full-bleed';
  };
  effects: {
    hasAnimations: boolean;
    hasShadows: boolean;
    hasGradients: boolean;
    hasGlassmorphism: boolean;
    hasParallax: boolean;
    hasHoverEffects: boolean;
  };
  tailwindClasses: {
    hero: string;
    sections: string;
    cards: string;
    buttons: string;
    headings: string;
    body: string;
  };
  // Section structure - the actual sections visible in the screenshot
  sectionStructure: {
    order: string[];  // e.g., ['hero', 'clients', 'services', 'about', 'testimonials', 'cta', 'footer']
    sections: {
      [key: string]: {
        layout: string;           // 'centered', 'grid-3', 'split-left', 'split-right', etc.
        hasImage: boolean;
        hasCards: boolean;
        cardCount?: number;
        hasIcons?: boolean;
        description: string;      // "3-column service cards with icons and descriptions"
        tailwindClasses: string;  // Section-specific Tailwind classes
      };
    };
  };
  overallVibe: string;  // Free-form description of the design feeling
  designNotes: string;  // Additional observations for the AI
}

export interface AnalysisCache {
  analyzedAt: string;
  imageHash: string;
  inspiration: DesignInspiration;
}
