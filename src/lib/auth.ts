/**
 * Simple authentication utilities for ChefQuest
 * Using browser storage for demo purposes
 */

export interface User {
    id: string;
    name: string;
    email: string;
    picture?: string;
    provider: "google" | "demo";
}

const AUTH_STORAGE_KEY = "chefquest_user";

export const authService = {
    /**
     * Get current user from storage
     */
    getCurrentUser(): User | null {
        if (typeof window === "undefined") return null;
        
        try {
            const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!userJson) return null;
            return JSON.parse(userJson) as User;
        } catch (error) {
            return null;
        }
    },

    /**
     * Set current user in storage
     */
    setCurrentUser(user: User): void {
        if (typeof window === "undefined") return;
        
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            // Silently fail
        }
    },

    /**
     * Sign out user
     */
    signOut(): void {
        if (typeof window === "undefined") return;
        
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            window.location.href = "/login";
        } catch (error) {
            // Silently fail
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    },

    /**
     * Demo login (for testing without Google OAuth)
     */
    demoLogin(): User {
        const demoUser: User = {
            id: "demo-user",
            name: "Chef Demo",
            email: "demo@chefquest.com",
            picture: undefined,
            provider: "demo",
        };
        this.setCurrentUser(demoUser);
        return demoUser;
    },

    /**
     * Handle Google Sign-In response
     * In production, you would validate the token on the backend
     */
    handleGoogleSignIn(credential: any): User {
        // Parse JWT token (in production, validate on backend)
        try {
            const payload = JSON.parse(atob(credential.split('.')[1]));
            
            const user: User = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                provider: "google",
            };
            
            this.setCurrentUser(user);
            return user;
        } catch (error) {
            throw new Error("Failed to process Google Sign-In");
        }
    },
};

