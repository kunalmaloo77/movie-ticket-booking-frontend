import { createContext } from 'react';

// Lives in its own module so hot reloads of AuthContext.jsx (or anything it
// imports) never create a second context object that consumers can't see.
const AuthContext = createContext(null);

export default AuthContext;
