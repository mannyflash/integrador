/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
	],
	theme: {
    	container: {
    		center: 'true',
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'spin-slow': {
    				'0%': {
    					transform: 'rotate(0deg)'
    				},
    				'100%': {
    					transform: 'rotate(360deg)'
    				}
    			},
    			'pacman-move': {
    				'0%': {
    					left: '0'
    				},
    				'100%': {
    					left: 'calc(100% - 2rem)'
    				}
    			},
    			'pacman-top': {
    				'0%, 100%': {
    					transform: 'rotate(0deg)'
    				},
    				'50%': {
    					transform: 'rotate(-45deg)'
    				}
    			},
    			'pacman-bottom': {
    				'0%, 100%': {
    					transform: 'rotate(0deg)'
    				},
    				'50%': {
    					transform: 'rotate(45deg)'
    				}
    			},
    			'dot-disappear': {
    				'0%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '1'
    				},
    				'51%': {
    					opacity: '0'
    				},
    				'100%': {
    					opacity: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'spin-slow': 'spin-slow 3s linear infinite',
    			'spin-medium': 'spin-slow 2s linear infinite',
    			'spin-extra-slow': 'spin-slow 5s linear infinite',
    			'pacman-move': 'pacman-move 5s linear infinite',
    			'pacman-top': 'pacman-top 0.5s ease-in-out infinite',
    			'pacman-bottom': 'pacman-bottom 0.5s ease-in-out infinite',
    			'dot-disappear': 'dot-disappear 5s linear infinite'
    		},
    		boxShadow: {
    			neumorphic: '20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff',
    			'neumorphic-dark': '20px 20px 60px #1a1b1e, -20px -20px 60px #2e3035',
    			'neumorphic-inset': 'inset 6px 6px 12px #b8c3cf, inset -6px -6px 12px #ffffff',
    			'neumorphic-inset-dark': 'inset 6px 6px 12px #16171a, inset -6px -6px 12px #323539',
    			'neumorphic-button': '6px 6px 12px #b8c3cf, -6px -6px 12px #ffffff',
    			'neumorphic-button-dark': '6px 6px 12px #16171a, -6px -6px 12px #323539'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
  }
  
  