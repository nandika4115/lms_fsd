// Custom hook for components that need theme-aware styling
import { useTheme } from '../context/ThemeContext';

export const useThemeStyles = () => {
    const { isDark } = useTheme();
    
    return {
        // Card styles that work with your existing design
        cardStyle: {
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
            boxShadow: `0 4px 15px var(--card-shadow)`
        },
        
        // Button variants that maintain your existing colors
        buttonVariants: {
            primary: {
                backgroundColor: 'var(--btn-primary-bg)',
                borderColor: 'var(--btn-primary-border)'
            },
            secondary: {
                backgroundColor: 'var(--btn-secondary-bg)',
                borderColor: 'var(--btn-secondary-border)'
            },
            success: {
                backgroundColor: 'var(--btn-success-bg)',
                borderColor: 'var(--btn-success-border)'
            }
        },
        
        // Text styles
        textStyles: {
            primary: { color: 'var(--text-primary)' },
            secondary: { color: 'var(--text-secondary)' },
            muted: { color: 'var(--text-muted)' }
        },
        
        // Background styles
        backgroundStyles: {
            primary: { backgroundColor: 'var(--bg-primary)' },
            secondary: { backgroundColor: 'var(--bg-secondary)' },
            card: { backgroundColor: 'var(--card-bg)' }
        },
        
        // Your existing gradients work in both themes
        gradients: {
            primary: 'var(--gradient-primary)',
            secondary: 'var(--gradient-secondary)'
        },
        
        // Theme state
        isDark
    };
};