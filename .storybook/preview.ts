import type { Preview } from '@storybook/react-vite';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Enhanced accessibility addon configuration
    a11y: {
      // Configuration for @storybook/addon-a11y
      config: {
        rules: [
          // Enable color contrast checking
          {
            id: 'color-contrast',
            enabled: true,
          },
          // Enable keyboard navigation testing
          {
            id: 'focus-order-semantics',
            enabled: true,
          },
          // Enable form labeling
          {
            id: 'label',
            enabled: true,
          },
          // Enable button naming
          {
            id: 'button-name',
            enabled: true,
          },
          // Enable aria attributes
          {
            id: 'aria-valid-attr',
            enabled: true,
          },
          {
            id: 'aria-valid-attr-value',
            enabled: true,
          },
          // Enable heading structure
          {
            id: 'heading-order',
            enabled: true,
          },
        ],
      },
      // Manual testing mode - set to false for automatic testing
      manual: false
    },
    // Viewport configuration for responsive testing
    viewport: {
      viewports: {
        mobile1: {
          name: 'Mobile (iPhone SE)',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        mobile2: {
          name: 'Mobile (iPhone 12)',
          styles: {
            width: '390px',
            height: '844px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
      },
    },
    // Documentation configuration
    docs: {
      description: {
        component: 'Bushrun Race Day Application Components - Built with accessibility in mind',
      },
    },
  },
  // Tags for filtering stories
  tags: ['autodocs'],
};

export default preview;