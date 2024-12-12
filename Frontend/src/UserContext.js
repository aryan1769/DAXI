import React, { createContext, useState, useContext } from 'react';

// Create a context for user data
const UserContext = createContext();

// Create a provider to manage global state
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Initial user state is null

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use the UserContext
export const useUser = () => {
    return useContext(UserContext);
};
