// E2E Test Timing Configuration
// Centralized timing values for natural user experience simulation

export const TestTiming = {
  // Hover and interaction delays
  hover: 1200,
  shortHover: 800,
  
  // UI transition delays
  uiTransition: 1500,
  longTransition: 2000,
  
  // Processing and loading delays
  processing: 3000,
  longProcessing: 4000,
  fileUpload: 2000,
  audioLoading: 2000,
  
  // Form and input delays
  typing: 1500,
  validation: 1500,
  
  // Navigation delays
  pageTransition: 2000,
  scrollDelay: 1500,
  
  // Animation delays
  animation: 3000,
  menuAnimation: 1500,
  themeTransition: 1500,
  
  // Search and API delays
  searchDelay: 3000,
  apiResponse: 3000,
  
  // Wizard-specific delays
  wizard: {
    stepTransition: 3000,
    saveDelay: 3000,
    analysisDelay: 4000,
    generationDelay: 4000,
    fileProcessing: 2000,
    voiceSample: 2000
  }
} as const

export const TestSelectors = {
  wizard: {
    container: '[data-testid="wizard-container"]',
    uploadArea: '.dropzone, [data-testid="upload-area"]',
    fileInput: 'input[type="file"]',
    continueButton: 'button:has-text("Continue"), .continue-button',
    saveButton: 'button:has-text("Continue"), button:has-text("Save")',
    generateButton: 'button:has-text("Generate"), button:has-text("Create")',
    progressIndicator: '.progress-indicator, .wizard-steps, .step-indicator',
    voiceCard: '.voice-card, .voice-option',
    sampleButton: 'button:has-text("Sample"), .sample-button, .play-button'
  },
  
  navigation: {
    mainNav: 'nav, .navigation, .navbar',
    navLinks: 'nav a, .nav-link',
    mobileToggle: '.mobile-menu-toggle, .hamburger, button:has-text("Menu"), .menu-button'
  },
  
  common: {
    loadingIndicator: '.animate-spin, .loading, .spinner',
    errorMessage: '.error, .text-red-500, .validation-error, :has-text("required")',
    successIndicator: '.success, .completed, .checkmark, :has-text("Success")'
  }
} as const

export const TestViewports = {
  mobile: {
    small: { width: 320, height: 568 },
    large: { width: 414, height: 896 },
    iphone15: { width: 393, height: 852 }
  },
  tablet: {
    portrait: { width: 768, height: 1024 },
    landscape: { width: 1024, height: 768 }
  },
  desktop: {
    small: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 }
  }
} as const